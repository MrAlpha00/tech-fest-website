import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const categoryEnum = pgEnum("category", ["SOFTWARE", "HARDWARE"]);
export const statusEnum = pgEnum("status", ["PENDING", "VERIFIED", "REJECTED"]);

// Admin table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event Settings table (for admin-managed content)
export const eventSettings = pgTable("event_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamName: text("team_name").notNull(),
  category: categoryEnum("category").notNull(),
  projectTitle: text("project_title").notNull(),
  projectSummary: text("project_summary").notNull(),
  collegeName: text("college_name").notNull(),
  mentorName: text("mentor_name"),
  mentorEmail: text("mentor_email"),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  memberCount: integer("member_count").notNull(),
  paymentProofUrl: text("payment_proof_url").notNull(),
  extraDocUrl: text("extra_doc_url"),
  status: statusEnum("status").notNull().default("PENDING"),
  verificationNote: text("verification_note"),
  qrCodeUrl: text("qr_code_url"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Members table
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  year: text("year").notNull(),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  performedBy: text("performed_by").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(members),
  auditLogs: many(auditLogs),
}));

export const membersRelations = relations(members, ({ one }) => ({
  team: one(teams, {
    fields: [members.teamId],
    references: [teams.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  team: one(teams, {
    fields: [auditLogs.teamId],
    references: [teams.id],
  }),
}));

// Zod Schemas for validation
export const insertAdminSchema = createInsertSchema(admins).pick({
  email: true,
  password: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertMemberSchema = createInsertSchema(members, {
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  year: z.string().min(1, "Year is required"),
  department: z.string().min(1, "Department is required"),
}).omit({
  id: true,
  teamId: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams, {
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  projectTitle: z.string().min(5, "Project title must be at least 5 characters"),
  projectSummary: z.string().min(100, "Summary must be at least 100 characters").max(1000, "Summary must not exceed 1000 characters"),
  collegeName: z.string().min(2, "College name is required"),
  contactPhone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  contactEmail: z.string().email("Invalid email address"),
  memberCount: z.number().min(2, "At least 2 members required").max(4, "Maximum 4 members allowed"),
}).omit({
  id: true,
  status: true,
  verificationNote: true,
  qrCodeUrl: true,
  verifiedAt: true,
  verifiedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const registrationSchema = insertTeamSchema.extend({
  members: z.array(insertMemberSchema).min(2, "At least 2 members required").max(4, "Maximum 4 members allowed"),
});

export const updateTeamStatusSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().optional(),
});

export const eventSettingSchema = createInsertSchema(eventSettings).omit({
  id: true,
  updatedAt: true,
});

// TypeScript Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type EventSetting = typeof eventSettings.$inferSelect;
export type InsertEventSetting = z.infer<typeof eventSettingSchema>;

// Extended types for API responses
export type TeamWithMembers = Team & { members: Member[] };
export type TeamWithDetails = TeamWithMembers & { auditLogs?: AuditLog[] };
