import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_CATEGORIES,
  type AppIconColor,
  type AppIconName,
  type AppIconStyle,
  type LinkCategory,
} from './validators.ts';
import type {
  LinkAudienceScope,
  PublicSchoolSettings,
} from '../db/queries.ts';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim()
  );
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const key = serviceKey || anonKey;
  if (!url || !key) {
    throw new Error('Konfigurasi Supabase belum tersedia di server.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const DEFAULT_SETTINGS: PublicSchoolSettings = {
  logoUrl: '',
  title1: 'SMA Negeri 1 Nusantara',
  title2: 'Portal Aplikasi & Tautan Web Sekolah',
  title3: 'Akses Cepat Layanan Akademik, Administrasi & Pembelajaran',
  updatedAt: new Date().toISOString(),
};

export async function listSupabaseCategories() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .select('id, name, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('Supabase listCategories error:', error);
    throw new Error('Gagal memuat kategori dari Supabase.');
  }

  if (data && data.length > 0) {
    return data.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      sortOrder: row.sort_order as number,
      createdAt: row.created_at as string,
    }));
  }

  const defaults = DEFAULT_CATEGORIES.map((name, idx) => ({
    name,
    sort_order: idx + 1,
  }));
  const { data: inserted } = await client
    .from('categories')
    .upsert(defaults, { onConflict: 'name' })
    .select('id, name, sort_order, created_at')
    .order('sort_order', { ascending: true });

  return (inserted || []).map((row) => ({
    id: row.id as number,
    name: row.name as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  }));
}

export async function createSupabaseCategory(name: string) {
  const existing = await listSupabaseCategories();
  const duplicate = existing.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    throw new Error('CATEGORY_DUPLICATE');
  }

  const maxOrder = existing.reduce((m, c) => Math.max(m, c.sortOrder), 0);
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .insert({ name, sort_order: maxOrder + 1 })
    .select('id, name, sort_order, created_at')
    .single();

  if (error || !data) {
    console.error('Supabase createCategory error:', error);
    throw new Error('Gagal menambahkan kategori baru ke Supabase.');
  }

  return {
    id: data.id as number,
    name: data.name as string,
    sortOrder: data.sort_order as number,
    createdAt: data.created_at as string,
  };
}

export async function renameSupabaseCategory(id: number, newName: string) {
  const existing = await listSupabaseCategories();
  const target = existing.find((c) => c.id === id);
  if (!target) return null;

  const duplicate = existing.find(
    (c) => c.id !== id && c.name.toLowerCase() === newName.toLowerCase()
  );
  if (duplicate) {
    throw new Error('CATEGORY_DUPLICATE');
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('categories')
    .update({ name: newName })
    .eq('id', id)
    .select('id, name, sort_order, created_at')
    .maybeSingle();

  if (error) {
    console.error('Supabase renameCategory error:', error);
    throw new Error('Gagal mengubah nama kategori di Supabase.');
  }
  if (!data) return null;

  if (target.name !== newName) {
    await client
      .from('links')
      .update({ category: newName, updated_at: new Date().toISOString() })
      .eq('category', target.name);
  }

  return {
    id: data.id as number,
    name: data.name as string,
    sortOrder: data.sort_order as number,
    createdAt: data.created_at as string,
  };
}

export async function deleteSupabaseCategory(id: number) {
  const existing = await listSupabaseCategories();
  const target = existing.find((c) => c.id === id);
  if (!target) return false;

  if (existing.length <= 1) {
    throw new Error('LAST_CATEGORY_PROTECTION');
  }

  const fallback = existing.find((c) => c.id !== id)!;
  const client = getSupabaseClient();
  await client
    .from('links')
    .update({ category: fallback.name, updated_at: new Date().toISOString() })
    .eq('category', target.name);

  const { error } = await client.from('categories').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteCategory error:', error);
    throw new Error('Gagal menghapus kategori di Supabase.');
  }
  return true;
}

export async function getSupabaseSchoolSettings(): Promise<PublicSchoolSettings> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('school_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Supabase getSchoolSettings error:', error);
    throw new Error('Gagal memuat pengaturan sekolah dari Supabase.');
  }

  if (!data) {
    return DEFAULT_SETTINGS;
  }

  return {
    logoUrl: (data.logo_url as string) || '',
    title1: (data.title_1 as string) || DEFAULT_SETTINGS.title1,
    title2: (data.title_2 as string) || DEFAULT_SETTINGS.title2,
    title3: (data.title_3 as string) || DEFAULT_SETTINGS.title3,
    updatedAt: (data.updated_at as string) || new Date().toISOString(),
  };
}

export async function updateSupabaseSchoolSettings(params: {
  logoUrl?: string;
  title1?: string;
  title2?: string;
  title3?: string;
}): Promise<PublicSchoolSettings> {
  const client = getSupabaseClient();
  const current = await getSupabaseSchoolSettings();
  const payload = {
    id: 1,
    logo_url: params.logoUrl ?? current.logoUrl,
    title_1: params.title1 ?? current.title1,
    title_2: params.title2 ?? current.title2,
    title_3: params.title3 ?? current.title3,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('school_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Supabase updateSchoolSettings error:', error);
    throw new Error('Gagal menyimpan pengaturan sekolah ke Supabase.');
  }

  return {
    logoUrl: (data.logo_url as string) || '',
    title1: data.title_1 as string,
    title2: data.title_2 as string,
    title3: data.title_3 as string,
    updatedAt: data.updated_at as string,
  };
}

export async function getSupabaseAdminPasswordHash(): Promise<string | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('admin_credentials')
    .select('password_hash')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Supabase getAdminPasswordHash error:', error);
    return null;
  }

  return (data?.password_hash as string | null) ?? null;
}

export async function getSupabaseTeacherPasswordHash(): Promise<string | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('admin_credentials')
    .select('teacher_password_hash')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Supabase getTeacherPasswordHash error:', error);
    return null;
  }

  return (data?.teacher_password_hash as string | null) ?? null;
}

export async function claimSupabaseAdminPasswordHash(
  passwordHash: string
): Promise<boolean> {
  const client = getSupabaseClient();
  const existing = await getSupabaseAdminPasswordHash();
  if (existing) {
    return false;
  }

  const { error } = await client.from('admin_credentials').upsert(
    {
      id: 1,
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Supabase claimAdminPasswordHash error:', error);
    throw new Error('Gagal menyimpan password admin awal di Supabase.');
  }
  return true;
}

export async function updateSupabaseAdminPasswordHash(
  passwordHash: string
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('admin_credentials').upsert(
    {
      id: 1,
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Supabase updateAdminPasswordHash error:', error);
    throw new Error('Gagal memperbarui password admin di Supabase.');
  }
}

export async function updateSupabaseTeacherPasswordHash(
  passwordHash: string
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('admin_credentials').upsert(
    {
      id: 1,
      teacher_password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Supabase updateTeacherPasswordHash error:', error);
    throw new Error('Gagal memperbarui password guru di Supabase.');
  }
}

interface SupabaseLinkRow {
  id: number;
  title: string;
  url: string;
  description: string;
  category: LinkCategory;
  icon_name: AppIconName;
  icon_color: AppIconColor;
  icon_style?: AppIconStyle;
  for_students?: boolean;
  for_teachers?: boolean;
  is_published: boolean;
  is_pinned: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

function mapSupabaseLink(row: SupabaseLinkRow) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    category: row.category,
    iconName: row.icon_name || 'Globe',
    iconColor: row.icon_color || 'blue',
    iconStyle: row.icon_style || '3d',
    forStudents: row.for_students ?? true,
    forTeachers: row.for_teachers ?? true,
    isPublished: row.is_published ?? true,
    isPinned: row.is_pinned ?? false,
    clickCount: row.click_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSupabaseLinks(scope: LinkAudienceScope = 'all') {
  const client = getSupabaseClient();
  let query = client
    .from('links')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false });

  if (scope === 'student') {
    query = query.eq('is_published', true).eq('for_students', true);
  } else if (scope === 'teacher') {
    query = query.eq('is_published', true).eq('for_teachers', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase listLinks error:', error);
    throw new Error('Gagal memuat daftar tautan dari Supabase.');
  }

  return ((data || []) as SupabaseLinkRow[]).map(mapSupabaseLink);
}

export async function getSupabaseLinkById(id: number) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('links')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Supabase getLinkById error:', error);
    throw new Error('Gagal memuat detail tautan dari Supabase.');
  }

  return data ? mapSupabaseLink(data as SupabaseLinkRow) : null;
}

export async function createSupabaseLink(params: {
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
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('links')
    .insert({
      title: params.title,
      url: params.url,
      description: params.description,
      category: params.category,
      icon_name: params.iconName,
      icon_color: params.iconColor,
      icon_style: params.iconStyle,
      for_students: params.forStudents,
      for_teachers: params.forTeachers,
      is_published: params.isPublished,
      is_pinned: params.isPinned,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Supabase createLink error:', error);
    throw new Error('Gagal menyimpan tautan baru ke Supabase.');
  }

  return mapSupabaseLink(data as SupabaseLinkRow);
}

export async function updateSupabaseLink(
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
  const client = getSupabaseClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (params.title !== undefined) payload.title = params.title;
  if (params.url !== undefined) payload.url = params.url;
  if (params.description !== undefined) payload.description = params.description;
  if (params.category !== undefined) payload.category = params.category;
  if (params.iconName !== undefined) payload.icon_name = params.iconName;
  if (params.iconColor !== undefined) payload.icon_color = params.iconColor;
  if (params.iconStyle !== undefined) payload.icon_style = params.iconStyle;
  if (params.forStudents !== undefined) payload.for_students = params.forStudents;
  if (params.forTeachers !== undefined) payload.for_teachers = params.forTeachers;
  if (params.isPublished !== undefined) payload.is_published = params.isPublished;
  if (params.isPinned !== undefined) payload.is_pinned = params.isPinned;

  const { data, error } = await client
    .from('links')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Supabase updateLink error:', error);
    throw new Error('Gagal memperbarui data tautan di Supabase.');
  }
  if (!data) return null;

  return mapSupabaseLink(data as SupabaseLinkRow);
}

export async function deleteSupabaseLink(id: number) {
  const client = getSupabaseClient();
  const { error } = await client.from('links').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteLink error:', error);
    throw new Error('Gagal menghapus tautan dari Supabase.');
  }
  return true;
}

export async function incrementSupabaseClick(id: number) {
  const client = getSupabaseClient();
  const { data: existing } = await client
    .from('links')
    .select('id, click_count')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return null;

  const { data, error } = await client
    .from('links')
    .update({ click_count: (existing.click_count as number) + 1 })
    .eq('id', id)
    .select('id, click_count')
    .single();

  if (error || !data) {
    throw new Error('Gagal mencatat kunjungan tautan.');
  }

  return { id: data.id, clickCount: data.click_count };
}

export async function seedSupabaseStarterLinks() {
  const client = getSupabaseClient();
  const { data: existing } = await client.from('links').select('id').limit(1);
  if (existing && existing.length > 0) {
    return [];
  }

  const cats = await listSupabaseCategories();
  const pick = (preferred: string) =>
    cats.find((c) => c.name === preferred)?.name ?? cats[0]?.name ?? 'Umum';

  const starters = [
    {
      title: 'SIAKAD Sekolah',
      url: 'https://belajar.kemdikbud.go.id/',
      description:
        'Portal informasi akademik, nilai rapor digital, dan presensi siswa.',
      category: pick('Akademik'),
      icon_name: 'GraduationCap',
      icon_color: 'blue',
      icon_style: '3d',
      for_students: true,
      for_teachers: true,
      is_published: true,
      is_pinned: true,
    },
    {
      title: 'E-Learning Kelas',
      url: 'https://classroom.google.com/',
      description:
        'Ruang kelas daring untuk materi ajar, tugas, dan diskusi pembelajaran.',
      category: pick('Pembelajaran'),
      icon_name: 'Laptop',
      icon_color: 'emerald',
      icon_style: '3d',
      for_students: true,
      for_teachers: true,
      is_published: true,
      is_pinned: true,
    },
    {
      title: 'Perpustakaan Digital',
      url: 'https://buku.kemdikbud.go.id/',
      description:
        'Koleksi buku teks pelajaran dan bahan bacaan literasi sekolah.',
      category: pick('Referensi'),
      icon_name: 'Library',
      icon_color: 'amber',
      icon_style: '3d',
      for_students: true,
      for_teachers: true,
      is_published: true,
      is_pinned: false,
    },
    {
      title: 'Panel Input Nilai Guru',
      url: 'https://calendar.google.com/',
      description:
        'Akses internal pendidik untuk pengisian nilai rapor, presensi, dan agenda rapat.',
      category: pick('Administrasi'),
      icon_name: 'FileSpreadsheet',
      icon_color: 'indigo',
      icon_style: '3d',
      for_students: false,
      for_teachers: true,
      is_published: true,
      is_pinned: false,
    },
  ];

  const { data, error } = await client.from('links').insert(starters).select('*');
  if (error) {
    console.error('Supabase seedStarterLinks error:', error);
    throw new Error('Gagal memuat contoh aplikasi awal ke Supabase.');
  }
  return ((data || []) as SupabaseLinkRow[]).map(mapSupabaseLink);
}
