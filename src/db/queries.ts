import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { categories, links, schoolSettings } from './schema.ts';
import {
  DEFAULT_CATEGORIES,
  type AppIconColor,
  type AppIconName,
  type AppIconStyle,
  type LinkCategory,
} from '../lib/validators.ts';

export interface PublicSchoolSettings {
  logoUrl: string;
  title1: string;
  title2: string;
  title3: string;
  updatedAt: string;
}

export type LinkAudienceScope = 'all' | 'student' | 'teacher';

const DEFAULT_SETTINGS: PublicSchoolSettings = {
  logoUrl: '',
  title1: 'SMA Negeri 1 Nusantara',
  title2: 'Portal Aplikasi & Tautan Web Sekolah',
  title3: 'Akses Cepat Layanan Akademik, Administrasi & Pembelajaran',
  updatedAt: new Date().toISOString(),
};

async function ensureSchoolSettingsRow() {
  const existing = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.id, 1))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const inserted = await db
    .insert(schoolSettings)
    .values({
      id: 1,
      logoUrl: DEFAULT_SETTINGS.logoUrl,
      title1: DEFAULT_SETTINGS.title1,
      title2: DEFAULT_SETTINGS.title2,
      title3: DEFAULT_SETTINGS.title3,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0) {
    return inserted[0];
  }

  const fallback = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.id, 1))
    .limit(1);

  return fallback[0];
}

async function ensureDefaultCategories() {
  const existing = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  if (existing.length > 0) {
    return existing;
  }

  await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((name, idx) => ({
        name,
        sortOrder: idx + 1,
      }))
    )
    .onConflictDoNothing();

  return await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function listCategories() {
  try {
    return await ensureDefaultCategories();
  } catch (error) {
    console.error('Database error in listCategories:', error);
    throw new Error('Gagal memuat daftar kategori.', { cause: error });
  }
}

export async function createCategory(name: string) {
  try {
    const existing = await ensureDefaultCategories();
    const duplicate = existing.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      throw new Error('CATEGORY_DUPLICATE');
    }

    const maxOrder = existing.reduce(
      (max, item) => Math.max(max, item.sortOrder),
      0
    );

    const inserted = await db
      .insert(categories)
      .values({
        name,
        sortOrder: maxOrder + 1,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    if (error instanceof Error && error.message === 'CATEGORY_DUPLICATE') {
      throw error;
    }
    console.error('Database error in createCategory:', error);
    throw new Error('Gagal menambahkan kategori baru.', { cause: error });
  }
}

export async function renameCategory(id: number, newName: string) {
  try {
    const all = await ensureDefaultCategories();
    const target = all.find((c) => c.id === id);
    if (!target) {
      return null;
    }

    const duplicate = all.find(
      (c) => c.id !== id && c.name.toLowerCase() === newName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('CATEGORY_DUPLICATE');
    }

    const updated = await db
      .update(categories)
      .set({ name: newName })
      .where(eq(categories.id, id))
      .returning();

    if (target.name !== newName) {
      await db
        .update(links)
        .set({ category: newName, updatedAt: new Date() })
        .where(eq(links.category, target.name));
    }

    return updated[0] ?? null;
  } catch (error) {
    if (error instanceof Error && error.message === 'CATEGORY_DUPLICATE') {
      throw error;
    }
    console.error('Database error in renameCategory:', error);
    throw new Error('Gagal mengubah nama kategori.', { cause: error });
  }
}

export async function deleteCategory(id: number) {
  try {
    const all = await ensureDefaultCategories();
    const target = all.find((c) => c.id === id);
    if (!target) {
      return false;
    }

    if (all.length <= 1) {
      throw new Error('LAST_CATEGORY_PROTECTION');
    }

    const fallback = all.find((c) => c.id !== id)!;
    await db
      .update(links)
      .set({ category: fallback.name, updatedAt: new Date() })
      .where(eq(links.category, target.name));

    await db.delete(categories).where(eq(categories.id, id));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'LAST_CATEGORY_PROTECTION'
    ) {
      throw error;
    }
    console.error('Database error in deleteCategory:', error);
    throw new Error('Gagal menghapus kategori.', { cause: error });
  }
}

export async function getPublicSchoolSettings(): Promise<PublicSchoolSettings> {
  try {
    const row = await ensureSchoolSettingsRow();
    return {
      logoUrl: row.logoUrl,
      title1: row.title1,
      title2: row.title2,
      title3: row.title3,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Database error in getPublicSchoolSettings:', error);
    throw new Error('Gagal memuat pengaturan sekolah.', { cause: error });
  }
}

export async function updateSchoolSettings(params: {
  logoUrl?: string;
  title1?: string;
  title2?: string;
  title3?: string;
}): Promise<PublicSchoolSettings> {
  try {
    await ensureSchoolSettingsRow();
    const payload: Partial<typeof schoolSettings.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (params.logoUrl !== undefined) payload.logoUrl = params.logoUrl;
    if (params.title1 !== undefined) payload.title1 = params.title1;
    if (params.title2 !== undefined) payload.title2 = params.title2;
    if (params.title3 !== undefined) payload.title3 = params.title3;

    const updated = await db
      .update(schoolSettings)
      .set(payload)
      .where(eq(schoolSettings.id, 1))
      .returning();

    const row = updated[0];
    return {
      logoUrl: row.logoUrl,
      title1: row.title1,
      title2: row.title2,
      title3: row.title3,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Database error in updateSchoolSettings:', error);
    throw new Error('Gagal menyimpan pengaturan sekolah.', { cause: error });
  }
}

export async function getAdminPasswordHash(): Promise<string | null> {
  try {
    const row = await ensureSchoolSettingsRow();
    return row.adminPasswordHash ?? null;
  } catch (error) {
    console.error('Database error in getAdminPasswordHash:', error);
    throw new Error('Gagal memeriksa status password admin.', { cause: error });
  }
}

export async function getTeacherPasswordHash(): Promise<string | null> {
  try {
    const row = await ensureSchoolSettingsRow();
    return row.teacherPasswordHash ?? null;
  } catch (error) {
    console.error('Database error in getTeacherPasswordHash:', error);
    throw new Error('Gagal memeriksa status password guru.', { cause: error });
  }
}

export async function claimAdminPasswordHash(
  passwordHash: string
): Promise<boolean> {
  try {
    await ensureSchoolSettingsRow();
    const existing = await db
      .select({ hash: schoolSettings.adminPasswordHash })
      .from(schoolSettings)
      .where(eq(schoolSettings.id, 1))
      .limit(1);

    if (existing[0]?.hash) {
      return false;
    }

    await db
      .update(schoolSettings)
      .set({
        adminPasswordHash: passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(schoolSettings.id, 1));

    return true;
  } catch (error) {
    console.error('Database error in claimAdminPasswordHash:', error);
    throw new Error('Gagal menyimpan password admin awal.', { cause: error });
  }
}

export async function updateAdminPasswordHash(
  passwordHash: string
): Promise<void> {
  try {
    await ensureSchoolSettingsRow();
    await db
      .update(schoolSettings)
      .set({
        adminPasswordHash: passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(schoolSettings.id, 1));
  } catch (error) {
    console.error('Database error in updateAdminPasswordHash:', error);
    throw new Error('Gagal memperbarui password admin.', { cause: error });
  }
}

export async function updateTeacherPasswordHash(
  passwordHash: string
): Promise<void> {
  try {
    await ensureSchoolSettingsRow();
    await db
      .update(schoolSettings)
      .set({
        teacherPasswordHash: passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(schoolSettings.id, 1));
  } catch (error) {
    console.error('Database error in updateTeacherPasswordHash:', error);
    throw new Error('Gagal memperbarui password guru.', { cause: error });
  }
}

export async function listAllLinks(scope: LinkAudienceScope = 'all') {
  try {
    const baseQuery = db
      .select({
        id: links.id,
        title: links.title,
        url: links.url,
        description: links.description,
        category: links.category,
        iconName: links.iconName,
        iconColor: links.iconColor,
        iconStyle: links.iconStyle,
        forStudents: links.forStudents,
        forTeachers: links.forTeachers,
        isPublished: links.isPublished,
        isPinned: links.isPinned,
        clickCount: links.clickCount,
        createdAt: links.createdAt,
        updatedAt: links.updatedAt,
      })
      .from(links);

    if (scope === 'student') {
      return await baseQuery
        .where(and(eq(links.isPublished, true), eq(links.forStudents, true)))
        .orderBy(desc(links.isPinned), desc(links.updatedAt), desc(links.id));
    }

    if (scope === 'teacher') {
      return await baseQuery
        .where(and(eq(links.isPublished, true), eq(links.forTeachers, true)))
        .orderBy(desc(links.isPinned), desc(links.updatedAt), desc(links.id));
    }

    return await baseQuery.orderBy(
      desc(links.isPinned),
      desc(links.updatedAt),
      desc(links.id)
    );
  } catch (error) {
    console.error('Database error in listAllLinks:', error);
    throw new Error('Gagal memuat daftar tautan dari database.', {
      cause: error,
    });
  }
}

export async function getLinkById(id: number) {
  try {
    const rows = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database error in getLinkById:', error);
    throw new Error('Gagal mengambil detail tautan.', { cause: error });
  }
}

export async function createLink(params: {
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
}) {
  try {
    const inserted = await db
      .insert(links)
      .values({
        title: params.title,
        url: params.url,
        description: params.description,
        category: params.category,
        iconName: params.iconName,
        iconColor: params.iconColor,
        iconStyle: params.iconStyle,
        forStudents: params.forStudents,
        forTeachers: params.forTeachers,
        isPublished: params.isPublished,
        isPinned: params.isPinned,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database error in createLink:', error);
    throw new Error('Gagal menyimpan tautan baru ke database.', {
      cause: error,
    });
  }
}

export async function updateLink(
  id: number,
  params: {
    title?: string;
    url?: string;
    description?: string;
    category?: LinkCategory;
    iconName?: AppIconName;
    iconColor?: AppIconColor;
    iconStyle?: AppIconStyle;
    forStudents?: boolean;
    forTeachers?: boolean;
    isPublished?: boolean;
    isPinned?: boolean;
  }
) {
  try {
    const updatePayload: Partial<typeof links.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (params.title !== undefined) updatePayload.title = params.title;
    if (params.url !== undefined) updatePayload.url = params.url;
    if (params.description !== undefined)
      updatePayload.description = params.description;
    if (params.category !== undefined) updatePayload.category = params.category;
    if (params.iconName !== undefined) updatePayload.iconName = params.iconName;
    if (params.iconColor !== undefined)
      updatePayload.iconColor = params.iconColor;
    if (params.iconStyle !== undefined)
      updatePayload.iconStyle = params.iconStyle;
    if (params.forStudents !== undefined)
      updatePayload.forStudents = params.forStudents;
    if (params.forTeachers !== undefined)
      updatePayload.forTeachers = params.forTeachers;
    if (params.isPublished !== undefined)
      updatePayload.isPublished = params.isPublished;
    if (params.isPinned !== undefined) updatePayload.isPinned = params.isPinned;

    const updated = await db
      .update(links)
      .set(updatePayload)
      .where(eq(links.id, id))
      .returning();

    return updated[0] ?? null;
  } catch (error) {
    console.error('Database error in updateLink:', error);
    throw new Error('Gagal memperbarui data tautan.', { cause: error });
  }
}

export async function deleteLink(id: number) {
  try {
    const deleted = await db
      .delete(links)
      .where(eq(links.id, id))
      .returning({ id: links.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database error in deleteLink:', error);
    throw new Error('Gagal menghapus tautan dari database.', { cause: error });
  }
}

export async function incrementLinkClick(id: number) {
  try {
    const updated = await db
      .update(links)
      .set({
        clickCount: sql`${links.clickCount} + 1`,
      })
      .where(eq(links.id, id))
      .returning({ id: links.id, clickCount: links.clickCount });
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database error in incrementLinkClick:', error);
    throw new Error('Gagal mencatat kunjungan tautan.', { cause: error });
  }
}

export async function seedStarterLinks() {
  try {
    const existing = await db.select({ id: links.id }).from(links).limit(1);
    if (existing.length > 0) {
      return [];
    }

    const cats = await ensureDefaultCategories();
    const pick = (preferred: string) =>
      cats.find((c) => c.name === preferred)?.name ?? cats[0]?.name ?? 'Umum';

    const starters: Array<{
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
    }> = [
      {
        title: 'SIAKAD Sekolah',
        url: 'https://belajar.kemdikbud.go.id/',
        description:
          'Portal informasi akademik, nilai rapor digital, dan presensi siswa.',
        category: pick('Akademik'),
        iconName: 'GraduationCap',
        iconColor: 'blue',
        iconStyle: '3d',
        forStudents: true,
        forTeachers: true,
        isPublished: true,
        isPinned: true,
      },
      {
        title: 'E-Learning Kelas',
        url: 'https://classroom.google.com/',
        description:
          'Ruang kelas daring untuk materi ajar, tugas, dan diskusi pembelajaran.',
        category: pick('Pembelajaran'),
        iconName: 'Laptop',
        iconColor: 'emerald',
        iconStyle: '3d',
        forStudents: true,
        forTeachers: true,
        isPublished: true,
        isPinned: true,
      },
      {
        title: 'Perpustakaan Digital',
        url: 'https://buku.kemdikbud.go.id/',
        description:
          'Koleksi buku teks pelajaran dan bahan bacaan literasi sekolah.',
        category: pick('Referensi'),
        iconName: 'Library',
        iconColor: 'amber',
        iconStyle: '3d',
        forStudents: true,
        forTeachers: true,
        isPublished: true,
        isPinned: false,
      },
      {
        title: 'Panel Input Nilai Guru',
        url: 'https://calendar.google.com/',
        description:
          'Akses internal pendidik untuk pengisian nilai rapor, presensi, dan agenda rapat.',
        category: pick('Administrasi'),
        iconName: 'FileSpreadsheet',
        iconColor: 'indigo',
        iconStyle: '3d',
        forStudents: false,
        forTeachers: true,
        isPublished: true,
        isPinned: false,
      },
    ];

    return await db.insert(links).values(starters).returning();
  } catch (error) {
    console.error('Database error in seedStarterLinks:', error);
    throw new Error('Gagal memuat contoh aplikasi awal.', { cause: error });
  }
}
