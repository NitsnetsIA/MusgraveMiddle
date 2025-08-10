import { sql, relations } from "drizzle-orm";
import { pgTable, text, real, integer, serial, timestamp, boolean } from "drizzle-orm/pg-core";
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

// Tabla de Puntos de Entrega
export const deliveryCenters = pgTable("delivery_centers", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Tabla de Tiendas
export const stores = pgTable("stores", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  responsible_email: text("responsible_email"),
  delivery_center_code: text("delivery_center_code").notNull().references(() => deliveryCenters.code),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Tabla de Usuarios
export const users = pgTable("users", {
  email: text("email").primaryKey(),
  store_id: text("store_id").notNull().references(() => stores.code),
  name: text("name"),
  password_hash: text("password_hash").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Tabla de Órdenes de Compra
export const purchaseOrders = pgTable("purchase_orders", {
  purchase_order_id: text("purchase_order_id").primaryKey(),
  user_email: text("user_email").notNull().references(() => users.email),
  store_id: text("store_id").notNull().references(() => stores.code),
  status: text("status").notNull(),
  subtotal: real("subtotal").notNull(),
  tax_total: real("tax_total").notNull(),
  final_total: real("final_total").notNull(),
  server_sent_at: timestamp("server_sent_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Tabla de Líneas de Órdenes de Compra
export const purchaseOrderItems = pgTable("purchase_order_items", {
  item_id: integer("item_id").primaryKey().generatedAlwaysAsIdentity(),
  purchase_order_id: text("purchase_order_id").notNull().references(() => purchaseOrders.purchase_order_id),
  item_ean: text("item_ean").notNull(),
  item_title: text("item_title"),
  item_description: text("item_description"),
  unit_of_measure: text("unit_of_measure"),
  quantity_measure: real("quantity_measure"),
  image_url: text("image_url"),
  quantity: real("quantity").notNull(),
  base_price_at_order: real("base_price_at_order").notNull(),
  tax_rate_at_order: real("tax_rate_at_order").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Tabla de Pedidos (Finales)
export const orders = pgTable("orders", {
  order_id: text("order_id").primaryKey(),
  source_purchase_order_id: text("source_purchase_order_id").references(() => purchaseOrders.purchase_order_id), // NULL permitido para pedidos directos
  user_email: text("user_email").notNull().references(() => users.email),
  store_id: text("store_id").notNull().references(() => stores.code),
  observations: text("observations"),
  subtotal: real("subtotal").notNull(),
  tax_total: real("tax_total").notNull(),
  final_total: real("final_total").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Tabla de Líneas de Pedido (Finales)
export const orderItems = pgTable("order_items", {
  item_id: integer("item_id").primaryKey().generatedAlwaysAsIdentity(),
  order_id: text("order_id").notNull().references(() => orders.order_id),
  item_ean: text("item_ean").notNull(),
  item_title: text("item_title"),
  item_description: text("item_description"),
  unit_of_measure: text("unit_of_measure"),
  quantity_measure: real("quantity_measure"),
  image_url: text("image_url"),
  quantity: real("quantity").notNull(),
  base_price_at_order: real("base_price_at_order").notNull(),
  tax_rate_at_order: real("tax_rate_at_order").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Relations
export const deliveryCentersRelations = relations(deliveryCenters, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  deliveryCenter: one(deliveryCenters, {
    fields: [stores.delivery_center_code],
    references: [deliveryCenters.code],
  }),
  users: many(users),
  purchaseOrders: many(purchaseOrders),
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.store_id],
    references: [stores.code],
  }),
  purchaseOrders: many(purchaseOrders),
  orders: many(orders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [purchaseOrders.user_email],
    references: [users.email],
  }),
  store: one(stores, {
    fields: [purchaseOrders.store_id],
    references: [stores.code],
  }),
  items: many(purchaseOrderItems),
  order: one(orders, {
    fields: [purchaseOrders.purchase_order_id],
    references: [orders.source_purchase_order_id],
  }),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchase_order_id],
    references: [purchaseOrders.purchase_order_id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  sourcePurchaseOrder: one(purchaseOrders, {
    fields: [orders.source_purchase_order_id],
    references: [purchaseOrders.purchase_order_id],
  }),
  user: one(users, {
    fields: [orders.user_email],
    references: [users.email],
  }),
  store: one(stores, {
    fields: [orders.store_id],
    references: [stores.code],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.order_id],
  }),
}));

export const taxesRelations = relations(taxes, ({ many }) => ({
  products: many(products),
}));

// Insert Schemas
export const insertTaxSchema = createInsertSchema(taxes).omit({
  created_at: true,
  updated_at: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  created_at: true,
  updated_at: true,
});

export const insertDeliveryCenterSchema = createInsertSchema(deliveryCenters).omit({
  created_at: true,
  updated_at: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  created_at: true,
  updated_at: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  created_at: true,
  updated_at: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  created_at: true,
  updated_at: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  created_at: true,
  updated_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  created_at: true,
  updated_at: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  created_at: true,
  updated_at: true,
});

// Types
export type InsertTax = z.infer<typeof insertTaxSchema>;
export type Tax = typeof taxes.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertDeliveryCenter = z.infer<typeof insertDeliveryCenterSchema>;
export type DeliveryCenter = typeof deliveryCenters.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Connection types for pagination
export type ProductConnection = {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
};

export type TaxConnection = {
  taxes: Tax[];
  total: number;
  limit: number;
  offset: number;
};

export type DeliveryCenterConnection = {
  deliveryCenters: DeliveryCenter[];
  total: number;
  limit: number;
  offset: number;
};

export type StoreConnection = {
  stores: Store[];
  total: number;
  limit: number;
  offset: number;
};

export type UserConnection = {
  users: User[];
  total: number;
  limit: number;
  offset: number;
};

export type PurchaseOrderConnection = {
  purchaseOrders: PurchaseOrder[];
  total: number;
  limit: number;
  offset: number;
};

export type OrderConnection = {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
};
