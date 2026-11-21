import { ArrowRight, Lock, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { AppIconBadge, SchoolLogoFrame } from '../lib/app-icons.tsx';
import type { SchoolSettings } from '../types.ts';

interface LandingPortalProps {
  settings: SchoolSettings;
  isDark: boolean;
  onToggleTheme: () => void;
  onEnterStudentPortal: () => void;
  onOpenTeacherLogin: () => void;
  onOpenAdminLogin: () => void;
}

export function LandingPortal({
  settings,
  isDark,
  onToggleTheme,
  onEnterStudentPortal,
  onOpenTeacherLogin,
  onOpenAdminLogin,
}: LandingPortalProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#F2F6FA] via-[#F5F7F5] to-[#EDF3F1] text-[#1E293B] dark:bg-none dark:bg-slate-950 dark:text-slate-100">
      <header className="w-full border-b border-[#DCE4EC] bg-white/70 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolLogoFrame
              logoUrl={settings.logoUrl}
              title={settings.title1}
              size="sm"
            />
            <span className="truncate font-display text-base font-bold tracking-tight text-[#1E293B] whitespace-nowrap dark:text-white">
              {settings.title1}
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#526273] md:flex dark:text-slate-400">
            <button
              type="button"
              onClick={onEnterStudentPortal}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#1E293B] dark:hover:text-white"
            >
              Portal Siswa
            </button>
            <button
              type="button"
              onClick={onOpenTeacherLogin}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#1E293B] dark:hover:text-white"
            >
              Portal Guru
            </button>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#1E293B] dark:hover:text-white"
            >
              Pengaturan Admin
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E0E8] bg-white/85 text-[#4B5B6C] transition-colors hover:bg-[#EAF0F5] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7E0E8] bg-white/85 px-3.5 py-2 text-xs font-semibold text-[#2A394A] whitespace-nowrap shrink-0 transition-colors hover:bg-[#EAF0F5] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full flex-col items-center"
        >
          <SchoolLogoFrame
            logoUrl={settings.logoUrl}
            title={settings.title1}
            size="lg"
          />

          <h1 className="mt-7 max-w-3xl font-display text-3xl font-bold tracking-tight text-[#1E293B] [text-wrap:balance] sm:text-5xl dark:text-white">
            {settings.title1}
          </h1>

          {settings.title2 && (
            <h2 className="mt-3 max-w-2xl font-display text-lg font-semibold text-[#3C6E8A] [text-wrap:balance] sm:text-xl dark:text-sky-300">
              {settings.title2}
            </h2>
          )}

          {settings.title3 && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#526273] sm:text-base dark:text-slate-400">
              {settings.title3}
            </p>
          )}

          <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={onEnterStudentPortal}
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#C5D8EA] bg-[#E8F1F8] p-5 text-left text-[#16324F] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#9EC0DE] hover:bg-[#DCEAF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A7FA8] dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-slate-100 dark:hover:border-sky-700 dark:hover:bg-sky-950/65"
            >
              <div className="flex w-full items-start justify-between text-[#3E6A8E] dark:text-sky-300">
                <AppIconBadge
                  iconName="GraduationCap"
                  iconColor="blue"
                  iconStyle="3d"
                  size="md"
                />
                <ArrowRight className="mt-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-5">
                <span className="block font-display text-base font-bold">
                  Masuk sebagai Siswa
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#3E5A75] dark:text-slate-300">
                  Akses langsung tanpa password ke aplikasi khusus Siswa
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenTeacherLogin}
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#C6DFD4] bg-[#E9F3EE] p-5 text-left text-[#19382D] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#9EC9B6] hover:bg-[#DFEDE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#46826B] dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-slate-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/60"
            >
              <div className="flex w-full items-start justify-between text-[#3D6E5B] dark:text-emerald-300">
                <AppIconBadge
                  iconName="Users"
                  iconColor="emerald"
                  iconStyle="3d"
                  size="md"
                />
                <ArrowRight className="mt-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-5">
                <span className="block font-display text-base font-bold">
                  Login Guru
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#416154] dark:text-slate-300">
                  Masuk dengan password untuk seluruh link aplikasi Guru
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="group flex flex-col items-start justify-between rounded-2xl border border-[#D4D9E6] bg-[#EFF1F7] p-5 text-left text-[#222B3F] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#B5BFD6] hover:bg-[#E5E9F3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B698A] dark:border-indigo-900/50 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-indigo-700 dark:hover:bg-slate-800/90"
            >
              <div className="flex w-full items-start justify-between text-[#4F5D7A] dark:text-indigo-300">
                <AppIconBadge
                  iconName="ShieldCheck"
                  iconColor="indigo"
                  iconStyle="3d"
                  size="md"
                />
                <ArrowRight className="mt-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-5">
                <span className="block font-display text-base font-bold">
                  Login Admin
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#4B566E] dark:text-slate-300">
                  Kelola logo, kategori, akses Siswa/Guru & publikasi link
                </span>
              </div>
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-[#DCE4EC] bg-white/55 px-6 py-4 text-center dark:border-slate-800/80 dark:bg-slate-950/80">
        <p className="text-xs font-medium text-[#526273] dark:text-slate-400">
          Design by : IT Support SMANSAR
        </p>
      </footer>
    </div>
  );
}
