export const DEFAULT_CATEGORIES = [
  'Akademik',
  'Pembelajaran',
  'Administrasi',
  'Alat',
  'Referensi',
  'Umum',
] as const;

export type LinkCategory = string;

export const ALLOWED_ICON_NAMES = [
  'Globe',
  'GraduationCap',
  'BookOpen',
  'ClipboardCheck',
  'Calendar',
  'Users',
  'FileSpreadsheet',
  'Library',
  'Mail',
  'Video',
  'Laptop',
  'Award',
  'Building2',
  'Calculator',
  'FolderKanban',
  'ShieldCheck',
] as const;

export const ALLOWED_ICON_COLORS = [
  'blue',
  'emerald',
  'indigo',
  'amber',
  'rose',
  'slate',
] as const;

export const ALLOWED_ICON_STYLES = ['3d', 'flat'] as const;

export type AppIconName = (typeof ALLOWED_ICON_NAMES)[number];
export type AppIconColor = (typeof ALLOWED_ICON_COLORS)[number];
export type AppIconStyle = (typeof ALLOWED_ICON_STYLES)[number];
export type UserRole = 'admin' | 'teacher' | 'student';

export function normalizeAndValidateHttpUrl(rawInput: unknown): {
  valid: boolean;
  url?: string;
  hostname?: string;
  error?: string;
} {
  if (typeof rawInput !== 'string') {
    return { valid: false, error: 'URL harus berupa teks yang valid.' };
  }

  let candidate = rawInput.trim();
  if (!candidate) {
    return { valid: false, error: 'Alamat URL wajib diisi.' };
  }

  const lower = candidate.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return {
      valid: false,
      error: 'Hanya protokol http:// atau https:// yang diizinkan.',
    };
  }

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Hanya protokol http:// atau https:// yang diizinkan.',
      };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        error: 'Format domain URL tidak valid (contoh: https://sekolah.sch.id).',
      };
    }
    return {
      valid: true,
      url: parsed.toString(),
      hostname: parsed.hostname.replace(/^www\./, ''),
    };
  } catch {
    return { valid: false, error: 'Alamat URL tidak valid.' };
  }
}

export function validateLogoSource(rawInput: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (rawInput === '' || rawInput === null || rawInput === undefined) {
    return { valid: true, value: '' };
  }
  if (typeof rawInput !== 'string') {
    return { valid: false, error: 'Sumber logo tidak valid.' };
  }
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: true, value: '' };
  }

  // Allow safe raster image Data URLs up to ~550KB
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length > 750_000) {
      return {
        valid: false,
        error: 'Ukuran file logo terlalu besar (maksimal sekitar 500 KB).',
      };
    }
    return { valid: true, value: trimmed };
  }

  const httpCheck = normalizeAndValidateHttpUrl(trimmed);
  if (httpCheck.valid && httpCheck.url) {
    return { valid: true, value: httpCheck.url };
  }

  return {
    valid: false,
    error:
      'Logo harus berupa URL gambar https:// atau unggahan file PNG/JPG/WebP.',
  };
}

export function sanitizeLinkTitle(rawTitle: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof rawTitle !== 'string') {
    return { valid: false, error: 'Judul aplikasi wajib diisi.' };
  }
  const trimmed = rawTitle.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Judul aplikasi minimal 2 karakter.' };
  }
  if (trimmed.length > 120) {
    return { valid: false, error: 'Judul aplikasi maksimal 120 karakter.' };
  }
  return { valid: true, value: trimmed };
}

export function sanitizeSchoolTitle(
  rawValue: unknown,
  label: string,
  required = false
): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof rawValue !== 'string') {
    return required
      ? { valid: false, error: `${label} wajib diisi.` }
      : { valid: true, value: '' };
  }
  const trimmed = rawValue.trim().slice(0, 160);
  if (required && trimmed.length < 2) {
    return { valid: false, error: `${label} minimal 2 karakter.` };
  }
  return { valid: true, value: trimmed };
}

export function sanitizeDescription(rawDesc: unknown): string {
  if (typeof rawDesc !== 'string') {
    return '';
  }
  return rawDesc.trim().slice(0, 400);
}

export function sanitizeCategoryName(rawCategory: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof rawCategory !== 'string') {
    return { valid: false, error: 'Nama kategori wajib diisi.' };
  }
  const trimmed = rawCategory.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2) {
    return { valid: false, error: 'Nama kategori minimal 2 karakter.' };
  }
  if (trimmed.length > 40) {
    return { valid: false, error: 'Nama kategori maksimal 40 karakter.' };
  }
  return { valid: true, value: trimmed };
}

export function sanitizeCategory(rawCategory: unknown): LinkCategory {
  const check = sanitizeCategoryName(rawCategory);
  return check.valid && check.value ? check.value : 'Umum';
}

export function sanitizeIconName(rawIcon: unknown): AppIconName {
  if (
    typeof rawIcon === 'string' &&
    (ALLOWED_ICON_NAMES as readonly string[]).includes(rawIcon)
  ) {
    return rawIcon as AppIconName;
  }
  return 'Globe';
}

export function sanitizeIconColor(rawColor: unknown): AppIconColor {
  if (
    typeof rawColor === 'string' &&
    (ALLOWED_ICON_COLORS as readonly string[]).includes(rawColor)
  ) {
    return rawColor as AppIconColor;
  }
  return 'blue';
}

export function sanitizeIconStyle(rawStyle: unknown): AppIconStyle {
  if (
    typeof rawStyle === 'string' &&
    (ALLOWED_ICON_STYLES as readonly string[]).includes(rawStyle)
  ) {
    return rawStyle as AppIconStyle;
  }
  return '3d';
}
