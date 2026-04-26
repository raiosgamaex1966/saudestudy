import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Enums ───
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const planEnum = pgEnum("plan", ["free", "monthly", "semester", "annual"]);
export const simulationTypeEnum = pgEnum("simulation_type", ["quiz", "exam", "questionnaire"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["initial", "purchase", "usage", "bonus"]);

// ─── Users ───
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("union_id", { length: 255 }).unique(),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  credits: integer("credits").default(5).notNull(),
  plan: planEnum("plan").default("free").notNull(),
  planExpiresAt: timestamp("plan_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignInAt: timestamp("last_sign_in_at").defaultNow().notNull(),
  blocked: boolean("blocked").default(false).notNull(),
  blockReason: varchar("block_reason", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subjects ───
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;

// ─── Materials ───
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  subjectId: integer("subject_id").references(() => subjects.id),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  isPublic: boolean("is_public").default(true).notNull(),
  isOfficial: boolean("is_official").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;

// ─── Simulations ───
export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: simulationTypeEnum("type").notNull(),
  subjectId: integer("subject_id").references(() => subjects.id),
  materialId: integer("material_id").references(() => materials.id),
  createdBy: integer("created_by").references(() => users.id),
  questions: jsonb("questions").notNull(),
  config: jsonb("config"),
  isPublic: boolean("is_public").default(true).notNull(),
  creditCost: integer("credit_cost").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Simulation = typeof simulations.$inferSelect;

// ─── Attempts ───
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").references(() => simulations.id),
  userId: integer("user_id").references(() => users.id),
  answers: jsonb("answers").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  correctCount: integer("correct_count"),
  totalQuestions: integer("total_questions"),
  timeSpent: integer("time_spent"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Attempt = typeof attempts.$inferSelect;

// ─── Credit Transactions ───
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// ─── API Keys ───
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 100 }).notNull(),
  keyValue: varchar("key_value", { length: 500 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
