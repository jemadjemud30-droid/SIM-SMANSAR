import crypto from 'crypto';

const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() ||
  crypto.randomBytes(32).toString('hex');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export type SessionTokenRole = 'admin' | 'teacher';

export function getEnvAdminPassword(): string | null {
  const raw = process.env.ADMIN_PASSWORD?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function getEnvTeacherPassword(): string | null {
  const raw = process.env.TEACHER_PASSWORD?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasswordScrypt(
  candidate: string,
  storedHash: string
): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(candidate, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

export function verifyEnvPasswordConstantTime(
  candidate: string,
  expected: string
): boolean {
  const candidateDigest = crypto.createHash('sha256').update(candidate).digest();
  const expectedDigest = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateDigest, expectedDigest);
}

export function issueRoleToken(role: SessionTokenRole): string {
  const payload = {
    role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
    jti: crypto.randomBytes(12).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function issueAdminToken(): string {
  return issueRoleToken('admin');
}

export function issueTeacherToken(): string {
  return issueRoleToken('teacher');
}

export function parseAndVerifyRoleToken(
  token: string
): SessionTokenRole | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(sigB64);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const decoded = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as {
      role?: string;
      exp?: number;
    };

    if (typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    if (decoded.role === 'admin' || decoded.role === 'teacher') {
      return decoded.role;
    }
    return null;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): boolean {
  return parseAndVerifyRoleToken(token) === 'admin';
}

export function verifyTeacherToken(token: string): boolean {
  const role = parseAndVerifyRoleToken(token);
  return role === 'teacher' || role === 'admin';
}
