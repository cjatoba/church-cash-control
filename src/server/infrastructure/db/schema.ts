import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  canManageCampaigns: boolean("can_manage_campaigns").notNull().default(false),
  canReceiveFunds: boolean("can_receive_funds").notNull().default(false),
  phone: varchar("phone", { length: 20 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  goalCents: integer("goal_cents").notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactionCategoryTypeEnum = pgEnum("transaction_category_type", [
  "income",
  "expense",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["pix", "cash"]);

export const transactionCategories = pgTable("transaction_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: transactionCategoryTypeEnum("type").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const donors = pgTable("donors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pledgeTypes = pgTable("pledge_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  installmentValueCents: integer("installment_value_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pledges = pgTable("pledges", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  donorId: uuid("donor_id")
    .notNull()
    .references(() => donors.id, { onDelete: "cascade" }),
  pledgeTypeId: uuid("pledge_type_id")
    .notNull()
    .references(() => pledgeTypes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oneOffDonations = pgTable("one_off_donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  donorName: varchar("donor_name", { length: 255 }),
  amountCents: integer("amount_cents").notNull(),
  date: date("date", { mode: "date" }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  receivedByUserId: uuid("received_by_user_id").references(() => users.id),
  registeredByUserId: uuid("registered_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const installments = pgTable("installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  pledgeId: uuid("pledge_id")
    .notNull()
    .references(() => pledges.id, { onDelete: "cascade" }),
  dueDate: date("due_date", { mode: "date" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidAmountCents: integer("paid_amount_cents"),
  paymentMethod: paymentMethodEnum("payment_method"),
  receivedByUserId: uuid("received_by_user_id").references(() => users.id),
  registeredByUserId: uuid("registered_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLogActionEnum = pgEnum("activity_log_action", [
  "installment_paid",
  "installment_payment_corrected",
  "installment_payment_reverted",
  "campaign_updated",
  "campaign_archived",
  "campaign_restored",
  "transaction_category_archived",
  "transaction_category_restored",
]);

// subjectName/amountCents são um retrato do momento da ação (não FK para
// campanha/categoria/parcela): esses registros podem ser depois renomeados,
// arquivados ou até removidos (ex.: encurtar o período de uma campanha
// apaga parcelas pendentes), mas o log de auditoria precisa continuar
// legível mesmo assim.
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  action: activityLogActionEnum("action").notNull(),
  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  amountCents: integer("amount_cents"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
});

export const custodyTransfers = pgTable("custody_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  fromUserId: uuid("from_user_id")
    .notNull()
    .references(() => users.id),
  registeredByUserId: uuid("registered_by_user_id")
    .notNull()
    .references(() => users.id),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  transferDate: date("transfer_date", { mode: "date" }).notNull(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
