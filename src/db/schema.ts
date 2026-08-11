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
  /** Conductor habitual asignado por admin */
  defaultDriverId: uuid("default_driver_id").references(() => drivers.id, {
    onDelete: "set null",
  }),
  /** Permiso de circulación — solo datos, sin adjuntos */
  permisoCirculacionNumber: varchar("permiso_circulacion_number", {
    length: 80,
  }),
  permisoCirculacionExpiresAt: date("permiso_circulacion_expires_at"),
  /** SOAP */
  soapPolicyNumber: varchar("soap_policy_number", { length: 80 }),
  soapInsurer: varchar("soap_insurer", { length: 120 }),
  soapExpiresAt: date("soap_expires_at"),
  /** Revisión técnica */
  revisionTecnicaFolio: varchar("revision_tecnica_folio", { length: 80 }),
  revisionTecnicaExpiresAt: date("revision_tecnica_expires_at"),
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
  /** Chosen by the driver before going en camino (admin may prefill optionally) */
  truckId: uuid("truck_id").references(() => trucks.id, {
    onDelete: "restrict",
  }),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  notes: text("notes"),
  /** Salvo conducto — required before driver marks en camino */
  salvoConductoFolio: varchar("salvo_conducto_folio", { length: 80 }),
  salvoConductoIssuedAt: date("salvo_conducto_issued_at"),
  salvoConductoOriginCommune: varchar("salvo_conducto_origin_commune", {
    length: 120,
  }),
  salvoConductoDestinationCommune: varchar(
    "salvo_conducto_destination_commune",
    { length: 120 },
  ),
  salvoConductoNotes: text("salvo_conducto_notes"),
  salvoConductoCompletedAt: timestamp("salvo_conducto_completed_at", {
    withTimezone: true,
  }),
});

/** Singleton-ish pricing knobs for /cotizar (admin editable) */
export const quotePricingSettings = pgTable("quote_pricing_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  boxesPerM3: numeric("boxes_per_m3", { precision: 8, scale: 3 })
    .default("0.700")
    .notNull(),
  minBoxes: integer("min_boxes").default(6).notNull(),
  boxVolumeM3: numeric("box_volume_m3", { precision: 8, scale: 3 })
    .default("0.080")
    .notNull(),
  pricePerM3: numeric("price_per_m3", { precision: 14, scale: 2 })
    .default("25000")
    .notNull(),
  noElevatorPerFloor: numeric("no_elevator_per_floor", {
    precision: 14,
    scale: 2,
  })
    .default("15000")
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const movingCategories = pgTable("moving_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const movingCatalogItems = pgTable("moving_catalog_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => movingCategories.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  volumeM3: numeric("volume_m3", { precision: 10, scale: 3 })
    .default("0.1")
    .notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** In-app notifications for panel staff (admin / driver) */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  staffUserId: uuid("staff_user_id")
    .notNull()
    .references(() => staffUsers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 60 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  href: varchar("href", { length: 300 }),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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

export const movingCategoriesRelations = relations(
  movingCategories,
  ({ many }) => ({
    items: many(movingCatalogItems),
  }),
);

export const movingCatalogItemsRelations = relations(
  movingCatalogItems,
  ({ one }) => ({
    category: one(movingCategories, {
      fields: [movingCatalogItems.categoryId],
      references: [movingCategories.id],
    }),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  staffUser: one(staffUsers, {
    fields: [notifications.staffUserId],
    references: [staffUsers.id],
  }),
}));
