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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  goalCents: integer("goal_cents").notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactionCategoryTypeEnum = pgEnum("transaction_category_type", [
  "income",
  "expense",
]);

export const transactionCategories = pgTable("transaction_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: transactionCategoryTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const donors = pgTable("donors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
