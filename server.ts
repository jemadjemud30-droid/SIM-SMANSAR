import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getRequestTokenRole,
  requireAdminAuth,
  requireTeacherAuth,
} from './src/middleware/auth.ts';
import {
  claimAdminPasswordHash,
  createCategory,
  createLink,
  deleteCategory,
  deleteLink,
  getAdminPasswordHash,
  getLinkById,
  getPublicSchoolSettings,
  getTeacherPasswordHash,
  incrementLinkClick,
  listAllLinks,
  listCategories,
  renameCategory,
  seedStarterLinks,
  updateAdminPasswordHash,
  updateLink,
  updateSchoolSettings,
  updateTeacherPasswordHash,
} from './src/db/queries.ts';
import {
  claimSupabaseAdminPasswordHash,
  createSupabaseCategory,
  createSupabaseLink,
  deleteSupabaseCategory,
  deleteSupabaseLink,
  getSupabaseAdminPasswordHash,
  getSupabaseLinkById,
  getSupabaseSchoolSettings,
  getSupabaseTeacherPasswordHash,
  incrementSupabaseClick,
  isSupabaseConfigured,
  listSupabaseCategories,
  listSupabaseLinks,
  renameSupabaseCategory,
  seedSupabaseStarterLinks,
  updateSupabaseAdminPasswordHash,
  updateSupabaseLink,
  updateSupabaseSchoolSettings,
  updateSupabaseTeacherPasswordHash,
} from './src/lib/supabase-server.ts';
import {
  getEnvAdminPassword,
  getEnvTeacherPassword,
  hashPasswordScrypt,
  issueAdminToken,
  issueTeacherToken,
  verifyEnvPasswordConstantTime,
  verifyPasswordScrypt,
} from './src/lib/admin-auth.ts';
import {
  normalizeAndValidateHttpUrl,
  sanitizeCategory,
  sanitizeCategoryName,
  sanitizeDescription,
  sanitizeIconColor,
  sanitizeIconName,
  sanitizeIconStyle,
  sanitizeLinkTitle,
  sanitizeSchoolTitle,
  validateLogoSource,
} from './src/lib/validators.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  const useSupabase = () => isSupabaseConfigured();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public Student Portal (no password required, strictly student-visible published links)
  app.get('/api/portal', async (_req, res) => {
    try {
      const [schoolSettings, links, categories] = useSupabase()
        ? await Promise.all([
            getSupabaseSchoolSettings(),
            listSupabaseLinks('student'),
            listSupabaseCategories(),
          ])
        : await Promise.all([
            getPublicSchoolSettings(),
            listAllLinks('student'),
            listCategories(),
          ]);

      res.json({
        provider: useSupabase() ? 'supabase' : 'cloudsql',
        schoolSettings,
        links,
        categories,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memuat data portal.';
      res.status(500).json({ error: message });
    }
  });

  // Teacher Auth Status
  app.get('/api/teacher/status', async (_req, res) => {
    try {
      const envPass = getEnvTeacherPassword();
      const storedHash = envPass
        ? null
        : useSupabase()
          ? await getSupabaseTeacherPasswordHash()
          : await getTeacherPasswordHash();

      res.json({
        isConfigured: Boolean(envPass || storedHash),
        isEnvManaged: Boolean(envPass),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memeriksa status akses Guru.';
      res.status(500).json({ error: message });
    }
  });

  // Teacher Login (password-protected)
  app.post('/api/teacher/login', async (req, res) => {
    try {
      const password =
        typeof req.body?.password === 'string' ? req.body.password : '';
      if (!password) {
        res.status(400).json({ error: 'Password Guru wajib diisi.' });
        return;
      }

      const envPass = getEnvTeacherPassword();
      if (envPass) {
        if (!verifyEnvPasswordConstantTime(password, envPass)) {
          res.status(401).json({ error: 'Password Guru tidak sesuai.' });
          return;
        }
        res.json({ token: issueTeacherToken() });
        return;
      }

      const storedHash = useSupabase()
        ? await getSupabaseTeacherPasswordHash()
        : await getTeacherPasswordHash();

      if (!storedHash) {
        res.status(409).json({
          error:
            'Password Guru belum diatur oleh Admin. Silakan hubungi Admin sekolah.',
        });
        return;
      }

      if (!verifyPasswordScrypt(password, storedHash)) {
        res.status(401).json({ error: 'Password Guru tidak sesuai.' });
        return;
      }

      res.json({ token: issueTeacherToken() });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memverifikasi login Guru.';
      res.status(500).json({ error: message });
    }
  });

  // Protected Teacher Portal (all published links enabled for teachers)
  app.get('/api/teacher/portal', requireTeacherAuth, async (_req, res) => {
    try {
      const [schoolSettings, links, categories] = useSupabase()
        ? await Promise.all([
            getSupabaseSchoolSettings(),
            listSupabaseLinks('teacher'),
            listSupabaseCategories(),
          ])
        : await Promise.all([
            getPublicSchoolSettings(),
            listAllLinks('teacher'),
            listCategories(),
          ]);

      res.json({
        schoolSettings,
        links,
        categories,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memuat portal aplikasi Guru.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/links/:id/click', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'ID tautan tidak valid.' });
        return;
      }

      const existing = useSupabase()
        ? await getSupabaseLinkById(id)
        : await getLinkById(id);

      if (!existing || !existing.isPublished) {
        res.status(404).json({ error: 'Tautan tidak ditemukan.' });
        return;
      }

      if (!existing.forStudents) {
        const role = getRequestTokenRole(req);
        if (role !== 'teacher' && role !== 'admin') {
          res.status(401).json({
            error: 'Tautan ini khusus untuk akses Guru yang terautentikasi.',
          });
          return;
        }
      }

      const updated = useSupabase()
        ? await incrementSupabaseClick(id)
        : await incrementLinkClick(id);
      if (!updated) {
        res.status(404).json({ error: 'Tautan tidak ditemukan.' });
        return;
      }
      res.json(updated);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal mencatat kunjungan.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/admin/status', async (_req, res) => {
    try {
      const envAdminPass = getEnvAdminPassword();
      const envTeacherPass = getEnvTeacherPassword();

      const [storedAdminHash, storedTeacherHash] = useSupabase()
        ? await Promise.all([
            envAdminPass ? Promise.resolve('env') : getSupabaseAdminPasswordHash(),
            envTeacherPass
              ? Promise.resolve('env')
              : getSupabaseTeacherPasswordHash(),
          ])
        : await Promise.all([
            envAdminPass ? Promise.resolve('env') : getAdminPasswordHash(),
            envTeacherPass ? Promise.resolve('env') : getTeacherPasswordHash(),
          ]);

      res.json({
        needsInitialSetup: !envAdminPass && !storedAdminHash,
        isEnvManaged: Boolean(envAdminPass),
        teacherPasswordConfigured: Boolean(envTeacherPass || storedTeacherHash),
        isTeacherEnvManaged: Boolean(envTeacherPass),
        provider: useSupabase() ? 'supabase' : 'cloudsql',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memeriksa status akses Admin.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/setup-password', async (req, res) => {
    try {
      if (getEnvAdminPassword()) {
        res.status(403).json({
          error:
            'Password Admin sudah dikelola melalui environment variable ADMIN_PASSWORD.',
        });
        return;
      }

      const password =
        typeof req.body?.password === 'string' ? req.body.password : '';
      if (password.length < 6 || password.length > 128) {
        res.status(400).json({
          error: 'Password Admin minimal 6 karakter dan maksimal 128 karakter.',
        });
        return;
      }

      const passwordHash = hashPasswordScrypt(password);
      const claimed = useSupabase()
        ? await claimSupabaseAdminPasswordHash(passwordHash)
        : await claimAdminPasswordHash(passwordHash);

      if (!claimed) {
        res.status(403).json({
          error:
            'Password Admin sudah pernah ditetapkan. Silakan login dengan password yang ada.',
        });
        return;
      }

      const token = issueAdminToken();
      res.status(201).json({ token });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menetapkan password Admin.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const password =
        typeof req.body?.password === 'string' ? req.body.password : '';
      if (!password) {
        res.status(400).json({ error: 'Password Admin wajib diisi.' });
        return;
      }

      const envPass = getEnvAdminPassword();
      if (envPass) {
        if (!verifyEnvPasswordConstantTime(password, envPass)) {
          res.status(401).json({ error: 'Password Admin tidak sesuai.' });
          return;
        }
        res.json({ token: issueAdminToken() });
        return;
      }

      const storedHash = useSupabase()
        ? await getSupabaseAdminPasswordHash()
        : await getAdminPasswordHash();

      if (!storedHash) {
        res.status(409).json({
          error:
            'Password Admin belum dibuat. Silakan atur password Admin terlebih dahulu.',
        });
        return;
      }

      if (!verifyPasswordScrypt(password, storedHash)) {
        res.status(401).json({ error: 'Password Admin tidak sesuai.' });
        return;
      }

      res.json({ token: issueAdminToken() });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memverifikasi login Admin.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/change-password', requireAdminAuth, async (req, res) => {
    try {
      if (getEnvAdminPassword()) {
        res.status(400).json({
          error:
            'Password Admin dikelola oleh secret ADMIN_PASSWORD. Ubah melalui Settings -> Secrets.',
        });
        return;
      }

      const newPassword =
        typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      if (newPassword.length < 6 || newPassword.length > 128) {
        res.status(400).json({
          error: 'Password baru minimal 6 karakter dan maksimal 128 karakter.',
        });
        return;
      }

      const passwordHash = hashPasswordScrypt(newPassword);
      if (useSupabase()) {
        await updateSupabaseAdminPasswordHash(passwordHash);
      } else {
        await updateAdminPasswordHash(passwordHash);
      }

      res.json({ updated: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui password Admin.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/teacher-password', requireAdminAuth, async (req, res) => {
    try {
      if (getEnvTeacherPassword()) {
        res.status(400).json({
          error:
            'Password Guru dikelola oleh secret TEACHER_PASSWORD. Ubah melalui Settings -> Secrets.',
        });
        return;
      }

      const newPassword =
        typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      if (newPassword.length < 6 || newPassword.length > 128) {
        res.status(400).json({
          error: 'Password Guru minimal 6 karakter dan maksimal 128 karakter.',
        });
        return;
      }

      const passwordHash = hashPasswordScrypt(newPassword);
      if (useSupabase()) {
        await updateSupabaseTeacherPasswordHash(passwordHash);
      } else {
        await updateTeacherPasswordHash(passwordHash);
      }

      res.json({ updated: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan password Guru.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/admin/categories', requireAdminAuth, async (_req, res) => {
    try {
      const items = useSupabase()
        ? await listSupabaseCategories()
        : await listCategories();
      res.json({ categories: items });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memuat kategori.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/categories', requireAdminAuth, async (req, res) => {
    try {
      const nameCheck = sanitizeCategoryName(req.body?.name);
      if (!nameCheck.valid || !nameCheck.value) {
        res.status(400).json({ error: nameCheck.error });
        return;
      }

      const created = useSupabase()
        ? await createSupabaseCategory(nameCheck.value)
        : await createCategory(nameCheck.value);

      res.status(201).json({ category: created });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'CATEGORY_DUPLICATE') {
        res.status(409).json({ error: 'Nama kategori tersebut sudah ada.' });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Gagal menambahkan kategori.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/categories/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'ID kategori tidak valid.' });
        return;
      }

      const nameCheck = sanitizeCategoryName(req.body?.name);
      if (!nameCheck.valid || !nameCheck.value) {
        res.status(400).json({ error: nameCheck.error });
        return;
      }

      const updated = useSupabase()
        ? await renameSupabaseCategory(id, nameCheck.value)
        : await renameCategory(id, nameCheck.value);

      if (!updated) {
        res.status(404).json({ error: 'Kategori tidak ditemukan.' });
        return;
      }

      res.json({ category: updated });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'CATEGORY_DUPLICATE') {
        res.status(409).json({ error: 'Nama kategori tersebut sudah ada.' });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Gagal mengubah kategori.';
      res.status(500).json({ error: message });
    }
  });

  app.delete(
    '/api/admin/categories/:id',
    requireAdminAuth,
    async (req, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res.status(400).json({ error: 'ID kategori tidak valid.' });
          return;
        }

        const deleted = useSupabase()
          ? await deleteSupabaseCategory(id)
          : await deleteCategory(id);

        if (!deleted) {
          res.status(404).json({ error: 'Kategori tidak ditemukan.' });
          return;
        }

        res.json({ deletedId: id });
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === 'LAST_CATEGORY_PROTECTION'
        ) {
          res.status(400).json({
            error: 'Minimal harus ada satu kategori aktif.',
          });
          return;
        }
        const message =
          error instanceof Error ? error.message : 'Gagal menghapus kategori.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.get('/api/admin/links', requireAdminAuth, async (_req, res) => {
    try {
      const [items, cats] = useSupabase()
        ? await Promise.all([listSupabaseLinks('all'), listSupabaseCategories()])
        : await Promise.all([listAllLinks('all'), listCategories()]);
      res.json({ links: items, categories: cats });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memuat daftar aplikasi.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/links', requireAdminAuth, async (req, res) => {
    try {
      const titleCheck = sanitizeLinkTitle(req.body?.title);
      if (!titleCheck.valid || !titleCheck.value) {
        res.status(400).json({ error: titleCheck.error });
        return;
      }

      const urlCheck = normalizeAndValidateHttpUrl(req.body?.url);
      if (!urlCheck.valid || !urlCheck.url) {
        res.status(400).json({ error: urlCheck.error });
        return;
      }

      const description = sanitizeDescription(req.body?.description);
      const category = sanitizeCategory(req.body?.category);
      const iconName = sanitizeIconName(req.body?.iconName);
      const iconColor = sanitizeIconColor(req.body?.iconColor);
      const iconStyle = sanitizeIconStyle(req.body?.iconStyle);
      const forStudents =
        req.body?.forStudents === undefined ? true : Boolean(req.body.forStudents);
      const forTeachers =
        req.body?.forTeachers === undefined ? true : Boolean(req.body.forTeachers);
      const isPublished =
        req.body?.isPublished === undefined ? true : Boolean(req.body.isPublished);
      const isPinned = Boolean(req.body?.isPinned);

      const created = useSupabase()
        ? await createSupabaseLink({
            title: titleCheck.value,
            url: urlCheck.url,
            description,
            category,
            iconName,
            iconColor,
            iconStyle,
            forStudents,
            forTeachers,
            isPublished,
            isPinned,
          })
        : await createLink({
            title: titleCheck.value,
            url: urlCheck.url,
            description,
            category,
            iconName,
            iconColor,
            iconStyle,
            forStudents,
            forTeachers,
            isPublished,
            isPinned,
          });

      res.status(201).json({ link: created });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal menyimpan link aplikasi.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/links/seed', requireAdminAuth, async (_req, res) => {
    try {
      if (useSupabase()) {
        await seedSupabaseStarterLinks();
        const items = await listSupabaseLinks('all');
        res.json({ links: items });
        return;
      }
      await seedStarterLinks();
      const items = await listAllLinks('all');
      res.json({ links: items });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memuat contoh aplikasi.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/links/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'ID tautan tidak valid.' });
        return;
      }

      const updates: Parameters<typeof updateLink>[1] = {};
      if (req.body?.title !== undefined) {
        const titleCheck = sanitizeLinkTitle(req.body.title);
        if (!titleCheck.valid || !titleCheck.value) {
          res.status(400).json({ error: titleCheck.error });
          return;
        }
        updates.title = titleCheck.value;
      }
      if (req.body?.url !== undefined) {
        const urlCheck = normalizeAndValidateHttpUrl(req.body.url);
        if (!urlCheck.valid || !urlCheck.url) {
          res.status(400).json({ error: urlCheck.error });
          return;
        }
        updates.url = urlCheck.url;
      }
      if (req.body?.description !== undefined) {
        updates.description = sanitizeDescription(req.body.description);
      }
      if (req.body?.category !== undefined) {
        updates.category = sanitizeCategory(req.body.category);
      }
      if (req.body?.iconName !== undefined) {
        updates.iconName = sanitizeIconName(req.body.iconName);
      }
      if (req.body?.iconColor !== undefined) {
        updates.iconColor = sanitizeIconColor(req.body.iconColor);
      }
      if (req.body?.iconStyle !== undefined) {
        updates.iconStyle = sanitizeIconStyle(req.body.iconStyle);
      }
      if (req.body?.forStudents !== undefined) {
        updates.forStudents = Boolean(req.body.forStudents);
      }
      if (req.body?.forTeachers !== undefined) {
        updates.forTeachers = Boolean(req.body.forTeachers);
      }
      if (req.body?.isPublished !== undefined) {
        updates.isPublished = Boolean(req.body.isPublished);
      }
      if (req.body?.isPinned !== undefined) {
        updates.isPinned = Boolean(req.body.isPinned);
      }

      const updated = useSupabase()
        ? await updateSupabaseLink(id, updates)
        : await updateLink(id, updates);

      if (!updated) {
        res.status(404).json({ error: 'Link aplikasi tidak ditemukan.' });
        return;
      }
      res.json({ link: updated });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memperbarui link.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/admin/links/:id', requireAdminAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'ID tautan tidak valid.' });
        return;
      }
      if (useSupabase()) {
        await deleteSupabaseLink(id);
      } else {
        const ok = await deleteLink(id);
        if (!ok) {
          res.status(404).json({ error: 'Link aplikasi tidak ditemukan.' });
          return;
        }
      }
      res.json({ deletedId: id });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal menghapus link.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/school', requireAdminAuth, async (req, res) => {
    try {
      const logoCheck = validateLogoSource(req.body?.logoUrl);
      if (!logoCheck.valid) {
        res.status(400).json({ error: logoCheck.error });
        return;
      }

      const t1 = sanitizeSchoolTitle(req.body?.title1, 'Judul 1', true);
      if (!t1.valid || !t1.value) {
        res.status(400).json({ error: t1.error });
        return;
      }
      const t2 = sanitizeSchoolTitle(req.body?.title2, 'Judul 2', false);
      const t3 = sanitizeSchoolTitle(req.body?.title3, 'Judul 3', false);

      const payload = {
        logoUrl: logoCheck.value ?? '',
        title1: t1.value,
        title2: t2.value ?? '',
        title3: t3.value ?? '',
      };

      const saved = useSupabase()
        ? await updateSupabaseSchoolSettings(payload)
        : await updateSchoolSettings(payload);

      res.json({ schoolSettings: saved });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan pengaturan sekolah.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkVault server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
