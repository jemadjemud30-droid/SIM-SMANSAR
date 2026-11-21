import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { CategoryItem } from '../types.ts';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: CategoryItem[];
  onClose: () => void;
  onCreateCategory: (name: string) => Promise<void>;
  onRenameCategory: (id: number, name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export function CategoryManagerModal({
  isOpen,
  categories,
  onClose,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
}: CategoryManagerModalProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setError('Nama kategori minimal 2 karakter.');
      return;
    }
    setBusy(true);
    try {
      await onCreateCategory(trimmed);
      setNewName('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menambahkan kategori.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRename = async (id: number) => {
    setError(null);
    const trimmed = editingName.trim();
    if (trimmed.length < 2) {
      setError('Nama kategori minimal 2 karakter.');
      return;
    }
    setBusy(true);
    try {
      await onRenameCategory(id, trimmed);
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengubah nama kategori.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setBusy(true);
    try {
      await onDeleteCategory(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menghapus kategori.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="category-manager-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-white"
            >
              Kelola Kategori Aplikasi
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Tambah, ubah nama, atau hapus kategori pada daftar pilihan link.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengelola kategori"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            maxLength={40}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tambah kategori baru (misal: Kurikulum)..."
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah</span>
          </button>
        </form>

        <div className="mt-4 max-h-72 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;
            const isLast = categories.length <= 1;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 bg-white px-3.5 py-2.5 dark:bg-slate-900"
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      maxLength={40}
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleSaveRename(cat.id);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      className="min-w-0 flex-1 rounded-md border border-blue-500 bg-white px-2.5 py-1 text-sm text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSaveRename(cat.id)}
                      title="Simpan"
                      aria-label={`Simpan nama ${cat.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-700 text-white hover:bg-blue-800"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      title="Batal"
                      aria-label="Batal ubah"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                          setError(null);
                        }}
                        title="Ubah nama kategori"
                        aria-label={`Ubah kategori ${cat.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy || isLast}
                        onClick={() => void handleDelete(cat.id)}
                        title={
                          isLast
                            ? 'Minimal 1 kategori harus tersedia'
                            : 'Hapus kategori'
                        }
                        aria-label={`Hapus kategori ${cat.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Selesai
          </button>
        </div>
      </motion.div>
    </div>
  );
}
