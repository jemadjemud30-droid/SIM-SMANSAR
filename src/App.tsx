import { useCallback, useEffect, useState } from 'react';
import {
  api,
  hasAdminSessionToken,
  hasTeacherSessionToken,
  setAdminSessionToken,
  setTeacherSessionToken,
} from './lib/api.ts';
import type {
  AppIconColor,
  AppIconName,
  AppIconStyle,
  CategoryItem,
  LinkCategory,
  PortalView,
  SchoolSettings,
  WebLink,
} from './types.ts';
import { LandingPortal } from './components/LandingPortal.tsx';
import { UserAppsPage } from './components/UserAppsPage.tsx';
import { AdminWorkspace } from './components/AdminWorkspace.tsx';
import { AdminPasswordModal } from './components/AdminPasswordModal.tsx';
import { TeacherPasswordModal } from './components/TeacherPasswordModal.tsx';
import { LinkModal } from './components/LinkModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { CategoryManagerModal } from './components/CategoryManagerModal.tsx';

interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  logoUrl: '',
  title1: 'SMA Negeri 1 Nusantara',
  title2: 'Portal Aplikasi & Tautan Web Sekolah',
  title3: 'Akses Cepat Layanan Akademik, Administrasi & Pembelajaran',
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [view, setView] = useState<PortalView>('landing');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(
    DEFAULT_SCHOOL_SETTINGS
  );
  const [studentLinks, setStudentLinks] = useState<WebLink[]>([]);
  const [teacherLinks, setTeacherLinks] = useState<WebLink[]>([]);
  const [adminLinks, setAdminLinks] = useState<WebLink[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingPortal, setIsLoadingPortal] = useState(true);
  const [isLoadingTeacher, setIsLoadingTeacher] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  const [isEnvManagedPassword, setIsEnvManagedPassword] = useState(false);
  const [teacherPasswordConfigured, setTeacherPasswordConfigured] =
    useState(false);
  const [isTeacherEnvManaged, setIsTeacherEnvManaged] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<WebLink | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [deletingLink, setDeletingLink] = useState<WebLink | null>(null);
  const [isDeletingLink, setIsDeletingLink] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      setToast({ message, tone });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const loadPortalData = useCallback(async () => {
    setIsLoadingPortal(true);
    try {
      const data = await api.getPortal();
      setSchoolSettings(data.schoolSettings);
      setStudentLinks(data.links);
      setCategories(data.categories);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal memuat data portal.',
        'error'
      );
    } finally {
      setIsLoadingPortal(false);
    }
  }, [showToast]);

  const loadTeacherData = useCallback(async () => {
    setIsLoadingTeacher(true);
    try {
      const data = await api.getTeacherPortal();
      setSchoolSettings(data.schoolSettings);
      setTeacherLinks(data.links);
      setCategories(data.categories);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Gagal memuat daftar aplikasi Guru.',
        'error'
      );
      setTeacherSessionToken(null);
      setView('landing');
    } finally {
      setIsLoadingTeacher(false);
    }
  }, [showToast]);

  const loadAdminData = useCallback(async () => {
    setIsLoadingAdmin(true);
    try {
      const [linksRes, statusRes] = await Promise.all([
        api.getAdminLinks(),
        api.getAdminStatus(),
      ]);
      setAdminLinks(linksRes.links);
      setCategories(linksRes.categories);
      setIsEnvManagedPassword(statusRes.isEnvManaged);
      setTeacherPasswordConfigured(statusRes.teacherPasswordConfigured);
      setIsTeacherEnvManaged(statusRes.isTeacherEnvManaged);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal memuat data admin.',
        'error'
      );
      setAdminSessionToken(null);
      setView('landing');
    } finally {
      setIsLoadingAdmin(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPortalData();
  }, [loadPortalData]);

  const handleOpenTeacherEntry = () => {
    if (hasTeacherSessionToken() || hasAdminSessionToken()) {
      setView('teacher');
      void loadTeacherData();
    } else {
      setIsTeacherModalOpen(true);
    }
  };

  const handleTeacherLoginSuccess = () => {
    setIsTeacherModalOpen(false);
    setView('teacher');
    void loadTeacherData();
    showToast('Berhasil masuk ke Portal Aplikasi Guru');
  };

  const handleLogoutTeacher = () => {
    setTeacherSessionToken(null);
    setTeacherLinks([]);
    setView('landing');
    void loadPortalData();
    showToast('Keluar dari sesi Guru');
  };

  const handleOpenAdminEntry = () => {
    if (hasAdminSessionToken()) {
      setView('admin');
      void loadAdminData();
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminModalOpen(false);
    setView('admin');
    void loadAdminData();
    showToast('Berhasil masuk ke halaman pengaturan Admin');
  };

  const handleLogoutAdmin = () => {
    setAdminSessionToken(null);
    setAdminLinks([]);
    setView('landing');
    void loadPortalData();
    showToast('Keluar dari sesi Admin');
  };

  const handleSaveSchoolSettings = async (payload: {
    logoUrl: string;
    title1: string;
    title2: string;
    title3: string;
  }) => {
    try {
      const { schoolSettings: updated } =
        await api.updateSchoolSettings(payload);
      setSchoolSettings(updated);
      showToast('Pengaturan sekolah berhasil disimpan');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pengaturan sekolah.',
        'error'
      );
    }
  };

  const handleCreateCategory = async (name: string): Promise<CategoryItem> => {
    const { category } = await api.createCategory(name);
    setCategories((prev) => [...prev, category]);
    showToast(`Kategori "${category.name}" ditambahkan`);
    return category;
  };

  const handleRenameCategory = async (id: number, name: string) => {
    const { category: updated } = await api.renameCategory(id, name);
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    await Promise.all([loadAdminData(), loadPortalData()]);
    showToast(`Kategori diubah menjadi "${updated.name}"`);
  };

  const handleDeleteCategory = async (id: number) => {
    const { deletedId } = await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== deletedId));
    await Promise.all([loadAdminData(), loadPortalData()]);
    showToast('Kategori berhasil dihapus');
  };

  const handleSaveLink = async (payload: {
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
  }) => {
    setIsSubmittingLink(true);
    try {
      if (editingLink) {
        const { link } = await api.updateAdminLink(editingLink.id, payload);
        setAdminLinks((prev) =>
          prev.map((item) => (item.id === link.id ? link : item))
        );
        showToast('Link aplikasi berhasil diperbarui');
      } else {
        const { link } = await api.createAdminLink(payload);
        setAdminLinks((prev) => [link, ...prev]);
        showToast('Link aplikasi baru berhasil dipublikasikan');
      }
      setIsLinkModalOpen(false);
      setEditingLink(null);
      void loadPortalData();
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLink) return;
    setIsDeletingLink(true);
    try {
      const { deletedId } = await api.deleteAdminLink(deletingLink.id);
      setAdminLinks((prev) => prev.filter((item) => item.id !== deletedId));
      setDeletingLink(null);
      showToast('Link aplikasi berhasil dihapus');
      void loadPortalData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menghapus link aplikasi.',
        'error'
      );
    } finally {
      setIsDeletingLink(false);
    }
  };

  const handleTogglePublish = async (link: WebLink) => {
    try {
      const { link: updated } = await api.updateAdminLink(link.id, {
        isPublished: !link.isPublished,
      });
      setAdminLinks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      void loadPortalData();
      showToast(
        updated.isPublished
          ? 'Aplikasi dipublikasikan ke portal'
          : 'Aplikasi disembunyikan sebagai draf'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengubah status publikasi.',
        'error'
      );
    }
  };

  const handleToggleAudience = async (
    link: WebLink,
    target: 'forStudents' | 'forTeachers'
  ) => {
    try {
      const nextValue = !link[target];
      const { link: updated } = await api.updateAdminLink(link.id, {
        [target]: nextValue,
      });
      setAdminLinks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      void loadPortalData();
      if (target === 'forStudents') {
        showToast(
          nextValue
            ? `"${link.title}" kini dapat diakses Siswa`
            : `"${link.title}" disembunyikan dari Siswa`
        );
      } else {
        showToast(
          nextValue
            ? `"${link.title}" kini dapat diakses Guru`
            : `"${link.title}" disembunyikan dari Guru`
        );
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengubah target akses.',
        'error'
      );
    }
  };

  const handleTogglePin = async (link: WebLink) => {
    try {
      const { link: updated } = await api.updateAdminLink(link.id, {
        isPinned: !link.isPinned,
      });
      setAdminLinks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      void loadPortalData();
      showToast(
        updated.isPinned
          ? 'Aplikasi ditandai unggulan'
          : 'Tanda unggulan dilepas'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengubah status unggulan.',
        'error'
      );
    }
  };

  const handleCopyUrl = async (link: WebLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      showToast('Alamat URL disalin ke papan klip');
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === link.id ? null : prev));
      }, 1800);
    } catch {
      showToast('Tidak dapat menyalin URL ke papan klip', 'error');
    }
  };

  const handleSeedStarter = async () => {
    setIsLoadingAdmin(true);
    try {
      const { links } = await api.seedAdminLinks();
      setAdminLinks(links);
      void loadPortalData();
      showToast('Contoh aplikasi sekolah berhasil dimuat');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal memuat contoh aplikasi.',
        'error'
      );
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const handleOpenAppLink = (
    link: WebLink,
    scope: 'student' | 'teacher'
  ) => {
    if (scope === 'student') {
      setStudentLinks((prev) =>
        prev.map((item) =>
          item.id === link.id
            ? { ...item, clickCount: item.clickCount + 1 }
            : item
        )
      );
    } else {
      setTeacherLinks((prev) =>
        prev.map((item) =>
          item.id === link.id
            ? { ...item, clickCount: item.clickCount + 1 }
            : item
        )
      );
    }
    void api.recordClick(link.id, scope).catch(() => {});
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPortal
          settings={schoolSettings}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onEnterStudentPortal={() => setView('student')}
          onOpenTeacherLogin={handleOpenTeacherEntry}
          onOpenAdminLogin={handleOpenAdminEntry}
        />
      )}

      {view === 'student' && (
        <UserAppsPage
          audience="student"
          settings={schoolSettings}
          links={studentLinks}
          categories={categories}
          isLoading={isLoadingPortal}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onBackToLanding={() => {
            setView('landing');
            showToast('Keluar dari Portal Siswa');
          }}
          onLogoutTeacher={handleLogoutTeacher}
          onOpenAppLink={(l) => handleOpenAppLink(l, 'student')}
        />
      )}

      {view === 'teacher' && (
        <UserAppsPage
          audience="teacher"
          settings={schoolSettings}
          links={teacherLinks}
          categories={categories}
          isLoading={isLoadingTeacher}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onBackToLanding={() => setView('landing')}
          onLogoutTeacher={handleLogoutTeacher}
          onOpenAppLink={(l) => handleOpenAppLink(l, 'teacher')}
        />
      )}

      {view === 'admin' && (
        <AdminWorkspace
          settings={schoolSettings}
          links={adminLinks}
          categories={categories}
          isLoading={isLoadingAdmin}
          isEnvManagedPassword={isEnvManagedPassword}
          teacherPasswordConfigured={teacherPasswordConfigured}
          isTeacherEnvManaged={isTeacherEnvManaged}
          isDark={isDark}
          copiedId={copiedId}
          onToggleTheme={() => setIsDark((d) => !d)}
          onViewLanding={() => {
            void loadPortalData();
            setView('landing');
          }}
          onViewStudentPortal={() => {
            void loadPortalData();
            setView('student');
          }}
          onViewTeacherPortal={() => {
            setView('teacher');
            void loadTeacherData();
          }}
          onLogoutAdmin={handleLogoutAdmin}
          onOpenCreateLink={() => {
            setEditingLink(null);
            setIsLinkModalOpen(true);
          }}
          onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          onEditLink={(link) => {
            setEditingLink(link);
            setIsLinkModalOpen(true);
          }}
          onDeleteLink={setDeletingLink}
          onTogglePublish={(l) => void handleTogglePublish(l)}
          onTogglePin={(l) => void handleTogglePin(l)}
          onToggleAudience={(l, target) => void handleToggleAudience(l, target)}
          onCopyUrl={(l) => void handleCopyUrl(l)}
          onSeedStarter={() => void handleSeedStarter()}
          onTeacherPasswordUpdated={() => setTeacherPasswordConfigured(true)}
          onSaveSchoolSettings={handleSaveSchoolSettings}
          onNotify={showToast}
        />
      )}

      <TeacherPasswordModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={handleTeacherLoginSuccess}
        onOpenAdminSetup={handleOpenAdminEntry}
      />

      <AdminPasswordModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        editingLink={editingLink}
        categories={categories}
        isSubmitting={isSubmittingLink}
        onClose={() => {
          setIsLinkModalOpen(false);
          setEditingLink(null);
        }}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onQuickCreateCategory={handleCreateCategory}
        onSubmit={handleSaveLink}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreateCategory={async (name) => {
          await handleCreateCategory(name);
        }}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <DeleteConfirmModal
        link={deletingLink}
        isDeleting={isDeletingLink}
        onCancel={() => setDeletingLink(null)}
        onConfirm={handleConfirmDelete}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-5 bottom-5 z-50 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
              : 'border-slate-200 bg-slate-900 text-white dark:border-slate-700 dark:bg-white dark:text-slate-900'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
