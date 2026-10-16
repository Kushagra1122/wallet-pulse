import { text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";

export const passes = sqliteTable("passes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  walletProvider: text("wallet_provider").notNull(),
  providerObjectId: text("provider_object_id").notNull().unique(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
