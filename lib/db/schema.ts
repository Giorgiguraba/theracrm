/**
 * Drizzle schema for Stimuli CRM.
 * Multi-tenant: every tenant table has `tenant_id` and is locked down by RLS.
 * See lib/db/rls.sql for the policies that enforce isolation.
 */
import {
  pgTable, uuid, text, varchar, timestamp, integer, numeric,
  boolean, date, jsonb, pgEnum, uniqueIndex, index, primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* =========================  ENUMS  ========================= */
export const tenantStatus = pgEnum("tenant_status", [
  "active", "past_due", "suspended", "cancelled",
]);
export const userRole = pgEnum("user_role", [
  "platform_admin", "admin", "operator",
]);
export const programType = pgEnum("program_type", [
  "therapy", "course", "internship",
]);
export const leadSource = pgEnum("lead_source", [
  "fb_ads", "ig_ads", "manual", "referral",
]);
export const leadStage = pgEnum("lead_stage", [
  "new", "contacted", "thinking", "enrolled", "lost",
]);
export const activityType = pgEnum("activity_type", [
  "note", "call", "email_sent", "stage_change", "reminder",
]);
export const reminderStatus = pgEnum("reminder_status", [
  "pending", "done", "snoozed",
]);
export const invoiceStatus = pgEnum("invoice_status", [
  "unpaid", "paid", "void",
]);
export const emailStatus = pgEnum("email_status", [
  "queued", "sent", "delivered", "bounced", "failed",
]);

/* =========================  TENANTS  ========================= */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: tenantStatus("status").notNull().default("active"),
  plan: text("plan").notNull().default("pro"),
  paidUntil: date("paid_until"),
  graceDays: integer("grace_days").notNull().default(7),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  followupHours: integer("followup_hours").notNull().default(48),
  locale: text("locale").notNull().default("ka"),
  adSpendMonthly: numeric("ad_spend_monthly", { precision: 10, scale: 2 }),
  autoFollowupEmail: boolean("auto_followup_email").notNull().default(false),
});

/* =========================  USERS  ========================= */
/**
 * Mirror of supabase auth.users — id matches auth uid.
 * Tenant association + role lives here, NOT in auth.
 * (We sync from auth via a trigger; see rls.sql.)
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  role: userRole("role").notNull().default("operator"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byTenant: index("users_tenant_idx").on(t.tenantId),
}));

/* =========================  PROGRAMS  ========================= */
export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: programType("type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("GEL"),
  startDate: date("start_date"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byTenant: index("programs_tenant_idx").on(t.tenantId),
}));

/* =========================  LEADS  ========================= */
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  source: leadSource("source").notNull().default("manual"),
  metaLeadId: text("meta_lead_id"),
  programId: uuid("program_id").references(() => programs.id, { onDelete: "set null" }),
  stage: leadStage("stage").notNull().default("new"),
  stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).notNull().defaultNow(),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  birthDate: date("birth_date"),
  city: text("city"),
  occupation: text("occupation"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byTenantStage: index("leads_tenant_stage_idx").on(t.tenantId, t.stage),
  byMetaLeadId: uniqueIndex("leads_meta_lead_id_uq").on(t.metaLeadId),
}));

/* =========================  ACTIVITIES  ========================= */
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: activityType("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byLeadCreated: index("activities_lead_created_idx").on(t.leadId, t.createdAt),
}));

/* =========================  EMAIL  ========================= */
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key: text("key").notNull(), // e.g. "enrollment_confirmation"
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  locale: text("locale").notNull().default("ka"),
  isActive: boolean("is_active").notNull().default(true),
}, (t) => ({
  byTenantKeyLocale: uniqueIndex("email_tpl_uq").on(t.tenantId, t.key, t.locale),
}));

export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  templateKey: text("template_key"),
  status: emailStatus("status").notNull().default("queued"),
  providerId: text("provider_id"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

/* =========================  REMINDERS  ========================= */
export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  status: reminderStatus("status").notNull().default("pending"),
  createdBySystem: boolean("created_by_system").notNull().default(false),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
}, (t) => ({
  byDueStatus: index("reminders_due_status_idx").on(t.dueAt, t.status),
}));

/* =========================  PLATFORM  ========================= */
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // "2026-06"
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GEL"),
  status: invoiceStatus("status").notNull().default("unpaid"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformAudit = pgTable("platform_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  flag: text("flag").notNull(),
  enabled: boolean("enabled").notNull().default(false),
}, (t) => ({
  pk: primaryKey({ columns: [t.tenantId, t.flag] }),
}));

export const webhookLog = pgTable("webhook_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  source: text("source").notNull(), // "meta"
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  status: text("status").notNull(), // "ok" | "error" | "retry"
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* =========================  TYPES  ========================= */
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadInsert = typeof leads.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;

export const STAGE_ORDER = ["new", "contacted", "thinking", "enrolled", "lost"] as const;
export type Stage = (typeof STAGE_ORDER)[number];
