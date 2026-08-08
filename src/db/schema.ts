import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const quoteStatusEnum = pgEnum("quote_status", [
  "new",
  "in_progress",
  "converted",
  "closed",
]);

export const budgetStatusEnum = pgEnum("budget_status", [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending_assignment",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const pricingUnitEnum = pgEnum("pricing_unit", [
  "fixed",
  "m3",
  "unit",
]);

export const quoteSourceEnum = pgEnum("quote_source", ["panel", "website"]);

export const staffRoleEnum = pgEnum("staff_role", ["admin", "driver"]);

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const drivers = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  licenseNotes: text("license_notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Staff accounts for the /panel JWT auth (admin or linked driver) */
export const staffUsers = pgTable("staff_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: staffRoleEnum("role").default("admin").notNull(),
  driverId: uuid("driver_id")
    .unique()
    .references(() => drivers.id, { onDelete: "set null" }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const trucks = pgTable("trucks", {
  id: uuid("id").defaultRandom().primaryKey(),
  plate: varchar("plate", { length: 20 }).notNull(),
  label: varchar("label", { length: 120 }),
  capacityNotes: text("capacity_notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Catalog packages shown on home + used in quotes/budgets */
export const servicePackages = pgTable("service_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  shortDescription: varchar("short_description", { length: 280 }),
  description: text("description"),
  pricingType: pricingUnitEnum("pricing_type").default("fixed").notNull(),
  basePrice: numeric("base_price", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  includedM3: numeric("included_m3", { precision: 10, scale: 2 }),
  includedUnits: integer("included_units"),
  highlights: text("highlights"),
  active: boolean("active").default(true).notNull(),
  showOnHome: boolean("show_on_home").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  packageId: uuid("package_id").references(() => servicePackages.id, {
    onDelete: "set null",
  }),
  originAddress: text("origin_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  preferredDate: date("preferred_date"),
  volumeNotes: text("volume_notes"),
  estimatedM3: numeric("estimated_m3", { precision: 10, scale: 2 }),
  estimatedItems: integer("estimated_items"),
  source: quoteSourceEnum("source").default("panel").notNull(),
  status: quoteStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  quoteRequestId: uuid("quote_request_id").references(() => quoteRequests.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 200 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CLP").notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  status: budgetStatusEnum("status").default("draft").notNull(),
  validUntil: date("valid_until"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const budgetItems = pgTable("budget_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  budgetId: uuid("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  packageId: uuid("package_id").references(() => servicePackages.id, {
    onDelete: "set null",
  }),
  description: varchar("description", { length: 300 }).notNull(),
  pricingUnit: pricingUnitEnum("pricing_unit").default("unit").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 })
    .default("1")
    .notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  budgetId: uuid("budget_id").references(() => budgets.id, {
    onDelete: "set null",
  }),
  originAddress: text("origin_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  scheduledDate: date("scheduled_date"),
  scheduledTime: varchar("scheduled_time", { length: 5 }),
  status: jobStatusEnum("status").default("pending_assignment").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const jobAssignments = pgTable("job_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => drivers.id, { onDelete: "restrict" }),
  truckId: uuid("truck_id")
    .notNull()
    .references(() => trucks.id, { onDelete: "restrict" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  notes: text("notes"),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  quoteRequests: many(quoteRequests),
  budgets: many(budgets),
  jobs: many(jobs),
}));

export const servicePackagesRelations = relations(
  servicePackages,
  ({ many }) => ({
    quoteRequests: many(quoteRequests),
    budgetItems: many(budgetItems),
  }),
);

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  client: one(clients, {
    fields: [quoteRequests.clientId],
    references: [clients.id],
  }),
  package: one(servicePackages, {
    fields: [quoteRequests.packageId],
    references: [servicePackages.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  client: one(clients, {
    fields: [budgets.clientId],
    references: [clients.id],
  }),
  quoteRequest: one(quoteRequests, {
    fields: [budgets.quoteRequestId],
    references: [quoteRequests.id],
  }),
  items: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetItems.budgetId],
    references: [budgets.id],
  }),
  package: one(servicePackages, {
    fields: [budgetItems.packageId],
    references: [servicePackages.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(clients, {
    fields: [jobs.clientId],
    references: [clients.id],
  }),
  budget: one(budgets, {
    fields: [jobs.budgetId],
    references: [budgets.id],
  }),
  assignments: many(jobAssignments),
}));

export const jobAssignmentsRelations = relations(jobAssignments, ({ one }) => ({
  job: one(jobs, {
    fields: [jobAssignments.jobId],
    references: [jobs.id],
  }),
  driver: one(drivers, {
    fields: [jobAssignments.driverId],
    references: [drivers.id],
  }),
  truck: one(trucks, {
    fields: [jobAssignments.truckId],
    references: [trucks.id],
  }),
}));
