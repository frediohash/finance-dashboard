import { pgTable, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const assetStatusEnum = pgEnum("asset_status", ["active", "inactive", "disposed", "under_maintenance"]);

export const assets = pgTable("assets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: assetStatusEnum("status").default("active").notNull(),
  purchaseValue: numeric("purchase_value", { precision: 12, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  depreciationRate: numeric("depreciation_rate", { precision: 5, scale: 2 }),
  location: text("location"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});
