import { useEffect, useState } from 'react';
import { BookOpenCheck, KeyRound, RotateCcw, Save, Upload } from 'lucide-react';
import { api } from '../lib/api.ts';
import { SchoolLogoFrame } from '../lib/app-icons.tsx';
import { validateLogoSource } from '../lib/validators.ts';
import type { SchoolSettings } from '../types.ts';

interface SchoolSettingsPanelProps {
  settings: SchoolSettings;
  isEnvManagedPassword: boolean;
  teacherPasswordConfigured: boolean;
  isTeacherEnvManaged: boolean;
  onTeacherPasswordUpdated: () => void;
  onSaveSettings: (payload: {
    logoUrl: string;
    title1: string;
    title2: string;
    title3: string;
  }) => Promise<void>;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

export function SchoolSettingsPanel({
  settings,
  isEnvManagedPassword,
  teacherPasswordConfigured,
  isTeacherEnvManaged,
  onTeacherPasswordUpdated,
  onSaveSettings,
  onNotify,
}: SchoolSettingsPanelProps) {
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [title1, setTitle1] = useState(settings.title1);
  const [title2, setTitle2] = useState(settings.title2);
  const [title3, setTitle3] = useState(settings.title3);
  const [isSaving, setIsSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const [teacherPass, setTeacherPass] = useState('');
  const [confirmTeacherPass, setConfirmTeacherPass] = useState('');
  const [isUpdatingTeacherPass, setIsUpdatingTeacherPass] = useState(false);

  useEffect(() => {
    setLogoUrl(settings.logoUrl);
    setTitle1(settings.title1);
    setTitle2(settings.title2);
    setTitle3(settings.title3);
  }, [settings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
        file.type
      )
    ) {
      onNotify('Format logo harus PNG, JPG, WebP, atau GIF.', 'error');
      return;
    }

    if (file.size > 450_000) {
      onNotify('Ukuran file logo maksimal 450 KB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title1.trim().length < 2) {
      onNotify('Judul 1 (Nama Sekolah) minimal 2 karakter.', 'error');
      return;
    }
    const logoCheck = validateLogoSource(logoUrl);
    if (!logoCheck.valid) {
      onNotify(logoCheck.error || 'Logo tidak valid.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSettings({
        logoUrl: logoCheck.value ?? '',
        title1: title1.trim(),
        title2: title2.trim(),
        title3: title3.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onNotify('Password baru minimal 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify('Konfirmasi password tidak cocok.', 'error');
      return;
    }
    setIsUpdatingPass(true);
    try {
      await api.changeAdminPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      onNotify('Password Admin berhasil diperbarui');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Gagal memperbarui password.',
        'error'
      );
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleChangeTeacherPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherPass.length < 6) {
      onNotify('Password Guru minimal 6 karakter.', 'error');
      return;
    }
    if (teacherPass !== confirmTeacherPass) {
      onNotify('Konfirmasi password Guru tidak cocok.', 'error');
      return;
    }
    setIsUpdatingTeacherPass(true);
    try {
      await api.updateTeacherPassword(teacherPass);
      setTeacherPass('');
      setConfirmTeacherPass('');
      onTeacherPasswordUpdated();
      onNotify('Password Login Guru berhasil disimpan');
    } catch (err) {
      onNotify(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan password Guru.',
        'error'
      );
    } finally {
      setIsUpdatingTeacherPass(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmitSettings}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Pengaturan Identitas Halaman Depan
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Atur Logo Sekolah, Judul 1, Judul 2, dan Judul 3 yang tampil pada
              halaman pertama portal.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Logo Sekolah
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <SchoolLogoFrame
                logoUrl={logoUrl}
                title={title1 || 'Sekolah'}
                size="md"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Unggah Gambar</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Logo Default</span>
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={logoUrl.startsWith('data:') ? '' : logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Atau tempel URL logo (https://...)"
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="school-title1"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Judul 1 (Nama Sekolah / Judul Utama)
            </label>
            <input
              id="school-title1"
              type="text"
              required
              maxLength={160}
              value={title1}
              onChange={(e) => setTitle1(e.target.value)}
              placeholder="Contoh: SMA Negeri 1 Nusantara"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="school-title2"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Judul 2 (Subjudul Portal)
            </label>
            <input
              id="school-title2"
              type="text"
              maxLength={160}
              value={title2}
              onChange={(e) => setTitle2(e.target.value)}
              placeholder="Contoh: Portal Aplikasi & Tautan Web Sekolah"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="school-title3"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Judul 3 (Keterangan / Unit)
            </label>
            <input
              id="school-title3"
              type="text"
              maxLength={160}
              value={title3}
              onChange={(e) => setTitle3(e.target.value)}
              placeholder="Contoh: Akses Cepat Layanan Akademik & Pembelajaran"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pratinjau Halaman Pertama
            </p>
            <div className="mt-4 flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-7 text-center dark:border-slate-800 dark:bg-slate-950">
              <SchoolLogoFrame
                logoUrl={logoUrl}
                title={title1 || 'Sekolah'}
                size="md"
              />
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
                {title1 || 'Judul 1'}
              </h3>
              {title2 && (
                <p className="mt-1 font-display text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {title2}
                </p>
              )}
              {title3 && (
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {title3}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <BookOpenCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Password Login Guru
                </h3>
              </div>
              <span
                className={`text-xs font-semibold ${
                  teacherPasswordConfigured
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {teacherPasswordConfigured ? 'Sudah Diatur' : 'Belum Diatur'}
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Digunakan pendidik untuk membuka seluruh aplikasi yang
              dipublish untuk Guru.
            </p>

            {isTeacherEnvManaged ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Password Guru dikelola melalui secret{' '}
                <code className="font-mono text-xs">TEACHER_PASSWORD</code> di
                pengaturan environment server.
              </p>
            ) : (
              <form
                onSubmit={handleChangeTeacherPassword}
                className="mt-4 space-y-3"
              >
                <div>
                  <label
                    htmlFor="new-teacher-pass"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {teacherPasswordConfigured
                      ? 'Password Guru Baru'
                      : 'Buat Password Guru'}
                  </label>
                  <input
                    id="new-teacher-pass"
                    type="password"
                    minLength={6}
                    value={teacherPass}
                    onChange={(e) => setTeacherPass(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-teacher-pass"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Ulangi Password Guru
                  </label>
                  <input
                    id="confirm-teacher-pass"
                    type="password"
                    minLength={6}
                    value={confirmTeacherPass}
                    onChange={(e) => setConfirmTeacherPass(e.target.value)}
                    placeholder="Ketik ulang password Guru"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingTeacherPass}
                  className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
                >
                  {isUpdatingTeacherPass
                    ? 'Menyimpan...'
                    : teacherPasswordConfigured
                      ? 'Perbarui Password Guru'
                      : 'Simpan Password Guru'}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Keamanan Password Admin
              </h3>
            </div>

            {isEnvManagedPassword ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Password Admin saat ini dikelola melalui secret{' '}
                <code className="font-mono text-xs">ADMIN_PASSWORD</code> di
                pengaturan environment server.
              </p>
            ) : (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="new-admin-pass"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password Admin Baru
                  </label>
                  <input
                    id="new-admin-pass"
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-admin-pass"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Ulangi Password Baru
                  </label>
                  <input
                    id="confirm-admin-pass"
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {isUpdatingPass ? 'Memperbarui...' : 'Perbarui Password Admin'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
