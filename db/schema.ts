import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
export const siteState = sqliteTable("site_state", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export const motorcycles = sqliteTable("motorcycles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  category: text("category").notNull(),
  transmission: text("transmission").notNull(),
  consumption: text("consumption").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  daily: real("daily").notNull(),
  weekly: real("weekly").notNull(),
  available: integer("available", { mode: "boolean" }).notNull(),
  position: integer("position").notNull(),
});
export const banners = sqliteTable("banners", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  image: text("image").notNull(),
  link: text("link").notNull(),
  active: integer("active", { mode: "boolean" }).notNull(),
  position: integer("position").notNull(),
});
export const settings = sqliteTable("site_settings", {
  id: text("id").primaryKey(),
  whatsappNumber: text("whatsapp_number").notNull(),
  address: text("address").notNull(),
  hours: text("hours").notNull(),
  mapQuery: text("map_query").notNull(),
  mapLabel: text("map_label").notNull(),
  instagram: text("instagram").notNull(),
  facebook: text("facebook").notNull(),
});
export const activities = sqliteTable("admin_activities", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  at: text("at").notNull(),
  position: integer("position").notNull(),
});
export const metadata = sqliteTable("catalog_metadata", {
  id: text("id").primaryKey(),
  version: integer("version").notNull(),
  updatedAt: text("updated_at"),
  writeToken: text("write_token").notNull(),
});

export const adminSessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: integer("expires_at").notNull(),
});
export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  windowStart: integer("window_start").notNull(),
});
