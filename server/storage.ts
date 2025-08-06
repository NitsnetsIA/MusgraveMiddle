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

export interface DeleteAllProductsResult {
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
  deleteAllProducts(): Promise<DeleteAllProductsResult>;
  generateRandomProducts(count: number, timestampOffset?: string): Promise<GenerateProductsResult>;
  
  // Tax methods
  getTaxes(timestamp?: string, limit?: number, offset?: number): Promise<TaxConnection>;
  getTax(code: string): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(code: string, tax: Partial<InsertTax>): Promise<Tax>;
  deleteTax(code: string): Promise<boolean>;

  // Delivery Centers methods
  getDeliveryCenters(): Promise<DeliveryCenter[]>;
  getDeliveryCenter(code: string): Promise<DeliveryCenter | undefined>;
  createDeliveryCenter(deliveryCenter: InsertDeliveryCenter): Promise<DeliveryCenter>;
  updateDeliveryCenter(code: string, deliveryCenter: Partial<InsertDeliveryCenter>): Promise<DeliveryCenter>;
  deleteDeliveryCenter(code: string): Promise<boolean>;

  // Stores methods
  getStores(): Promise<Store[]>;
  getStore(code: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(code: string, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(code: string): Promise<boolean>;

  // Users methods
  getUsers(): Promise<User[]>;
  getUser(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(email: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(email: string): Promise<boolean>;

  // Purchase Orders methods
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(purchase_order_id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(purchase_order_id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  deletePurchaseOrder(purchase_order_id: string): Promise<boolean>;

  // Purchase Order Items methods
  getPurchaseOrderItems(): Promise<PurchaseOrderItem[]>;
  getPurchaseOrderItem(item_id: number): Promise<PurchaseOrderItem | undefined>;
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(item_id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem>;
  deletePurchaseOrderItem(item_id: number): Promise<boolean>;

  // Orders methods
  getOrders(): Promise<Order[]>;
  getOrder(order_id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(order_id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(order_id: string): Promise<boolean>;

  // Order Items methods
  getOrderItems(): Promise<OrderItem[]>;
  getOrderItem(item_id: number): Promise<OrderItem | undefined>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(item_id: number, item: Partial<InsertOrderItem>): Promise<OrderItem>;
  deleteOrderItem(item_id: number): Promise<boolean>;
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

  async deleteProduct(ean: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.ean, ean));
    return result.rowCount! > 0;
  }

  async deleteAllProducts(): Promise<DeleteAllProductsResult> {
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

  async deleteStore(code: string): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.code, code));
    return result.rowCount! > 0;
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

  async deleteUser(email: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.email, email));
    return result.rowCount! > 0;
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

  // Purchase Order Items CRUD
  async getPurchaseOrderItems(): Promise<PurchaseOrderItem[]> {
    return await db.select().from(purchaseOrderItems).orderBy(desc(purchaseOrderItems.updated_at));
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
}

export const storage = new DatabaseStorage();
