import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FolderPlus,
  Globe,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Settings2,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { AppIconBadge, SchoolLogoFrame } from '../lib/app-icons.tsx';
import type {
  AdminTab,
  CategoryItem,
  SchoolSettings,
  WebLink,
} from '../types.ts';
import { SchoolSettingsPanel } from './SchoolSettingsPanel.tsx';

type AudienceFilter = 'all' | 'student' | 'teacher' | 'teacher_only';

interface AdminWorkspaceProps {
  settings: SchoolSettings;
  links: WebLink[];
  categories: CategoryItem[];
  isLoading: boolean;
  isEnvManagedPassword: boolean;
  teacherPasswordConfigured: boolean;
  isTeacherEnvManaged: boolean;
  isDark: boolean;
  copiedId: number | null;
  onToggleTheme: () => void;
  onViewLanding: () => void;
  onViewStudentPortal: () => void;
  onViewTeacherPortal: () => void;
  onLogoutAdmin: () => void;
  onOpenCreateLink: () => void;
  onOpenCategoryManager: () => void;
  onEditLink: (link: WebLink) => void;
  onDeleteLink: (link: WebLink) => void;
  onTogglePublish: (link: WebLink) => void;
  onTogglePin: (link: WebLink) => void;
  onToggleAudience: (
    link: WebLink,
    target: 'forStudents' | 'forTeachers'
  ) => void;
  onCopyUrl: (link: WebLink) => void;
  onSeedStarter: () => void;
  onTeacherPasswordUpdated: () => void;
  onSaveSchoolSettings: (payload: {
    logoUrl: string;
    title1: string;
    title2: string;
    title3: string;
  }) => Promise<void>;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

function formatHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export function AdminWorkspace({
  settings,
  links,
  categories,
  isLoading,
  isEnvManagedPassword,
  teacherPasswordConfigured,
  isTeacherEnvManaged,
  isDark,
  copiedId,
  onToggleTheme,
  onViewLanding,
  onViewStudentPortal,
  onViewTeacherPortal,
  onLogoutAdmin,
  onOpenCreateLink,
  onOpenCategoryManager,
  onEditLink,
  onDeleteLink,
  onTogglePublish,
  onTogglePin,
  onToggleAudience,
  onCopyUrl,
  onSeedStarter,
  onTeacherPasswordUpdated,
  onSaveSchoolSettings,
  onNotify,
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('links');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = useMemo(
    () => ({
      total: links.length,
      studentApps: links.filter((l) => l.isPublished && l.forStudents).length,
      teacherApps: links.filter((l) => l.isPublished && l.forTeachers).length,
      clicks: links.reduce((sum, l) => sum + l.clickCount, 0),
    }),
    [links]
  );

  const filterNames = useMemo(
    () => ['Semua', ...categories.map((c) => c.name)],
    [categories]
  );

  const filteredLinks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return links.filter((item) => {
      if (categoryFilter !== 'Semua' && item.category !== categoryFilter) {
        return false;
      }
      if (audienceFilter === 'student' && !item.forStudents) return false;
      if (audienceFilter === 'teacher' && !item.forTeachers) return false;
      if (
        audienceFilter === 'teacher_only' &&
        (item.forStudents || !item.forTeachers)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [links, searchQuery, categoryFilter, audienceFilter]);

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <SchoolLogoFrame
              logoUrl={settings.logoUrl}
              title={settings.title1}
              size="sm"
            />
            <span className="truncate font-display text-sm font-bold text-slate-900 dark:text-white">
              Panel Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu admin"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Navigasi Admin" className="space-y-1 px-3 py-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('links');
              setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'links'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              <Globe
                className={`h-4 w-4 ${
                  activeTab === 'links'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-400'
                }`}
              />
              <span>Publikasi Link</span>
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCategoryManager();
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
          >
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              <Settings2 className="h-4 w-4 text-slate-400" />
              <span>Kelola Kategori</span>
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              <Settings
                className={`h-4 w-4 ${
                  activeTab === 'settings'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-400'
                }`}
              />
              <span>Pengaturan Sekolah</span>
            </span>
          </button>
        </nav>

        <div className="mx-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="px-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            Pratinjau Portal
          </p>
          <div className="mt-2 space-y-1">
            <button
              type="button"
              onClick={onViewLanding}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
            >
              <Home className="h-4 w-4 text-slate-400" />
              <span>Halaman Depan</span>
            </button>
            <button
              type="button"
              onClick={onViewStudentPortal}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
            >
              <GraduationCap className="h-4 w-4 text-slate-400" />
              <span>Portal Siswa</span>
            </button>
            <button
              type="button"
              onClick={onViewTeacherPortal}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
            >
              <BookOpenCheck className="h-4 w-4 text-slate-400" />
              <span>Portal Guru</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
          {settings.title1}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Sesi Administrator Aktif
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Terang</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Gelap</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLogoutAdmin}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
        {sidebarBody}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px]"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-slate-200 shadow-xl dark:border-slate-800">
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 backdrop-blur-sm lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu admin"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
                Admin
              </span>
              <span
                aria-hidden="true"
                className="hidden text-slate-300 sm:inline dark:text-slate-700"
              >
                /
              </span>
              <h1 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'links'
                  ? 'Publikasi & Kelola Link Aplikasi'
                  : 'Pengaturan Sekolah & Akses'}
              </h1>
            </div>
          </div>

          {activeTab === 'links' && (
            <button
              type="button"
              onClick={onOpenCreateLink}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              <span>Tempel & Tambah Link</span>
            </button>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 lg:px-8">
          {activeTab === 'settings' ? (
            <SchoolSettingsPanel
              settings={settings}
              isEnvManagedPassword={isEnvManagedPassword}
              teacherPasswordConfigured={teacherPasswordConfigured}
              isTeacherEnvManaged={isTeacherEnvManaged}
              onTeacherPasswordUpdated={onTeacherPasswordUpdated}
              onSaveSettings={onSaveSchoolSettings}
              onNotify={onNotify}
            />
          ) : (
            <div className="space-y-6">
              <section className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                <div className="px-5 py-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Total Link
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Konsumsi Siswa
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-blue-700 tabular-nums dark:text-blue-400">
                    {stats.studentApps}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Akses Guru
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                    {stats.teacherApps}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Total Klik
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-white">
                    {stats.clicks}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative flex-1 lg:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama aplikasi atau alamat URL..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                      {(
                        [
                          { id: 'all', label: 'Semua Akses' },
                          { id: 'student', label: 'Siswa' },
                          { id: 'teacher', label: 'Guru' },
                          { id: 'teacher_only', label: 'Khusus Guru' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAudienceFilter(opt.id)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                            audienceFilter === opt.id
                              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>Atur Kategori</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                  {filterNames.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        categoryFilter === cat
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>

              {isLoading && links.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Memuat daftar link aplikasi...
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {links.length === 0
                      ? 'Belum ada link aplikasi'
                      : 'Tidak ada aplikasi yang cocok'}
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    {links.length === 0
                      ? 'Tempel link web baru beserta ikon 3D aplikasinya atau muat contoh aplikasi sekolah.'
                      : 'Ubah kata kunci pencarian, target akses, atau pilih kategori Semua.'}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onOpenCreateLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tempel & Tambah Link</span>
                    </button>
                    {links.length === 0 && (
                      <button
                        type="button"
                        onClick={onSeedStarter}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <FolderPlus className="h-4 w-4" />
                        <span>Muat Contoh Aplikasi</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                          <th className="px-5 py-3.5">Ikon & Aplikasi</th>
                          <th className="hidden px-4 py-3.5 lg:table-cell">
                            Kategori
                          </th>
                          <th className="px-4 py-3.5">Target Akses</th>
                          <th className="hidden px-4 py-3.5 sm:table-cell">
                            Status
                          </th>
                          <th className="px-4 py-3.5 text-right">Klik</th>
                          <th className="px-5 py-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        {filteredLinks.map((link) => {
                          const isCopied = copiedId === link.id;
                          return (
                            <tr
                              key={link.id}
                              className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <AppIconBadge
                                    iconName={link.iconName}
                                    iconColor={link.iconColor}
                                    iconStyle={link.iconStyle}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-display font-semibold text-slate-900 dark:text-white">
                                        {link.title}
                                      </span>
                                      {link.isPinned && (
                                        <span className="text-xs font-medium text-blue-700 whitespace-nowrap dark:text-blue-400">
                                          · Unggulan
                                        </span>
                                      )}
                                    </div>
                                    <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                                      {formatHostname(link.url)}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="hidden px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap lg:table-cell dark:text-slate-300">
                                {link.category}
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleAudience(link, 'forStudents')
                                    }
                                    title={
                                      link.forStudents
                                        ? 'Nonaktifkan untuk Siswa'
                                        : 'Aktifkan untuk Siswa'
                                    }
                                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                      link.forStudents
                                        ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                                        : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
                                    }`}
                                  >
                                    Siswa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleAudience(link, 'forTeachers')
                                    }
                                    title={
                                      link.forTeachers
                                        ? 'Nonaktifkan untuk Guru'
                                        : 'Aktifkan untuk Guru'
                                    }
                                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                      link.forTeachers
                                        ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                                        : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
                                    }`}
                                  >
                                    Guru
                                  </button>
                                </div>
                              </td>

                              <td className="hidden px-4 py-3.5 text-xs font-medium whitespace-nowrap sm:table-cell">
                                <span
                                  className={
                                    link.isPublished
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }
                                >
                                  {link.isPublished ? 'Terpublikasi' : 'Draf'}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap dark:text-slate-300">
                                {link.clickCount}
                              </td>

                              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end gap-1">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Buka URL"
                                    aria-label={`Buka ${link.title}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => onCopyUrl(link)}
                                    title="Salin URL"
                                    aria-label={`Salin URL ${link.title}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                  >
                                    {isCopied ? (
                                      <Check className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onTogglePublish(link)}
                                    title={
                                      link.isPublished
                                        ? 'Sembunyikan dari portal'
                                        : 'Publikasikan ke portal'
                                    }
                                    aria-label={`Ubah status publikasi ${link.title}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                  >
                                    {link.isPublished ? (
                                      <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onTogglePin(link)}
                                    title={
                                      link.isPinned
                                        ? 'Lepas unggulan'
                                        : 'Jadikan unggulan'
                                    }
                                    aria-label={`Sematkan ${link.title}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                  >
                                    {link.isPinned ? (
                                      <PinOff className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                                    ) : (
                                      <Pin className="h-4 w-4" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onEditLink(link)}
                                    title="Edit aplikasi"
                                    aria-label={`Edit ${link.title}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteLink(link)}
                                    title="Hapus aplikasi"
                                    aria-label={`Hapus ${link.title}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
