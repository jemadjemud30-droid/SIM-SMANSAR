import type {
  AdminAuthStatus,
  AppIconColor,
  AppIconName,
  AppIconStyle,
  AuthProviderMode,
  CategoryItem,
  LinkCategory,
  SchoolSettings,
  TeacherAuthStatus,
  WebLink,
} from '../types.ts';

let adminSessionToken: string | null = null;
let teacherSessionToken: string | null = null;

export function setAdminSessionToken(token: string | null) {
  adminSessionToken = token;
}

export function hasAdminSessionToken(): boolean {
  return Boolean(adminSessionToken);
}

export function setTeacherSessionToken(token: string | null) {
  teacherSessionToken = token;
}

export function hasTeacherSessionToken(): boolean {
  return Boolean(teacherSessionToken);
}

type AuthScope = 'public' | 'teacher' | 'admin';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  authScope: AuthScope = 'public'
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (authScope === 'admin') {
    if (!adminSessionToken) {
      throw new Error('Sesi Admin tidak aktif. Silakan login kembali.');
    }
    headers.set('Authorization', `Bearer ${adminSessionToken}`);
  } else if (authScope === 'teacher') {
    const token = teacherSessionToken || adminSessionToken;
    if (!token) {
      throw new Error('Sesi Guru tidak aktif. Silakan masuk terlebih dahulu.');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Terjadi kesalahan pada server.'
    );
  }
  return data as T;
}

export const api = {
  // Public Student Portal
  getPortal: () =>
    request<{
      provider: AuthProviderMode;
      schoolSettings: SchoolSettings;
      links: WebLink[];
      categories: CategoryItem[];
    }>('/api/portal'),

  recordClick: (id: number, scope: 'student' | 'teacher' = 'student') =>
    request<{ id: number; clickCount: number }>(
      `/api/links/${id}/click`,
      { method: 'POST' },
      scope === 'teacher' ? 'teacher' : 'public'
    ),

  // Teacher Auth & Portal
  getTeacherStatus: () => request<TeacherAuthStatus>('/api/teacher/status'),

  loginTeacher: (password: string) =>
    request<{ token: string }>('/api/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getTeacherPortal: () =>
    request<{
      schoolSettings: SchoolSettings;
      links: WebLink[];
      categories: CategoryItem[];
    }>('/api/teacher/portal', {}, 'teacher'),

  // Admin Auth & Settings
  getAdminStatus: () => request<AdminAuthStatus>('/api/admin/status'),

  setupAdminPassword: (password: string) =>
    request<{ token: string }>('/api/admin/setup-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  loginAdmin: (password: string) =>
    request<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  changeAdminPassword: (newPassword: string) =>
    request<{ updated: boolean }>(
      '/api/admin/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      },
      'admin'
    ),

  updateTeacherPassword: (newPassword: string) =>
    request<{ updated: boolean }>(
      '/api/admin/teacher-password',
      {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      },
      'admin'
    ),

  getAdminLinks: () =>
    request<{ links: WebLink[]; categories: CategoryItem[] }>(
      '/api/admin/links',
      {},
      'admin'
    ),

  createCategory: (name: string) =>
    request<{ category: CategoryItem }>(
      '/api/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      },
      'admin'
    ),

  renameCategory: (id: number, name: string) =>
    request<{ category: CategoryItem }>(
      `/api/admin/categories/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      },
      'admin'
    ),

  deleteCategory: (id: number) =>
    request<{ deletedId: number }>(
      `/api/admin/categories/${id}`,
      {
        method: 'DELETE',
      },
      'admin'
    ),

  createAdminLink: (payload: {
    title: string;
    url: string;
    description: string;
    category: LinkCategory;
    iconName: AppIconName;
    iconColor: AppIconColor;
    iconStyle: AppIconStyle;
    forStudents: boolean;
    forTeachers: boolean;
    isPublished: boolean;
    isPinned: boolean;
  }) =>
    request<{ link: WebLink }>(
      '/api/admin/links',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      'admin'
    ),

  updateAdminLink: (
    id: number,
    payload: {
      title?: string;
      url?: string;
      description?: string;
      category?: LinkCategory;
      iconName?: AppIconName;
      iconColor?: AppIconColor;
      iconStyle?: AppIconStyle;
      forStudents?: boolean;
      forTeachers?: boolean;
      isPublished?: boolean;
      isPinned?: boolean;
    }
  ) =>
    request<{ link: WebLink }>(
      `/api/admin/links/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      'admin'
    ),

  deleteAdminLink: (id: number) =>
    request<{ deletedId: number }>(
      `/api/admin/links/${id}`,
      {
        method: 'DELETE',
      },
      'admin'
    ),

  seedAdminLinks: () =>
    request<{ links: WebLink[] }>(
      '/api/admin/links/seed',
      {
        method: 'POST',
      },
      'admin'
    ),

  updateSchoolSettings: (payload: {
    logoUrl: string;
    title1: string;
    title2: string;
    title3: string;
  }) =>
    request<{ schoolSettings: SchoolSettings }>(
      '/api/admin/school',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      'admin'
    ),
};
