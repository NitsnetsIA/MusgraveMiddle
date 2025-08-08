import { 
  products, taxes, deliveryCenters, stores, users, purchaseOrders, purchaseOrderItems, orders, orderItems,
  type Product, type InsertProduct, type Tax, type InsertTax,
  type DeliveryCenter, type InsertDeliveryCenter, type Store, type InsertStore,
  type User, type InsertUser, type PurchaseOrder, type InsertPurchaseOrder,
  type PurchaseOrderItem, type InsertPurchaseOrderItem, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem
} from "@shared/schema";
import { db } from "./db";
import { eq, gte, desc, sql } from "drizzle-orm";
import { generateRandomProduct } from "./product-generator.js";
import { generateCoherentEntities, hashPassword, SPANISH_CITIES, SPANISH_NAMES, STORE_TYPES, PURCHASE_ORDER_STATUSES, DELIVERY_CENTER_TYPES } from './entity-generator';
import { nanoid } from 'nanoid';

export interface ProductConnection {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaxConnection {
  taxes: Tax[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeleteAllResult {
  success: boolean;
  deletedCount: number;
  message: string;
}

export interface GenerateProductsResult {
  success: boolean;
  createdCount: number;
  products: Product[];
  message: string;
}

export interface IStorage {
  // Product methods
  getProducts(timestamp?: string, limit?: number, offset?: number): Promise<ProductConnection>;
  getProduct(ean: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(ean: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(ean: string): Promise<boolean>;
  deleteAllProducts(): Promise<DeleteAllResult>;
  generateRandomProducts(count: number, timestampOffset?: string): Promise<GenerateProductsResult>;
  
  // Tax methods
  getTaxes(timestamp?: string, limit?: number, offset?: number): Promise<TaxConnection>;
  getTax(code: string): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(code: string, tax: Partial<InsertTax>): Promise<Tax>;
  deleteTax(code: string): Promise<boolean>;
  deleteAllTaxes(): Promise<DeleteAllResult>;
  generateTaxes(clearExisting?: boolean, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }>;

  // Delivery Centers methods
  getDeliveryCenters(): Promise<DeliveryCenter[]>;
  getDeliveryCenter(code: string): Promise<DeliveryCenter | undefined>;
  createDeliveryCenter(deliveryCenter: InsertDeliveryCenter): Promise<DeliveryCenter>;
  updateDeliveryCenter(code: string, deliveryCenter: Partial<InsertDeliveryCenter>): Promise<DeliveryCenter>;
  deleteDeliveryCenter(code: string): Promise<boolean>;
  deleteAllDeliveryCenters(): Promise<DeleteAllResult>;

  // Stores methods
  getStores(): Promise<Store[]>;
  getStore(code: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(code: string, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(code: string): Promise<boolean>;
  deleteAllStores(): Promise<DeleteAllResult>;

  // Users methods
  getUsers(): Promise<User[]>;
  getUser(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(email: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(email: string): Promise<boolean>;
  deleteAllUsers(): Promise<DeleteAllResult>;

  // Purchase Orders methods
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(purchase_order_id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(purchase_order_id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  deletePurchaseOrder(purchase_order_id: string): Promise<boolean>;
  deleteAllPurchaseOrders(): Promise<DeleteAllResult>;

  // Purchase Order Items methods
  getPurchaseOrderItems(): Promise<PurchaseOrderItem[]>;
  getPurchaseOrderItem(item_id: number): Promise<PurchaseOrderItem | undefined>;
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(item_id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem>;
  deletePurchaseOrderItem(item_id: number): Promise<boolean>;
  deleteAllPurchaseOrderItems(): Promise<DeleteAllResult>;

  // Orders methods
  getOrders(): Promise<Order[]>;
  getOrder(order_id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(order_id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(order_id: string): Promise<boolean>;
  deleteAllOrders(): Promise<DeleteAllResult>;

  // Order Items methods
  getOrderItems(): Promise<OrderItem[]>;
  getOrderItem(item_id: number): Promise<OrderItem | undefined>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(item_id: number, item: Partial<InsertOrderItem>): Promise<OrderItem>;
  deleteOrderItem(item_id: number): Promise<boolean>;
  deleteAllOrderItems(): Promise<DeleteAllResult>;

  // Sync info method
  getSyncInfo(): Promise<{ entities: Array<{ entity_name: string; last_updated: Date | null; total_records: number }>; generated_at: Date }>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(timestamp?: string, limit: number = 100, offset: number = 0): Promise<ProductConnection> {
    let whereClause;
    if (timestamp) {
      const timestampDate = new Date(timestamp);
      whereClause = gte(products.updated_at, timestampDate);
    }

    // Get the total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(products)
      .where(whereClause || sql`TRUE`);
    
    const total = countResult[0]?.count || 0;

    // Get the paginated results
    const productsList = await db
      .select()
      .from(products)
      .where(whereClause || sql`TRUE`)
      .orderBy(desc(products.updated_at))
      .limit(limit)
      .offset(offset);

    return {
      products: productsList,
      total,
      limit,
      offset
    };
  }

  async getProduct(ean: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.ean, ean));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db
      .insert(products)
      .values({
        ...product,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateProduct(ean: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({
        ...product,
        updated_at: new Date(),
      })
      .where(eq(products.ean, ean))
      .returning();
    return updated;
  }

  async toggleProductStatus(ean: string): Promise<Product> {
    // Get current status
    const currentProduct = await db.select().from(products).where(eq(products.ean, ean)).limit(1);
    if (!currentProduct.length) {
      throw new Error('Product not found');
    }
    
    const [updated] = await db
      .update(products)
      .set({
        is_active: !currentProduct[0].is_active,
        updated_at: new Date(),
      })
      .where(eq(products.ean, ean))
      .returning();
    return updated;
  }

  async deleteProduct(ean: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.ean, ean));
    return result.rowCount! > 0;
  }

  async deleteAllProducts(): Promise<DeleteAllResult> {
    try {
      const result = await db.delete(products);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} products`
      };
    } catch (error) {
      console.error("Error deleting all products:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting products: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateRandomProducts(count: number, timestampOffset?: string): Promise<GenerateProductsResult> {
    try {
      if (count <= 0) {
        return {
          success: false,
          createdCount: 0,
          products: [],
          message: "Count must be greater than 0"
        };
      }

      if (count > 1000) {
        return {
          success: false,
          createdCount: 0,
          products: [],
          message: "Cannot generate more than 1000 products at once"
        };
      }

      // Use current time if no timestamp provided
      const finalTimestamp = timestampOffset || new Date().toISOString();
      
      // Validate timestamp if provided
      const offsetDate = new Date(finalTimestamp);
      if (isNaN(offsetDate.getTime())) {
        return {
          success: false,
          createdCount: 0,
          products: [],
          message: "Invalid timestamp format"
        };
      }

      // Generate random products (simplified approach)
      const randomProducts = [];
      
      for (let i = 0; i < count; i++) {
        const product = generateRandomProduct(finalTimestamp);
        randomProducts.push(product);
      }

      if (randomProducts.length === 0) {
        return {
          success: false,
          createdCount: 0,
          products: [],
          message: "No products could be generated"
        };
      }
      
      // Insert into database with conflict handling
      let insertedProducts: Product[] = [];
      try {
        insertedProducts = await db
          .insert(products)
          .values(randomProducts)
          .returning();
      } catch (error: any) {
        // If there are EAN conflicts, try inserting one by one and skip duplicates
        if (error.code === '23505') {
          for (const product of randomProducts) {
            try {
              const result = await db
                .insert(products)
                .values([product])
                .returning();
              insertedProducts.push(...result);
            } catch (insertError: any) {
              // Skip duplicate EANs silently
              if (insertError.code !== '23505') {
                throw insertError;
              }
            }
          }
        } else {
          throw error;
        }
      }

      return {
        success: true,
        createdCount: insertedProducts.length,
        products: insertedProducts,
        message: `Successfully generated ${insertedProducts.length} random products${insertedProducts.length < count ? ` (${count - insertedProducts.length} skipped due to EAN conflicts)` : ''}`
      };
    } catch (error) {
      console.error("Error generating random products:", error);
      return {
        success: false,
        createdCount: 0,
        products: [],
        message: `Error generating products: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getTaxes(timestamp?: string, limit: number = 100, offset: number = 0): Promise<TaxConnection> {
    let whereClause;
    if (timestamp) {
      const timestampDate = new Date(timestamp);
      whereClause = gte(taxes.updated_at, timestampDate);
    }

    // Get the total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(taxes)
      .where(whereClause || sql`TRUE`);
    
    const total = countResult[0]?.count || 0;

    // Get the paginated results
    const taxesList = await db
      .select()
      .from(taxes)
      .where(whereClause || sql`TRUE`)
      .orderBy(desc(taxes.updated_at))
      .limit(limit)
      .offset(offset);

    return {
      taxes: taxesList,
      total,
      limit,
      offset
    };
  }

  async getTax(code: string): Promise<Tax | undefined> {
    const [tax] = await db.select().from(taxes).where(eq(taxes.code, code));
    return tax || undefined;
  }

  async createTax(tax: InsertTax): Promise<Tax> {
    const [created] = await db
      .insert(taxes)
      .values({
        ...tax,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateTax(code: string, tax: Partial<InsertTax>): Promise<Tax> {
    const [updated] = await db
      .update(taxes)
      .set({
        ...tax,
        updated_at: new Date(),
      })
      .where(eq(taxes.code, code))
      .returning();
    return updated;
  }

  async deleteTax(code: string): Promise<boolean> {
    const result = await db.delete(taxes).where(eq(taxes.code, code));
    return result.rowCount! > 0;
  }

  async deleteAllTaxes(): Promise<DeleteAllResult> {
    try {
      const result = await db.delete(taxes);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} taxes`
      };
    } catch (error) {
      console.error("Error deleting all taxes:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting taxes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Delivery Centers CRUD
  async getDeliveryCenters(): Promise<DeliveryCenter[]> {
    return await db.select().from(deliveryCenters).orderBy(desc(deliveryCenters.updated_at));
  }

  async getDeliveryCenter(code: string): Promise<DeliveryCenter | undefined> {
    const [deliveryCenter] = await db.select().from(deliveryCenters).where(eq(deliveryCenters.code, code));
    return deliveryCenter || undefined;
  }

  async createDeliveryCenter(deliveryCenter: InsertDeliveryCenter): Promise<DeliveryCenter> {
    const [created] = await db
      .insert(deliveryCenters)
      .values({
        ...deliveryCenter,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateDeliveryCenter(code: string, deliveryCenter: Partial<InsertDeliveryCenter>): Promise<DeliveryCenter> {
    const [updated] = await db
      .update(deliveryCenters)
      .set({
        ...deliveryCenter,
        updated_at: new Date(),
      })
      .where(eq(deliveryCenters.code, code))
      .returning();
    return updated;
  }

  async deleteDeliveryCenter(code: string): Promise<boolean> {
    const result = await db.delete(deliveryCenters).where(eq(deliveryCenters.code, code));
    return result.rowCount! > 0;
  }

  async deleteAllDeliveryCenters(): Promise<DeleteAllResult> {
    try {
      // Delete in correct order to avoid foreign key constraints
      await db.execute(sql`DELETE FROM order_items;`);
      await db.execute(sql`DELETE FROM orders;`);
      await db.execute(sql`DELETE FROM purchase_order_items;`);
      await db.execute(sql`DELETE FROM purchase_orders;`);
      await db.execute(sql`DELETE FROM users;`);
      await db.execute(sql`DELETE FROM stores;`);
      const result = await db.delete(deliveryCenters);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} delivery centers and all dependent entities`
      };
    } catch (error) {
      console.error("Error deleting all delivery centers:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting delivery centers: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Stores CRUD
  async getStores(): Promise<Store[]> {
    return await db.select().from(stores).orderBy(desc(stores.updated_at));
  }

  async getStore(code: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.code, code));
    return store || undefined;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [created] = await db
      .insert(stores)
      .values({
        ...store,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateStore(code: string, store: Partial<InsertStore>): Promise<Store> {
    const [updated] = await db
      .update(stores)
      .set({
        ...store,
        updated_at: new Date(),
      })
      .where(eq(stores.code, code))
      .returning();
    return updated;
  }

  async toggleStoreStatus(code: string): Promise<Store> {
    // Get current status
    const currentStore = await db.select().from(stores).where(eq(stores.code, code)).limit(1);
    if (!currentStore.length) {
      throw new Error('Store not found');
    }
    
    const [updated] = await db
      .update(stores)
      .set({
        is_active: !currentStore[0].is_active,
        updated_at: new Date(),
      })
      .where(eq(stores.code, code))
      .returning();
    return updated;
  }

  async deleteStore(code: string): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.code, code));
    return result.rowCount! > 0;
  }

  async deleteAllStores(): Promise<DeleteAllResult> {
    try {
      // Delete in correct order to avoid foreign key constraints
      await db.execute(sql`DELETE FROM order_items;`);
      await db.execute(sql`DELETE FROM orders;`);
      await db.execute(sql`DELETE FROM purchase_order_items;`);
      await db.execute(sql`DELETE FROM purchase_orders;`);
      await db.execute(sql`DELETE FROM users;`);
      const result = await db.delete(stores);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} stores and all dependent entities`
      };
    } catch (error) {
      console.error("Error deleting all stores:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting stores: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Users CRUD
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.updated_at));
  }

  async getUser(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db
      .insert(users)
      .values({
        ...user,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateUser(email: string, user: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        ...user,
        updated_at: new Date(),
      })
      .where(eq(users.email, email))
      .returning();
    return updated;
  }

  async toggleUserStatus(email: string): Promise<User> {
    // Get current status
    const currentUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!currentUser.length) {
      throw new Error('User not found');
    }
    
    const [updated] = await db
      .update(users)
      .set({
        is_active: !currentUser[0].is_active,
        updated_at: new Date(),
      })
      .where(eq(users.email, email))
      .returning();
    return updated;
  }

  async deleteUser(email: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.email, email));
    return result.rowCount! > 0;
  }

  async deleteAllUsers(): Promise<DeleteAllResult> {
    try {
      // Delete in correct order to avoid foreign key constraints
      await db.execute(sql`DELETE FROM order_items;`);
      await db.execute(sql`DELETE FROM orders;`);
      await db.execute(sql`DELETE FROM purchase_order_items;`);
      await db.execute(sql`DELETE FROM purchase_orders;`);
      const result = await db.delete(users);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} users and all dependent entities`
      };
    } catch (error) {
      console.error("Error deleting all users:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting users: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Purchase Orders CRUD
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.updated_at));
  }

  async getPurchaseOrder(purchase_order_id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.purchase_order_id, purchase_order_id));
    return order || undefined;
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [created] = await db
      .insert(purchaseOrders)
      .values({
        ...order,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updatePurchaseOrder(purchase_order_id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const [updated] = await db
      .update(purchaseOrders)
      .set({
        ...order,
        updated_at: new Date(),
      })
      .where(eq(purchaseOrders.purchase_order_id, purchase_order_id))
      .returning();
    return updated;
  }

  async deletePurchaseOrder(purchase_order_id: string): Promise<boolean> {
    const result = await db.delete(purchaseOrders).where(eq(purchaseOrders.purchase_order_id, purchase_order_id));
    return result.rowCount! > 0;
  }

  async deleteAllPurchaseOrders(): Promise<DeleteAllResult> {
    try {
      // Delete in correct order to avoid foreign key constraints
      await db.execute(sql`DELETE FROM order_items;`);
      await db.execute(sql`DELETE FROM orders;`);
      await db.execute(sql`DELETE FROM purchase_order_items;`);
      const result = await db.delete(purchaseOrders);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} purchase orders and all dependent entities`
      };
    } catch (error) {
      console.error("Error deleting all purchase orders:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Purchase Order Items CRUD
  async getPurchaseOrderItems(): Promise<PurchaseOrderItem[]> {
    return await db.select().from(purchaseOrderItems).orderBy(desc(purchaseOrderItems.updated_at));
  }

  async getPurchaseOrderItemsByOrderId(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    return await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchase_order_id, purchaseOrderId))
      .orderBy(desc(purchaseOrderItems.updated_at));
  }

  async getPurchaseOrderItem(item_id: number): Promise<PurchaseOrderItem | undefined> {
    const [item] = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.item_id, item_id));
    return item || undefined;
  }

  async createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [created] = await db
      .insert(purchaseOrderItems)
      .values({
        ...item,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updatePurchaseOrderItem(item_id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem> {
    const [updated] = await db
      .update(purchaseOrderItems)
      .set({
        ...item,
        updated_at: new Date(),
      })
      .where(eq(purchaseOrderItems.item_id, item_id))
      .returning();
    return updated;
  }

  async deletePurchaseOrderItem(item_id: number): Promise<boolean> {
    const result = await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.item_id, item_id));
    return result.rowCount! > 0;
  }

  async deleteAllPurchaseOrderItems(): Promise<DeleteAllResult> {
    try {
      const result = await db.delete(purchaseOrderItems);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} purchase order items`
      };
    } catch (error) {
      console.error("Error deleting all purchase order items:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting purchase order items: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Orders CRUD
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.updated_at));
  }

  async getOrder(order_id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.order_id, order_id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db
      .insert(orders)
      .values({
        ...order,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateOrder(order_id: string, order: Partial<InsertOrder>): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({
        ...order,
        updated_at: new Date(),
      })
      .where(eq(orders.order_id, order_id))
      .returning();
    return updated;
  }

  async deleteOrder(order_id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.order_id, order_id));
    return result.rowCount! > 0;
  }

  async deleteAllOrders(): Promise<DeleteAllResult> {
    try {
      // Delete in correct order to avoid foreign key constraints
      await db.execute(sql`DELETE FROM order_items;`);
      const result = await db.delete(orders);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} orders and all order items`
      };
    } catch (error) {
      console.error("Error deleting all orders:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting orders: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Order Items CRUD
  async getOrderItems(): Promise<OrderItem[]> {
    return await db.select().from(orderItems).orderBy(desc(orderItems.updated_at));
  }

  async getOrderItem(item_id: number): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.item_id, item_id));
    return item || undefined;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db
      .insert(orderItems)
      .values({
        ...item,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return created;
  }

  async updateOrderItem(item_id: number, item: Partial<InsertOrderItem>): Promise<OrderItem> {
    const [updated] = await db
      .update(orderItems)
      .set({
        ...item,
        updated_at: new Date(),
      })
      .where(eq(orderItems.item_id, item_id))
      .returning();
    return updated;
  }

  async deleteOrderItem(item_id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.item_id, item_id));
    return result.rowCount! > 0;
  }

  async deleteAllOrderItems(): Promise<DeleteAllResult> {
    try {
      const result = await db.delete(orderItems);
      const deletedCount = result.rowCount || 0;
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} order items`
      };
    } catch (error) {
      console.error("Error deleting all order items:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Error deleting order items: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Sync info implementation
  async getSyncInfo(): Promise<{ entities: Array<{ entity_name: string; last_updated: Date | null; total_records: number }>; generated_at: Date }> {
    const entities = [
      { table: users, name: 'users' },
      { table: products, name: 'products' },
      { table: stores, name: 'stores' },
      { table: deliveryCenters, name: 'delivery_centers' },
      { table: purchaseOrders, name: 'purchase_orders' },
      { table: taxes, name: 'taxes' }
    ];

    const results = await Promise.all(
      entities.map(async ({ table, name }) => {
        // Get the most recent timestamp (either created_at or updated_at)
        const [result] = await db
          .select({
            last_updated: sql<Date>`GREATEST(MAX(created_at), MAX(updated_at))`,
            total_records: sql<number>`COUNT(*)`
          })
          .from(table);

        return {
          entity_name: name,
          last_updated: result.last_updated || null,
          total_records: Number(result.total_records) || 0
        };
      })
    );

    return {
      entities: results,
      generated_at: new Date()
    };
  }

  // Entity generation implementation
  // Individual entity generation methods with dependency validation
  async generateTaxes(clearExisting: boolean = false, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }> {
    try {
      if (clearExisting) {
        console.log("Clearing existing taxes...");
        await db.execute(sql`DELETE FROM taxes;`);
      }

      // Spanish IVA taxes for grocery - Fixed set of 4 taxes
      const taxesToCreate = [
        { code: 'IVA_GENERAL', name: 'IVA General', tax_rate: 0.21 },
        { code: 'IVA_REDUCIDO', name: 'IVA Reducido', tax_rate: 0.10 },
        { code: 'IVA_SUPERREDUCIDO', name: 'IVA Superreducido', tax_rate: 0.04 },
        { code: 'IVA_EXENTO', name: 'IVA Exento', tax_rate: 0.00 }
      ].map(tax => ({
        ...tax,
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Check for existing taxes to avoid duplicates
      const existingTaxes = await db.select({ code: taxes.code }).from(taxes).execute();
      const existingCodes = new Set(existingTaxes.map(tax => tax.code));

      // Filter out existing taxes
      const newTaxes = taxesToCreate.filter(tax => !existingCodes.has(tax.code));

      if (newTaxes.length > 0) {
        await db.insert(taxes).values(newTaxes);
      }

      return {
        success: true,
        entityType: "taxes",
        createdCount: newTaxes.length,
        message: `Successfully created ${newTaxes.length} Spanish IVA tax types. ${existingCodes.size > 0 ? `${existingCodes.size} taxes already existed.` : ''}`
      };
    } catch (error) {
      console.error('Error generating taxes:', error);
      return {
        success: false,
        entityType: "taxes",
        createdCount: 0,
        message: `Error generating taxes: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  async generateDeliveryCenters(count: number, clearExisting: boolean = false, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }> {
    try {
      if (clearExisting) {
        console.log("Clearing existing delivery centers...");
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
        await db.execute(sql`DELETE FROM purchase_order_items;`);
        await db.execute(sql`DELETE FROM purchase_orders;`);
        await db.execute(sql`DELETE FROM users;`);
        await db.execute(sql`DELETE FROM stores;`);
        await db.execute(sql`DELETE FROM delivery_centers;`);
      }

      // Get existing delivery centers to avoid duplicate codes
      const existingCenters = await db.select({ code: deliveryCenters.code }).from(deliveryCenters).execute();
      const existingCodes = new Set(existingCenters.map(center => center.code));

      // Generate unique delivery centers
      const centersToCreate = [];
      const usedCities = new Set<string>();
      let centerIndex = 1;

      // Find the next available index
      while (existingCodes.has(`DC${centerIndex.toString().padStart(3, '0')}`)) {
        centerIndex++;
      }

      for (let i = 0; i < count; i++) {
        let city;
        do {
          city = SPANISH_CITIES[Math.floor(Math.random() * SPANISH_CITIES.length)];
        } while (usedCities.has(city) && usedCities.size < SPANISH_CITIES.length);
        
        usedCities.add(city);
        const type = DELIVERY_CENTER_TYPES[Math.floor(Math.random() * DELIVERY_CENTER_TYPES.length)];
        const code = `DC${centerIndex.toString().padStart(3, '0')}`;
        
        centersToCreate.push({
          code,
          name: `${type} ${city}`,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        centerIndex++;
      }

      await db.insert(deliveryCenters).values(centersToCreate);

      return {
        success: true,
        entityType: "delivery_centers",
        createdCount: centersToCreate.length,
        message: `Successfully created ${centersToCreate.length} delivery centers.`
      };
    } catch (error) {
      console.error('Error generating delivery centers:', error);
      return {
        success: false,
        entityType: "delivery_centers",
        createdCount: 0,
        message: `Error generating delivery centers: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generateStores(storesPerCenter: number, clearExisting: boolean = false, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }> {
    try {
      // Check if delivery centers exist
      const existingDeliveryCenters = await db.select().from(deliveryCenters).execute();
      if (existingDeliveryCenters.length === 0) {
        return {
          success: false,
          entityType: "stores",
          createdCount: 0,
          message: "Cannot create stores: No delivery centers found. Please create delivery centers first."
        };
      }

      if (clearExisting) {
        console.log("Clearing existing stores and dependent entities...");
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
        await db.execute(sql`DELETE FROM purchase_order_items;`);
        await db.execute(sql`DELETE FROM purchase_orders;`);
        await db.execute(sql`DELETE FROM users;`);
        await db.execute(sql`DELETE FROM stores;`);
      }

      // Get existing stores to avoid duplicate codes
      const existingStores = await db.select({ code: stores.code }).from(stores).execute();
      const existingStoreCodes = new Set(existingStores.map(store => store.code));

      // Generate stores for existing delivery centers
      const storesToCreate = [];
      let storeIndex = 1;

      // Primero crear la tienda ES001 para el usuario por defecto si no existe
      if (!existingStoreCodes.has('ES001')) {
        const firstCenter = existingDeliveryCenters[0];
        if (firstCenter) {
          storesToCreate.push({
            code: 'ES001',
            name: 'Supermercado Madrid Centro',
            delivery_center_code: firstCenter.code,
            responsible_email: 'luis@esgranvia.es',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          existingStoreCodes.add('ES001'); // Add to set to avoid conflicts
        }
      }

      // Find the next available store index
      while (existingStoreCodes.has(`ST${storeIndex.toString().padStart(3, '0')}`)) {
        storeIndex++;
      }

      for (const deliveryCenter of existingDeliveryCenters) {
        for (let j = 0; j < storesPerCenter; j++) {
          const storeCode = `ST${storeIndex.toString().padStart(3, '0')}`;
          const cityIndex = Math.floor(Math.random() * SPANISH_CITIES.length);
          const storeTypeIndex = Math.floor(Math.random() * STORE_TYPES.length);
          
          storesToCreate.push({
            code: storeCode,
            name: `${STORE_TYPES[storeTypeIndex]} ${SPANISH_CITIES[cityIndex]} ${['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Plaza Mayor', 'Avenida'][Math.floor(Math.random() * 7)]}`,
            responsible_email: `gerente.${storeCode.toLowerCase()}@tiendas.com`,
            delivery_center_code: deliveryCenter.code,
            is_active: Math.random() > 0.1, // 90% active
            created_at: new Date(),
            updated_at: new Date()
          });
          
          storeIndex++;
        }
      }

      await db.insert(stores).values(storesToCreate);

      return {
        success: true,
        entityType: "stores",
        createdCount: storesToCreate.length,
        message: `Successfully created ${storesToCreate.length} stores across ${existingDeliveryCenters.length} delivery centers.`
      };
    } catch (error) {
      console.error('Error generating stores:', error);
      return {
        success: false,
        entityType: "stores",
        createdCount: 0,
        message: `Error generating stores: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generateUsers(usersPerStore: number, clearExisting: boolean = false, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }> {
    try {
      // Check if stores exist
      const existingStores = await db.select().from(stores).execute();
      if (existingStores.length === 0) {
        return {
          success: false,
          entityType: "users",
          createdCount: 0,
          message: "Cannot create users: No stores found. Please create stores first."
        };
      }

      if (clearExisting) {
        console.log("Clearing existing users and dependent entities...");
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
        await db.execute(sql`DELETE FROM purchase_order_items;`);
        await db.execute(sql`DELETE FROM purchase_orders;`);
        await db.execute(sql`DELETE FROM users;`);
      }

      // Get existing users to avoid duplicate emails
      const existingUsers = await db.select({ email: users.email }).from(users).execute();
      const existingEmails = new Set(existingUsers.map(user => user.email));

      // Generate users for existing stores
      const usersToCreate = [];
      let userIndex = 0;
      
      // Primero agregar el usuario por defecto Luis Romero Pérez si no existe
      const luisEmail = 'luis@esgranvia.es';
      if (!existingEmails.has(luisEmail)) {
        // Buscar tienda ES001 o usar la primera disponible
        const defaultStore = existingStores.find(s => s.code === 'ES001') || existingStores[0];
        if (defaultStore) {
          usersToCreate.push({
            email: luisEmail,
            store_id: defaultStore.code,
            name: 'Luis Romero Pérez',
            password_hash: hashPassword('password123', luisEmail),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          existingEmails.add(luisEmail);
        }
      }
      
      for (const store of existingStores) {
        for (let j = 0; j < usersPerStore; j++) {
          userIndex++;
          const firstName = SPANISH_NAMES.firstNames[Math.floor(Math.random() * SPANISH_NAMES.firstNames.length)];
          const lastName1 = SPANISH_NAMES.lastNames[Math.floor(Math.random() * SPANISH_NAMES.lastNames.length)];
          const lastName2 = SPANISH_NAMES.lastNames[Math.floor(Math.random() * SPANISH_NAMES.lastNames.length)];
          const fullName = `${firstName} ${lastName1} ${lastName2}`;
          const emailName = `${firstName.toLowerCase()}.${lastName1.toLowerCase()}`;
          
          // Generate unique email
          let email = `${emailName}@${store.code.toLowerCase()}.tiendas.com`;
          let emailIndex = 1;
          while (existingEmails.has(email)) {
            email = `${emailName}${emailIndex}@${store.code.toLowerCase()}.tiendas.com`;
            emailIndex++;
          }
          existingEmails.add(email); // Add to set to avoid duplicates in this batch
          
          usersToCreate.push({
            email,
            store_id: store.code,
            name: fullName,
            password_hash: hashPassword('password123', email),
            is_active: Math.random() > 0.05, // 95% active
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      await db.insert(users).values(usersToCreate);

      return {
        success: true,
        entityType: "users",
        createdCount: usersToCreate.length,
        message: `Successfully created ${usersToCreate.length} users across ${existingStores.length} stores.`
      };
    } catch (error) {
      console.error('Error generating users:', error);
      return {
        success: false,
        entityType: "users",
        createdCount: 0,
        message: `Error generating users: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generatePurchaseOrders(count: number, clearExisting: boolean = false, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }> {
    try {
      // Check if users exist
      const existingUsers = await db.select().from(users).execute();
      if (existingUsers.length === 0) {
        return {
          success: false,
          entityType: "purchase_orders",
          createdCount: 0,
          message: "Cannot create purchase orders: No users found. Please create users first."
        };
      }

      if (clearExisting) {
        console.log("Clearing existing purchase orders and dependent entities...");
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
        await db.execute(sql`DELETE FROM purchase_order_items;`);
        await db.execute(sql`DELETE FROM purchase_orders;`);
      }

      // Get existing purchase orders to avoid duplicate IDs
      const existingPOs = await db.select({ purchase_order_id: purchaseOrders.purchase_order_id }).from(purchaseOrders).execute();
      const existingPOIds = new Set(existingPOs.map(po => po.purchase_order_id));

      // Get existing products for line items
      const existingProducts = await db.select().from(products).limit(100).execute();
      if (existingProducts.length === 0) {
        return {
          success: false,
          entityType: "purchase_orders",
          createdCount: 0,
          message: "Cannot create purchase orders: No products found. Please create products first."
        };
      }

      // Generate purchase orders using existing users
      const purchaseOrdersToCreate = [];
      const purchaseOrderItemsToCreate = [];
      
      for (let i = 0; i < count; i++) {
        const randomUser = existingUsers[Math.floor(Math.random() * existingUsers.length)];
        
        // Generate unique purchase order ID with format: [CÓDIGO_TIENDA]-[TIMESTAMP]-[SUFIJO]
        let orderId: string;
        let attempts = 0;
        do {
          const now = new Date();
          // Format: YYMMDDHHMMSS
          const year = now.getFullYear().toString().slice(-2);
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const day = now.getDate().toString().padStart(2, '0');
          const hour = now.getHours().toString().padStart(2, '0');
          const minute = now.getMinutes().toString().padStart(2, '0');
          const second = now.getSeconds().toString().padStart(2, '0');
          const timestamp = `${year}${month}${day}${hour}${minute}${second}`;
          
          // Generate 3-character alphanumeric suffix
          const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const suffix = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          
          orderId = `${randomUser.store_id}-${timestamp}-${suffix}`;
          attempts++;
        } while (existingPOIds.has(orderId) && attempts < 10);
        
        if (attempts >= 10) {
          const fallbackSuffix = nanoid(3).toUpperCase();
          orderId = `${randomUser.store_id}-${Date.now()}-${fallbackSuffix}`;
        }
        existingPOIds.add(orderId); // Add to set to avoid duplicates in this batch
        
        // Generate line items for this purchase order (5-15 items to avoid database size issues)
        const numItems = Math.floor(Math.random() * 11) + 5; // 5-15 items
        const selectedProducts = [];
        const usedProducts = new Set();
        
        // Select random products without repeating
        for (let j = 0; j < numItems && selectedProducts.length < existingProducts.length; j++) {
          let product;
          let productAttempts = 0;
          do {
            product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
            productAttempts++;
          } while (usedProducts.has(product.ean) && productAttempts < 20);
          
          if (!usedProducts.has(product.ean)) {
            usedProducts.add(product.ean);
            selectedProducts.push(product);
          }
        }

        // Calculate totals based on actual line items
        let subtotal = 0;
        let taxTotal = 0;
        
        for (const product of selectedProducts) {
          const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
          const unitPrice = product.base_price;
          const lineSubtotal = quantity * unitPrice;
          
          // Get tax rate for this product
          const taxRate = await db
            .select({ tax_rate: taxes.tax_rate })
            .from(taxes)
            .where(eq(taxes.code, product.tax_code))
            .limit(1)
            .execute();
          
          const productTaxRate = taxRate.length > 0 ? taxRate[0].tax_rate : 0.21; // Default to 21%
          const lineTaxTotal = lineSubtotal * productTaxRate;
          
          subtotal += lineSubtotal;
          taxTotal += lineTaxTotal;
          
          // Add line item to create
          purchaseOrderItemsToCreate.push({
            purchase_order_id: orderId,
            item_ean: product.ean,
            item_title: product.title,
            item_description: product.description,
            unit_of_measure: product.unit_of_measure,
            quantity_measure: product.quantity_measure,
            image_url: product.image_url,
            quantity,
            base_price_at_order: unitPrice,
            tax_rate_at_order: productTaxRate,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        const finalTotal = Math.round((subtotal + taxTotal) * 100) / 100;
        
        purchaseOrdersToCreate.push({
          purchase_order_id: orderId,
          user_email: randomUser.email,
          store_id: randomUser.store_id,
          status: PURCHASE_ORDER_STATUSES[Math.floor(Math.random() * PURCHASE_ORDER_STATUSES.length)],
          subtotal: subtotal,
          tax_total: taxTotal,
          final_total: finalTotal,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Insert purchase orders and their items
      await db.insert(purchaseOrders).values(purchaseOrdersToCreate);
      if (purchaseOrderItemsToCreate.length > 0) {
        await db.insert(purchaseOrderItems).values(purchaseOrderItemsToCreate);
      }

      return {
        success: true,
        entityType: "purchase_orders",
        createdCount: purchaseOrdersToCreate.length,
        message: `Successfully created ${purchaseOrdersToCreate.length} purchase orders with ${purchaseOrderItemsToCreate.length} line items.`
      };
    } catch (error) {
      console.error('Error generating purchase orders:', error);
      return {
        success: false,
        entityType: "purchase_orders",
        createdCount: 0,
        message: `Error generating purchase orders: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Order Items by Order ID
  async getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.order_id, orderId))
      .orderBy(desc(orderItems.updated_at));
  }

  // Orders generation
  async generateOrders(count: number, clearExisting: boolean = false, timestampOffset?: string): Promise<{
    success: boolean;
    entityType: string;
    createdCount: number;
    message: string;
  }> {
    try {
      // Check if users and purchase orders exist
      const existingUsers = await db.select().from(users).execute();
      if (existingUsers.length === 0) {
        return {
          success: false,
          entityType: "orders",
          createdCount: 0,
          message: "Cannot create orders: No users found. Please create users first."
        };
      }

      const existingPOs = await db.select().from(purchaseOrders).execute();
      if (existingPOs.length === 0) {
        return {
          success: false,
          entityType: "orders",
          createdCount: 0,
          message: "Cannot create orders: No purchase orders found. Please create purchase orders first."
        };
      }

      if (clearExisting) {
        console.log("Clearing existing orders and order items...");
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
      }

      // Get existing products and delivery centers for line items
      const existingProducts = await db.select().from(products).limit(100).execute();
      const existingDeliveryCenters = await db.select().from(deliveryCenters).execute();
      
      if (existingProducts.length === 0 || existingDeliveryCenters.length === 0) {
        return {
          success: false,
          entityType: "orders",
          createdCount: 0,
          message: "Cannot create orders: Missing products or delivery centers."
        };
      }

      // Get existing orders to avoid duplicate IDs
      const existingOrderIds = await db.select({ order_id: orders.order_id }).from(orders).execute();
      const existingOrderIdSet = new Set(existingOrderIds.map(o => o.order_id));

      const ordersToCreate = [];
      const orderItemsToCreate = [];
      
      for (let i = 0; i < count; i++) {
        const randomUser = existingUsers[Math.floor(Math.random() * existingUsers.length)];
        const randomPO = existingPOs[Math.floor(Math.random() * existingPOs.length)];
        const randomDC = existingDeliveryCenters[Math.floor(Math.random() * existingDeliveryCenters.length)];
        
        // Generate unique order ID with format: [DELIVERY_CENTER_CODE]-[TIMESTAMP]-[SUFIJO]
        let orderId: string;
        let attempts = 0;
        do {
          const now = new Date();
          // Format: YYMMDDHHMMSS
          const year = now.getFullYear().toString().slice(-2);
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const day = now.getDate().toString().padStart(2, '0');
          const hour = now.getHours().toString().padStart(2, '0');
          const minute = now.getMinutes().toString().padStart(2, '0');
          const second = now.getSeconds().toString().padStart(2, '0');
          const timestamp = `${year}${month}${day}${hour}${minute}${second}`;
          
          // Generate 3-character alphanumeric suffix
          const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const suffix = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          
          orderId = `${randomDC.code}-${timestamp}-${suffix}`;
          attempts++;
        } while (existingOrderIdSet.has(orderId) && attempts < 10);
        
        if (attempts >= 10) {
          const fallbackSuffix = nanoid(3).toUpperCase();
          orderId = `${randomDC.code}-${Date.now()}-${fallbackSuffix}`;
        }
        existingOrderIdSet.add(orderId);
        
        // Generate line items for this order (30-50 items)
        const numItems = Math.floor(Math.random() * 21) + 30; // 30-50 items
        const selectedProducts = [];
        const usedProducts = new Set();
        
        // Select random products without repeating
        for (let j = 0; j < numItems && selectedProducts.length < existingProducts.length; j++) {
          let product;
          let productAttempts = 0;
          do {
            product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
            productAttempts++;
          } while (usedProducts.has(product.ean) && productAttempts < 20);
          
          if (!usedProducts.has(product.ean)) {
            usedProducts.add(product.ean);
            selectedProducts.push(product);
          }
        }

        // Calculate totals based on actual line items
        let subtotal = 0;
        let taxTotal = 0;
        
        for (const product of selectedProducts) {
          const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
          const unitPrice = product.base_price;
          const lineSubtotal = quantity * unitPrice;
          
          // Get tax rate for this product
          const taxRate = await db
            .select({ tax_rate: taxes.tax_rate })
            .from(taxes)
            .where(eq(taxes.code, product.tax_code))
            .limit(1)
            .execute();
          
          const productTaxRate = taxRate.length > 0 ? taxRate[0].tax_rate : 0.21; // Default to 21%
          const lineTaxTotal = lineSubtotal * productTaxRate;
          
          subtotal += lineSubtotal;
          taxTotal += lineTaxTotal;
          
          // Add line item to create
          orderItemsToCreate.push({
            order_id: orderId,
            item_ean: product.ean,
            item_title: product.title,
            item_description: product.description,
            unit_of_measure: product.unit_of_measure,
            quantity_measure: product.quantity_measure,
            image_url: product.image_url,
            quantity,
            base_price_at_order: unitPrice,
            tax_rate_at_order: productTaxRate,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        const finalTotal = Math.round((subtotal + taxTotal) * 100) / 100;
        
        ordersToCreate.push({
          order_id: orderId,
          source_purchase_order_id: randomPO.purchase_order_id,
          user_email: randomUser.email,
          store_id: randomUser.store_id,
          observations: `Pedido procesado automáticamente desde ${randomPO.purchase_order_id}`,
          subtotal: Math.round(subtotal * 100) / 100,
          tax_total: Math.round(taxTotal * 100) / 100,
          final_total: finalTotal,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Insert orders and their items
      await db.insert(orders).values(ordersToCreate);
      if (orderItemsToCreate.length > 0) {
        await db.insert(orderItems).values(orderItemsToCreate);
      }

      return {
        success: true,
        entityType: "orders",
        createdCount: ordersToCreate.length,
        message: `Successfully created ${ordersToCreate.length} orders with ${orderItemsToCreate.length} line items.`
      };
    } catch (error) {
      console.error('Error generating orders:', error);
      return {
        success: false,
        entityType: "orders",
        createdCount: 0,
        message: `Error generating orders: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async generateEntities(options: {
    deliveryCenters?: number;
    storesPerCenter?: number;
    usersPerStore?: number;
    purchaseOrders?: number;
    clearExisting?: boolean;
  }): Promise<{
    success: boolean;
    summary: {
      deliveryCenters: number;
      stores: number;
      users: number;
      purchaseOrders: number;
    };
    message: string;
  }> {
    const {
      deliveryCenters: deliveryCentersCount = 5,
      storesPerCenter = 3,
      usersPerStore = 4,
      purchaseOrders: purchaseOrdersCount = 20,
      clearExisting = false
    } = options;

    try {
      // Clear existing data if requested
      if (clearExisting) {
        console.log("Clearing existing entity data...");
        // Delete in correct order to avoid foreign key constraints
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
        await db.execute(sql`DELETE FROM purchase_order_items;`);
        await db.execute(sql`DELETE FROM purchase_orders;`);
        await db.execute(sql`DELETE FROM users;`);
        await db.execute(sql`DELETE FROM stores;`);
        await db.execute(sql`DELETE FROM delivery_centers;`);
        console.log("Existing entity data cleared successfully");
      }

      // Generate coherent entities
      const generated = generateCoherentEntities({
        deliveryCenters: deliveryCentersCount,
        storesPerCenter,
        usersPerStore,
        purchaseOrders: purchaseOrdersCount
      });

      // Insert delivery centers
      console.log(`Inserting ${generated.deliveryCenters.length} delivery centers...`);
      for (const center of generated.deliveryCenters) {
        await db.insert(deliveryCenters).values(center).execute();
      }

      // Insert stores
      console.log(`Inserting ${generated.stores.length} stores...`);
      for (const store of generated.stores) {
        await db.insert(stores).values(store).execute();
      }

      // Insert users
      console.log(`Inserting ${generated.users.length} users...`);
      for (const user of generated.users) {
        await db.insert(users).values(user).execute();
      }

      // Insert purchase orders
      console.log(`Inserting ${generated.purchaseOrders.length} purchase orders...`);
      for (const order of generated.purchaseOrders) {
        await db.insert(purchaseOrders).values(order).execute();
      }

      const message = `Successfully generated ${generated.summary.deliveryCenters} delivery centers, ${generated.summary.stores} stores, ${generated.summary.users} users, and ${generated.summary.purchaseOrders} purchase orders.`;
      
      console.log("Entity generation completed:", message);
      
      return {
        success: true,
        summary: generated.summary,
        message
      };

    } catch (error) {
      console.error("Error generating entities:", error);
      return {
        success: false,
        summary: {
          deliveryCenters: 0,
          stores: 0,
          users: 0,
          purchaseOrders: 0
        },
        message: `Error generating entities: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Delete all data method
  async deleteAllData(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Deleting all data from database...");
      
      // Delete in dependency order (child tables first)
      await db.execute(sql`DELETE FROM order_items;`);
      await db.execute(sql`DELETE FROM orders;`);
      await db.execute(sql`DELETE FROM purchase_order_items;`);
      await db.execute(sql`DELETE FROM purchase_orders;`);
      await db.execute(sql`DELETE FROM users;`);
      await db.execute(sql`DELETE FROM stores;`);
      await db.execute(sql`DELETE FROM delivery_centers;`);
      await db.execute(sql`DELETE FROM products;`);
      await db.execute(sql`DELETE FROM taxes;`);
      
      console.log("All data deleted successfully");
      
      return {
        success: true,
        message: "Todos los datos han sido eliminados correctamente."
      };
    } catch (error) {
      console.error('Error deleting all data:', error);
      return {
        success: false,
        message: `Error al eliminar los datos: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const storage = new DatabaseStorage();
