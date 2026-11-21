import type { NextFunction, Request, Response } from 'express';
import {
  parseAndVerifyRoleToken,
  verifyAdminToken,
  verifyTeacherToken,
  type SessionTokenRole,
} from '../lib/admin-auth.ts';

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Sesi Admin tidak ditemukan. Silakan masukkan password Admin.',
    });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({
      error: 'Sesi Admin tidak valid atau telah berakhir. Silakan login ulang.',
    });
    return;
  }

  next();
}

export function requireTeacherAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Sesi Guru tidak ditemukan. Silakan masuk sebagai Guru.',
    });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || !verifyTeacherToken(token)) {
    res.status(401).json({
      error: 'Sesi Guru tidak valid atau telah berakhir. Silakan login ulang.',
    });
    return;
  }

  next();
}

export function getRequestTokenRole(req: Request): SessionTokenRole | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  return parseAndVerifyRoleToken(token);
}
