import { useEffect, useState } from 'react';
import { ClipboardPaste, Plus, Settings2, X } from 'lucide-react';
import { motion } from 'motion/react';
import {
  APP_ICON_COLORS,
  APP_ICON_OPTIONS,
  AppIconBadge,
} from '../lib/app-icons.tsx';
import {
  normalizeAndValidateHttpUrl,
  type AppIconColor,
  type AppIconName,
  type AppIconStyle,
  type LinkCategory,
} from '../lib/validators.ts';
import type { CategoryItem, WebLink } from '../types.ts';

interface LinkModalProps {
  isOpen: boolean;
  editingLink: WebLink | null;
  categories: CategoryItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onOpenCategoryManager: () => void;
  onQuickCreateCategory: (name: string) => Promise<CategoryItem>;
  onSubmit: (payload: {
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
  }) => Promise<void>;
}

export function LinkModal({
  isOpen,
  editingLink,
  categories,
  isSubmitting,
  onClose,
  onOpenCategoryManager,
  onQuickCreateCategory,
  onSubmit,
}: LinkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<LinkCategory>('Akademik');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState<AppIconName>('GraduationCap');
  const [iconColor, setIconColor] = useState<AppIconColor>('blue');
  const [iconStyle, setIconStyle] = useState<AppIconStyle>('3d');
  const [forStudents, setForStudents] = useState(true);
  const [forTeachers, setForTeachers] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const defaultCat = categories[0]?.name ?? 'Umum';
    if (editingLink) {
      setTitle(editingLink.title);
      setUrl(editingLink.url);
      setCategory(editingLink.category || defaultCat);
      setDescription(editingLink.description);
      setIconName(editingLink.iconName);
      setIconColor(editingLink.iconColor);
      setIconStyle(editingLink.iconStyle || '3d');
      setForStudents(editingLink.forStudents ?? true);
      setForTeachers(editingLink.forTeachers ?? true);
      setIsPublished(editingLink.isPublished);
      setIsPinned(editingLink.isPinned);
    } else {
      setTitle('');
      setUrl('');
      setCategory(defaultCat);
      setDescription('');
      setIconName('GraduationCap');
      setIconColor('blue');
      setIconStyle('3d');
      setForStudents(true);
      setForTeachers(true);
      setIsPublished(true);
      setIsPinned(false);
    }
    setShowQuickAddCat(false);
    setQuickCatName('');
    setError(null);
  }, [isOpen, editingLink]);

  useEffect(() => {
    if (!isOpen || categories.length === 0) return;
    const exists = categories.some((c) => c.name === category);
    if (!exists) {
      setCategory(categories[0].name);
    }
  }, [categories, category, isOpen]);

  if (!isOpen) return null;

  const urlPreview = normalizeAndValidateHttpUrl(url);

  const handlePasteUrl = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setUrl(text.trim());
      } else {
        setError('Papan klip kosong.');
      }
    } catch {
      setError(
        'Izin akses papan klip ditolak browser. Silakan tempel manual dengan Ctrl+V.'
      );
    }
  };

  const handleQuickAddCategory = async () => {
    setError(null);
    const trimmed = quickCatName.trim();
    if (trimmed.length < 2) {
      setError('Nama kategori baru minimal 2 karakter.');
      return;
    }
    setAddingCat(true);
    try {
      const created = await onQuickCreateCategory(trimmed);
      setCategory(created.name);
      setQuickCatName('');
      setShowQuickAddCat(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menambahkan kategori.'
      );
    } finally {
      setAddingCat(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError('Judul aplikasi minimal 2 karakter.');
      return;
    }

    const urlCheck = normalizeAndValidateHttpUrl(url);
    if (!urlCheck.valid || !urlCheck.url) {
      setError(urlCheck.error || 'Alamat URL tidak valid.');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        url: urlCheck.url,
        description: description.trim(),
        category,
        iconName,
        iconColor,
        iconStyle,
        forStudents,
        forTeachers,
        isPublished,
        isPinned,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan link aplikasi.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="link-modal-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-white"
            >
              {editingLink
                ? 'Edit Link Aplikasi'
                : 'Tempel & Publikasikan Link Aplikasi'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Atur tautan, kategori, bentuk ikon 3D, serta hak akses Siswa dan
              Guru.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="link-title"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Nama Aplikasi
              </label>
              <input
                id="link-title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: SIAKAD Sekolah"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="link-category"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Kategori
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCat((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Baru</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                  >
                    <Settings2 className="h-3 w-3" />
                    <span>Kelola</span>
                  </button>
                </div>
              </div>

              <select
                id="link-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {showQuickAddCat && (
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    maxLength={40}
                    value={quickCatName}
                    onChange={(e) => setQuickCatName(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="min-w-0 flex-1 rounded-lg border border-blue-500 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={addingCat}
                    onClick={() => void handleQuickAddCategory()}
                    className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-blue-800 disabled:opacity-60"
                  >
                    {addingCat ? '...' : 'Simpan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="link-url"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Alamat Web (URL)
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="link-url"
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://contoh.sch.id/aplikasi"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => void handlePasteUrl()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Tempel Link</span>
              </button>
            </div>
            {url.trim().length > 0 && urlPreview.valid && urlPreview.hostname && (
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                Domain terdeteksi: {urlPreview.hostname}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="link-desc"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Deskripsi Singkat (Opsional)
            </label>
            <input
              id="link-desc"
              type="text"
              maxLength={400}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan ringkas fungsi aplikasi ini..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Pilih Ikon, Warna & Bentuk 3D
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tampilan ikon pada portal Siswa dan portal Guru.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                <AppIconBadge
                  iconName={iconName}
                  iconColor={iconColor}
                  iconStyle={iconStyle}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="max-w-[140px] truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {title.trim() || 'Pratinjau Ikon'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {category} · {iconStyle === '3d' ? 'Ikon 3D' : 'Ikon Datar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {APP_ICON_OPTIONS.map((opt) => {
                const Icon = opt.Icon;
                const active = iconName === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIconName(opt.name)}
                    title={opt.label}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2 text-[11px] transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="max-w-full truncate px-1">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Warna:
                </span>
                {APP_ICON_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setIconColor(col.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                      iconColor === col.id
                        ? 'border-slate-900 bg-white text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${col.swatchClass}`}
                    />
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 shrink-0 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setIconStyle('3d')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    iconStyle === '3d'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Bentuk 3D
                </button>
                <button
                  type="button"
                  onClick={() => setIconStyle('flat')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    iconStyle === 'flat'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Datar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Target Akses Pengguna & Status Publikasi
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Konsumsi Siswa (Tanpa Password)
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Tampil pada halaman portal Siswa
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={forStudents}
                  onChange={(e) => setForStudents(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Akses Guru (Login Password)
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Tampil setelah Guru masuk dengan password
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={forTeachers}
                  onChange={(e) => setForTeachers(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Publikasikan Sekarang
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Aktifkan agar link dapat diakses pengguna
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                    Sematkan di Urutan Atas
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Tandai sebagai aplikasi unggulan
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
              </label>
            </div>

            {isPublished && !forStudents && !forTeachers && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Catatan: Aplikasi dalam status terpublikasi, namun belum memilih
                akses Siswa maupun Guru sehingga tidak tampil di portal mana pun.
              </p>
            )}
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
              disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingLink
                  ? 'Simpan Perubahan'
                  : 'Publikasikan Aplikasi'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
