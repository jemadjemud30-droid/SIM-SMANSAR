import { useMemo, useState } from 'react';
import {
  ExternalLink,
  LogOut,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { AppIconBadge, SchoolLogoFrame } from '../lib/app-icons.tsx';
import type { CategoryItem, SchoolSettings, WebLink } from '../types.ts';

interface UserAppsPageProps {
  audience: 'student' | 'teacher';
  settings: SchoolSettings;
  links: WebLink[];
  categories: CategoryItem[];
  isLoading: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onBackToLanding: () => void;
  onLogoutTeacher: () => void;
  onOpenAppLink: (link: WebLink) => void;
}

function getHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export function UserAppsPage({
  audience,
  settings,
  links,
  categories,
  isLoading,
  isDark,
  onToggleTheme,
  onBackToLanding,
  onLogoutTeacher,
  onOpenAppLink,
}: UserAppsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const isTeacherMode = audience === 'teacher';

  const categoryTabs = useMemo(
    () => ['Semua', ...categories.map((c) => c.name)],
    [categories]
  );

  const filteredLinks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return links.filter((item) => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
      );
    });
  }, [links, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogoFrame
              logoUrl={settings.logoUrl}
              title={settings.title1}
              size="sm"
            />
            <span className="truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {settings.title1}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Mode terang' : 'Mode gelap'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={isTeacherMode ? onLogoutTeacher : onBackToLanding}
              aria-label={
                isTeacherMode
                  ? 'Keluar dari Portal Guru'
                  : 'Keluar dari Portal Siswa'
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <section className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                {isTeacherMode
                  ? 'Portal Guru · Sesi Terautentikasi'
                  : 'Portal Siswa · Akses Langsung Tanpa Password'}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {settings.title2 || 'Portal Aplikasi Sekolah'}
              </h1>
              {settings.title3 && (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  {settings.title3}
                </p>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap dark:text-slate-400">
              {filteredLinks.length} aplikasi siap dibuka
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aplikasi atau alamat web..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
              {categoryTabs.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {links.length === 0
                  ? isTeacherMode
                    ? 'Belum ada aplikasi yang dipublish untuk Guru'
                    : 'Belum ada aplikasi yang dipublish untuk Siswa'
                  : 'Aplikasi tidak ditemukan'}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {links.length === 0
                  ? 'Admin belum mengaktifkan publikasi aplikasi untuk peran ini.'
                  : 'Coba kata kunci lain atau pilih kategori Semua.'}
              </p>
              {links.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                  }}
                  className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenAppLink(link)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <AppIconBadge
                        iconName={link.iconName}
                        iconColor={link.iconColor}
                        iconStyle={link.iconStyle}
                        size="lg"
                      />
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700 dark:text-slate-500 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400">
                        <ExternalLink className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{link.category}</span>
                      {link.isPinned && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-blue-700 dark:text-blue-400">
                            Unggulan
                          </span>
                        </>
                      )}
                      {isTeacherMode && !link.forStudents && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            Khusus Guru
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-1 truncate font-display text-base font-bold text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400">
                      {link.title}
                    </h2>

                    <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {link.description ||
                        'Klik untuk membuka aplikasi di tab baru.'}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <span className="truncate font-mono">
                      {getHostname(link.url)}
                    </span>
                    <span className="ml-2 font-medium text-blue-700 whitespace-nowrap shrink-0 dark:text-blue-400">
                      Buka
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
