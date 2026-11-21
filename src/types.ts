import type {
  AppIconColor,
  AppIconName,
  AppIconStyle,
  LinkCategory,
} from './lib/validators.ts';

export type { AppIconColor, AppIconName, AppIconStyle, LinkCategory };

export type AuthProviderMode = 'supabase' | 'cloudsql';
export type PortalView = 'landing' | 'student' | 'teacher' | 'admin';
export type AdminTab = 'links' | 'settings';

export interface CategoryItem {
  id: number;
  name: string;
  sortOrder: number;
  createdAt?: string;
}

export interface SchoolSettings {
  logoUrl: string;
  title1: string;
  title2: string;
  title3: string;
  updatedAt: string;
}

export interface WebLink {
  id: number;
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
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuthStatus {
  needsInitialSetup: boolean;
  isEnvManaged: boolean;
  teacherPasswordConfigured: boolean;
  isTeacherEnvManaged: boolean;
  provider: AuthProviderMode;
}

export interface TeacherAuthStatus {
  isConfigured: boolean;
  isEnvManaged: boolean;
}
