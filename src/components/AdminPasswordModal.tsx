import { useEffect, useState } from 'react';
import { KeyRound, Lock, X } from 'lucide-react';
import { motion } from 'motion/react';
import { api, setAdminSessionToken } from '../lib/api.ts';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminPasswordModalProps) {
  const [checking, setChecking] = useState(true);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setChecking(true);

    api
      .getAdminStatus()
      .then((status) => {
        setNeedsInitialSetup(status.needsInitialSetup);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memeriksa status akses Admin.'
        );
      })
      .finally(() => setChecking(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (needsInitialSetup) {
      if (password.length < 6) {
        setError('Password Admin minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok.');
        return;
      }
      setSubmitting(true);
      try {
        const { token } = await api.setupAdminPassword(password);
        setAdminSessionToken(token);
        onSuccess();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal menetapkan password Admin.'
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setError('Masukkan password Admin.');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await api.loginAdmin(password);
      setAdminSessionToken(token);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Password Admin tidak sesuai.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400">
              {needsInitialSetup ? (
                <KeyRound className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="admin-auth-title"
                className="font-display text-lg font-bold text-slate-900 dark:text-white"
              >
                {checking
                  ? 'Memeriksa Akses Admin'
                  : needsInitialSetup
                    ? 'Atur Password Admin Pertama'
                    : 'Login Pengaturan Admin'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {needsInitialSetup
                  ? 'Buat password Admin untuk mengamankan halaman pengaturan.'
                  : 'Masukkan password Admin untuk mengelola sekolah dan link.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal login admin"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {checking ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Menghubungkan ke server...
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
                htmlFor="admin-password-input"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {needsInitialSetup ? 'Password Admin Baru' : 'Password Admin'}
              </label>
              <input
                id="admin-password-input"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  needsInitialSetup
                    ? 'Minimal 6 karakter'
                    : 'Masukkan password Admin'
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {needsInitialSetup && (
              <div>
                <label
                  htmlFor="admin-password-confirm"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Konfirmasi Password
                </label>
                <input
                  id="admin-password-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password Admin"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            )}

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
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Memverifikasi...'
                  : needsInitialSetup
                    ? 'Simpan & Masuk Admin'
                    : 'Masuk Admin'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
