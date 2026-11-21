import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const schoolSettings = pgTable('school_settings', {
  id: integer('id').primaryKey().default(1),
  logoUrl: text('logo_url').notNull().default(''),
  title1: text('title_1').notNull().default('SMA Negeri 1 Nusantara'),
  title2: text('title_2').notNull().default('Portal Aplikasi & Tautan Web Sekolah'),
  title3: text('title_3')
    .notNull()
    .default('Akses Cepat Layanan Akademik, Administrasi & Pembelajaran'),
  adminPasswordHash: text('admin_password_hash'),
  teacherPasswordHash: text('teacher_password_hash'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('Akademik'),
  iconName: text('icon_name').notNull().default('Globe'),
  iconColor: text('icon_color').notNull().default('blue'),
  iconStyle: text('icon_style').notNull().default('3d'),
  forStudents: boolean('for_students').notNull().default(true),
  forTeachers: boolean('for_teachers').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(true),
  isPinned: boolean('is_pinned').notNull().default(false),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
}));

export const linksRelations = relations(links, ({ one }) => ({
  author: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
}));
