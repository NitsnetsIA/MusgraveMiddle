import { sql, relations } from "drizzle-orm";
import { pgTable, text, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const taxes = pgTable("taxes", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  tax_rate: real("tax_rate").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const products = pgTable("products", {
  ean: text("ean").primaryKey(),
  ref: text("ref"),
  title: text("title").notNull(),
  description: text("description"),
  base_price: real("base_price").notNull(),
  tax_code: text("tax_code").notNull().references(() => taxes.code),
  unit_of_measure: text("unit_of_measure").notNull(),
  quantity_measure: real("quantity_measure").notNull(),
  image_url: text("image_url"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const productsRelations = relations(products, ({ one }) => ({
  tax: one(taxes, {
    fields: [products.tax_code],
    references: [taxes.code],
  }),
}));

export const taxesRelations = relations(taxes, ({ many }) => ({
  products: many(products),
}));

export const insertTaxSchema = createInsertSchema(taxes).omit({
  created_at: true,
  updated_at: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  created_at: true,
  updated_at: true,
});

export type InsertTax = z.infer<typeof insertTaxSchema>;
export type Tax = typeof taxes.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
