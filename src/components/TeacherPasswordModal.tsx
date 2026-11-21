import { useEffect, useState } from 'react';
import { BookOpenCheck, ShieldAlert, X } from 'lucide-react';
import { motion } from 'motion/react';
import { api, setTeacherSessionToken } from '../lib/api.ts';

interface TeacherPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAdminSetup: () => void;
}

export function TeacherPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenAdminSetup,
}: TeacherPasswordModalProps) {
  const [checking, setChecking] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPassword('');
    setError(null);
    setChecking(true);

    api
      .getTeacherStatus()
      .then((status) => {
        setIsConfigured(status.isConfigured);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memeriksa status akses Guru.'
        );
      })
      .finally(() => setChecking(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Masukkan password Guru.');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await api.loginTeacher(password);
      setTeacherSessionToken(token);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Password Guru tidak sesuai.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/60 bg-gradient-to-br from-teal-400 via-emerald-600 to-emerald-800 text-white shadow-[0_3px_0_0_#064e3b,inset_0_1px_0_rgba(255,255,255,0.45)]">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="teacher-auth-title"
                className="font-display text-lg font-bold text-slate-900 dark:text-white"
              >
                Login Portal Guru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses seluruh aplikasi yang dipublikasikan untuk Guru.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal login guru"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {checking ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Memeriksa status akses Guru...
          </div>
        ) : !isConfigured ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-semibold">Password Guru Belum Diatur</p>
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  Admin sekolah perlu menetapkan Password Guru terlebih dahulu di
                  menu Pengaturan Sekolah agar pendidik dapat masuk.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminSetup();
                }}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-800"
              >
                Masuk Admin untuk Mengatur
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="teacher-password-input"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Password Guru
              </label>
              <input
                id="teacher-password-input"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Guru"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Memverifikasi...' : 'Masuk Portal Guru'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
