import { useState } from 'react';
import {
  Award,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  FolderKanban,
  Globe,
  GraduationCap,
  Laptop,
  Library,
  Mail,
  ShieldCheck,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type {
  AppIconColor,
  AppIconName,
  AppIconStyle,
} from './validators.ts';

export const APP_ICON_OPTIONS: Array<{
  name: AppIconName;
  label: string;
  Icon: LucideIcon;
}> = [
  { name: 'GraduationCap', label: 'Akademik', Icon: GraduationCap },
  { name: 'BookOpen', label: 'Materi', Icon: BookOpen },
  { name: 'Laptop', label: 'E-Learning', Icon: Laptop },
  { name: 'ClipboardCheck', label: 'Ujian', Icon: ClipboardCheck },
  { name: 'Calendar', label: 'Jadwal', Icon: Calendar },
  { name: 'Library', label: 'Pustaka', Icon: Library },
  { name: 'Users', label: 'Siswa/Guru', Icon: Users },
  { name: 'FileSpreadsheet', label: 'Rapor/Data', Icon: FileSpreadsheet },
  { name: 'Globe', label: 'Web Portal', Icon: Globe },
  { name: 'Mail', label: 'Surel', Icon: Mail },
  { name: 'Video', label: 'Kelas Live', Icon: Video },
  { name: 'Award', label: 'Prestasi', Icon: Award },
  { name: 'Building2', label: 'Sekolah', Icon: Building2 },
  { name: 'Calculator', label: 'Keuangan', Icon: Calculator },
  { name: 'FolderKanban', label: 'Proyek', Icon: FolderKanban },
  { name: 'ShieldCheck', label: 'Keamanan', Icon: ShieldCheck },
];

export const APP_ICON_COLORS: Array<{
  id: AppIconColor;
  label: string;
  tileClass: string;
  tile3dMdClass: string;
  tile3dSmClass: string;
  swatchClass: string;
}> = [
  {
    id: 'blue',
    label: 'Biru',
    tileClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    tile3dMdClass:
      'bg-gradient-to-br from-sky-400 via-blue-600 to-blue-800 text-white border border-blue-400/50 shadow-[0_5px_0_0_#1e3a8a,0_12px_20px_-6px_rgba(30,58,138,0.48),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.22)]',
    tile3dSmClass:
      'bg-gradient-to-br from-sky-400 via-blue-600 to-blue-800 text-white border border-blue-400/50 shadow-[0_3px_0_0_#1e3a8a,0_6px_12px_-4px_rgba(30,58,138,0.42),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1.5px_3px_rgba(0,0,0,0.22)]',
    swatchClass: 'bg-blue-600',
  },
  {
    id: 'emerald',
    label: 'Hijau',
    tileClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
    tile3dMdClass:
      'bg-gradient-to-br from-teal-400 via-emerald-600 to-emerald-800 text-white border border-emerald-300/50 shadow-[0_5px_0_0_#064e3b,0_12px_20px_-6px_rgba(6,78,59,0.48),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.22)]',
    tile3dSmClass:
      'bg-gradient-to-br from-teal-400 via-emerald-600 to-emerald-800 text-white border border-emerald-300/50 shadow-[0_3px_0_0_#064e3b,0_6px_12px_-4px_rgba(6,78,59,0.42),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1.5px_3px_rgba(0,0,0,0.22)]',
    swatchClass: 'bg-emerald-600',
  },
  {
    id: 'indigo',
    label: 'Indigo',
    tileClass:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/80',
    tile3dMdClass:
      'bg-gradient-to-br from-indigo-400 via-indigo-600 to-indigo-800 text-white border border-indigo-300/50 shadow-[0_5px_0_0_#312e81,0_12px_20px_-6px_rgba(49,46,129,0.48),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.22)]',
    tile3dSmClass:
      'bg-gradient-to-br from-indigo-400 via-indigo-600 to-indigo-800 text-white border border-indigo-300/50 shadow-[0_3px_0_0_#312e81,0_6px_12px_-4px_rgba(49,46,129,0.42),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1.5px_3px_rgba(0,0,0,0.22)]',
    swatchClass: 'bg-indigo-600',
  },
  {
    id: 'amber',
    label: 'Kuning',
    tileClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    tile3dMdClass:
      'bg-gradient-to-br from-amber-300 via-amber-500 to-orange-700 text-white border border-amber-200/60 shadow-[0_5px_0_0_#92400e,0_12px_20px_-6px_rgba(146,64,14,0.45),inset_0_1.5px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]',
    tile3dSmClass:
      'bg-gradient-to-br from-amber-300 via-amber-500 to-orange-700 text-white border border-amber-200/60 shadow-[0_3px_0_0_#92400e,0_6px_12px_-4px_rgba(146,64,14,0.4),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1.5px_3px_rgba(0,0,0,0.2)]',
    swatchClass: 'bg-amber-600',
  },
  {
    id: 'rose',
    label: 'Merah',
    tileClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
    tile3dMdClass:
      'bg-gradient-to-br from-rose-400 via-rose-600 to-red-800 text-white border border-rose-300/50 shadow-[0_5px_0_0_#881337,0_12px_20px_-6px_rgba(136,19,55,0.48),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.22)]',
    tile3dSmClass:
      'bg-gradient-to-br from-rose-400 via-rose-600 to-red-800 text-white border border-rose-300/50 shadow-[0_3px_0_0_#881337,0_6px_12px_-4px_rgba(136,19,55,0.42),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1.5px_3px_rgba(0,0,0,0.22)]',
    swatchClass: 'bg-rose-600',
  },
  {
    id: 'slate',
    label: 'Netral',
    tileClass:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    tile3dMdClass:
      'bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900 text-white border border-slate-400/40 shadow-[0_5px_0_0_#0f172a,0_12px_20px_-6px_rgba(15,23,42,0.5),inset_0_1.5px_0_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.3)]',
    tile3dSmClass:
      'bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900 text-white border border-slate-400/40 shadow-[0_3px_0_0_#0f172a,0_6px_12px_-4px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1.5px_3px_rgba(0,0,0,0.3)]',
    swatchClass: 'bg-slate-700',
  },
];

export function AppIconBadge({
  iconName,
  iconColor,
  iconStyle = '3d',
  size = 'md',
}: {
  iconName: AppIconName;
  iconColor: AppIconColor;
  iconStyle?: AppIconStyle;
  size?: 'sm' | 'md' | 'lg';
}) {
  const iconEntry =
    APP_ICON_OPTIONS.find((item) => item.name === iconName) ||
    APP_ICON_OPTIONS[8];
  const colorEntry =
    APP_ICON_COLORS.find((item) => item.id === iconColor) ||
    APP_ICON_COLORS[0];

  const Icon = iconEntry.Icon;

  const boxSize =
    size === 'sm'
      ? 'h-9 w-9 rounded-lg'
      : size === 'lg'
        ? 'h-14 w-14 rounded-2xl'
        : 'h-12 w-12 rounded-xl';

  const iconSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';

  if (iconStyle === 'flat') {
    return (
      <div
        className={`${boxSize} ${colorEntry.tileClass} flex shrink-0 items-center justify-center border`}
      >
        <Icon className={iconSize} />
      </div>
    );
  }

  const surface3d =
    size === 'sm' ? colorEntry.tile3dSmClass : colorEntry.tile3dMdClass;

  return (
    <div
      className={`${boxSize} ${surface3d} relative flex shrink-0 items-center justify-center overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
      />
      <Icon
        aria-hidden="true"
        strokeWidth={2.2}
        className={`${iconSize} pointer-events-none absolute translate-x-[0.5px] translate-y-[1.5px] text-black/25`}
      />
      <Icon
        strokeWidth={2.1}
        className={`${iconSize} relative z-10 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)]`}
      />
    </div>
  );
}

export function SchoolLogoFrame({
  logoUrl,
  title,
  size = 'lg',
}: {
  logoUrl: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);

  const frameSize =
    size === 'sm'
      ? 'h-9 w-9 rounded-lg'
      : size === 'md'
        ? 'h-12 w-12 rounded-xl'
        : 'h-20 w-20 rounded-2xl';

  const iconSize =
    size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-10 w-10';

  if (logoUrl && !failed) {
    return (
      <div
        className={`${frameSize} flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900`}
      >
        <img
          src={logoUrl}
          alt={`Logo ${title}`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`Logo ${title}`}
      className={`${frameSize} relative flex shrink-0 items-center justify-center overflow-hidden border border-blue-400/50 bg-gradient-to-br from-sky-400 via-blue-600 to-blue-800 text-white shadow-[0_5px_0_0_#1e3a8a,0_10px_18px_-6px_rgba(30,58,138,0.45),inset_0_1.5px_0_rgba(255,255,255,0.45)]`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
      />
      <GraduationCap
        className={`${iconSize} relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]`}
      />
    </div>
  );
}
