import { 
  products, taxes, deliveryCenters, stores, users, purchaseOrders, purchaseOrderItems, orders, orderItems, systemConfig,
  type Product, type InsertProduct, type Tax, type InsertTax,
  type DeliveryCenter, type InsertDeliveryCenter, type Store, type InsertStore,
  type User, type InsertUser, type PurchaseOrder, type InsertPurchaseOrder,
  type PurchaseOrderItem, type InsertPurchaseOrderItem, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type ProductConnection, type TaxConnection,
  type DeliveryCenterConnection, type StoreConnection, type UserConnection,
  type PurchaseOrderConnection, type OrderConnection, type SystemConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, gte, desc, sql } from "drizzle-orm";
import { generateRandomProduct } from "./product-generator.js";
import { generateCoherentEntities, hashPassword, SPANISH_CITIES, SPANISH_PROVINCES, SPANISH_NAMES, STORE_TYPES, PURCHASE_ORDER_STATUSES, DELIVERY_CENTER_TYPES } from './entity-generator';
import { nanoid } from 'nanoid';



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
  getDeliveryCenters(timestamp?: string, limit?: number, offset?: number): Promise<DeliveryCenterConnection>;
  getDeliveryCenter(code: string): Promise<DeliveryCenter | undefined>;
  createDeliveryCenter(deliveryCenter: InsertDeliveryCenter): Promise<DeliveryCenter>;
  updateDeliveryCenter(code: string, deliveryCenter: Partial<InsertDeliveryCenter>): Promise<DeliveryCenter>;
  deleteDeliveryCenter(code: string): Promise<boolean>;
  deleteAllDeliveryCenters(): Promise<DeleteAllResult>;
  toggleDeliveryCenterStatus(code: string): Promise<DeliveryCenter>;

  // Stores methods
  getStores(timestamp?: string, limit?: number, offset?: number): Promise<StoreConnection>;
  getStore(code: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(code: string, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(code: string): Promise<boolean>;
  deleteAllStores(): Promise<DeleteAllResult>;
  toggleStoreStatus(code: string): Promise<Store>;

  // Users methods
  getUsers(timestamp?: string, limit?: number, offset?: number, store_id?: string): Promise<UserConnection>;
  getUser(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(email: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(email: string): Promise<boolean>;
  deleteAllUsers(): Promise<DeleteAllResult>;
  toggleUserStatus(email: string): Promise<User>;
  loginUser(email: string, password: string): Promise<User>;

  // Purchase Orders methods
  getPurchaseOrders(timestamp?: string, limit?: number, offset?: number, store_id?: string): Promise<PurchaseOrderConnection>;
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
  getOrders(timestamp?: string, limit?: number, offset?: number, store_id?: string): Promise<OrderConnection>;
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
      .orderBy(products.ean)
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

      // Generate random products with guaranteed uniqueness (check against DB too)
      const randomProducts = [];
      const generatedEANs = new Set<string>();
      
      // Get existing EANs from database to avoid conflicts
      const existingProducts = await db.select({ ean: products.ean }).from(products);
      const existingEANs = new Set(existingProducts.map(p => p.ean));
      
      let successfulGenerations = 0;
      let attempts = 0;
      const maxTotalAttempts = count * 5; // Allow more attempts overall
      
      while (successfulGenerations < count && attempts < maxTotalAttempts) {
        const product = generateRandomProduct(finalTimestamp);
        attempts++;
        
        // Check if EAN is unique (both in this batch and in database)
        if (!generatedEANs.has(product.ean) && !existingEANs.has(product.ean)) {
          generatedEANs.add(product.ean);
          randomProducts.push(product);
          successfulGenerations++;
        }
      }

      if (randomProducts.length === 0) {
        return {
          success: false,
          createdCount: 0,
          products: [],
          message: "No products could be generated"
        };
      }
      
      // Insert into database - should not have conflicts now
      let insertedProducts: Product[] = [];
      try {
        insertedProducts = await db
          .insert(products)
          .values(randomProducts)
          .returning();
      } catch (error: any) {
        // Fallback: try inserting one by one if there are still conflicts
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
  async getDeliveryCenters(timestamp?: string, limit: number = 100, offset: number = 0): Promise<DeliveryCenterConnection> {
    try {
      let totalQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(deliveryCenters);
      let query = db.select().from(deliveryCenters);

      if (timestamp) {
        const timestampDate = new Date(timestamp);
        totalQuery = totalQuery.where(sql`${deliveryCenters.created_at} >= ${timestampDate} OR ${deliveryCenters.updated_at} >= ${timestampDate}`);
        query = query.where(sql`${deliveryCenters.created_at} >= ${timestampDate} OR ${deliveryCenters.updated_at} >= ${timestampDate}`);
      }

      const totalResult = await totalQuery;
      const total = totalResult[0]?.count || 0;

      const deliveryCentersList = await query
        .limit(limit)
        .offset(offset)
        .orderBy(deliveryCenters.code);

      return {
        deliveryCenters: deliveryCentersList,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error("Error fetching delivery centers:", error);
      throw new Error("Failed to fetch delivery centers");
    }
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

  async toggleDeliveryCenterStatus(code: string): Promise<DeliveryCenter> {
    // Get current status
    const currentCenter = await db.select().from(deliveryCenters).where(eq(deliveryCenters.code, code)).limit(1);
    if (!currentCenter.length) {
      throw new Error('Delivery center not found');
    }
    
    const [updated] = await db
      .update(deliveryCenters)
      .set({
        is_active: !currentCenter[0].is_active,
        updated_at: new Date(),
      })
      .where(eq(deliveryCenters.code, code))
      .returning();
    return updated;
  }

  // Stores CRUD
  async getStores(timestamp?: string, limit: number = 100, offset: number = 0): Promise<StoreConnection> {
    try {
      let totalQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(stores);
      let query = db.select().from(stores);

      if (timestamp) {
        const timestampDate = new Date(timestamp);
        totalQuery = totalQuery.where(sql`${stores.created_at} >= ${timestampDate} OR ${stores.updated_at} >= ${timestampDate}`);
        query = query.where(sql`${stores.created_at} >= ${timestampDate} OR ${stores.updated_at} >= ${timestampDate}`);
      }

      const totalResult = await totalQuery;
      const total = totalResult[0]?.count || 0;

      const storesList = await query
        .limit(limit)
        .offset(offset)
        .orderBy(stores.code);

      return {
        stores: storesList,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error("Error fetching stores:", error);
      throw new Error("Failed to fetch stores");
    }
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
  async getUsers(timestamp?: string, limit: number = 100, offset: number = 0, store_id?: string): Promise<UserConnection> {
    try {
      let totalQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users);
      let query = db.select().from(users);

      // Build WHERE conditions
      let whereConditions = [];
      
      if (timestamp) {
        const timestampDate = new Date(timestamp);
        whereConditions.push(sql`${users.created_at} >= ${timestampDate} OR ${users.updated_at} >= ${timestampDate}`);
      }
      
      if (store_id) {
        whereConditions.push(eq(users.store_id, store_id));
      }

      // Apply WHERE conditions
      if (whereConditions.length > 0) {
        const combinedWhere = whereConditions.length === 1 
          ? whereConditions[0] 
          : sql`${whereConditions[0]} AND ${whereConditions[1]}`;
        totalQuery = totalQuery.where(combinedWhere);
        query = query.where(combinedWhere);
      }

      const totalResult = await totalQuery;
      const total = totalResult[0]?.count || 0;

      const usersList = await query
        .limit(limit)
        .offset(offset)
        .orderBy(users.email);

      return {
        users: usersList,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
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

  async loginUser(email: string, password: string): Promise<User> {
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('User account is disabled');
    }

    // Hash the provided password with email as salt and compare
    const hashedPassword = hashPassword(password, email);
    if (hashedPassword !== user.password_hash) {
      throw new Error('Invalid credentials');
    }

    // Update last_login timestamp
    const [updatedUser] = await db
      .update(users)
      .set({
        last_login: new Date(),
        updated_at: new Date(),
      })
      .where(eq(users.email, email))
      .returning();

    return updatedUser;
  }

  // Purchase Orders CRUD
  async getPurchaseOrders(timestamp?: string, limit: number = 100, offset: number = 0, store_id?: string): Promise<PurchaseOrderConnection> {
    try {
      let totalQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(purchaseOrders);
      let query = db.select().from(purchaseOrders);

      // Build WHERE conditions
      let whereConditions = [];
      
      if (timestamp) {
        const timestampDate = new Date(timestamp);
        whereConditions.push(sql`${purchaseOrders.created_at} >= ${timestampDate} OR ${purchaseOrders.updated_at} >= ${timestampDate}`);
      }
      
      if (store_id) {
        whereConditions.push(eq(purchaseOrders.store_id, store_id));
      }

      // Apply WHERE conditions
      if (whereConditions.length > 0) {
        const combinedWhere = whereConditions.length === 1 
          ? whereConditions[0] 
          : sql`${whereConditions[0]} AND ${whereConditions[1]}`;
        totalQuery = totalQuery.where(combinedWhere);
        query = query.where(combinedWhere);
      }

      const totalResult = await totalQuery;
      const total = totalResult[0]?.count || 0;

      const purchaseOrdersList = await query
        .limit(limit)
        .offset(offset)
        .orderBy(purchaseOrders.purchase_order_id);

      return {
        purchaseOrders: purchaseOrdersList,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      throw new Error("Failed to fetch purchase orders");
    }
  }

  async getPurchaseOrder(purchase_order_id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.purchase_order_id, purchase_order_id));
    return order || undefined;
  }

  async createPurchaseOrder(order: InsertPurchaseOrder & { created_at?: Date | string; updated_at?: Date | string; server_sent_at?: Date | string }): Promise<PurchaseOrder> {
    const now = new Date();
    
    // Construir el objeto con solo campos no-undefined
    const insertData: any = {
      purchase_order_id: order.purchase_order_id,
      user_email: order.user_email,
      store_id: order.store_id,
      status: order.status,
      subtotal: order.subtotal,
      tax_total: order.tax_total,
      final_total: order.final_total,
    };

    // Solo agregar timestamps si están definidos, sino dejar que la DB use defaults
    if (order.created_at) {
      const createdAt = order.created_at instanceof Date ? order.created_at : new Date(order.created_at);
      if (!isNaN(createdAt.getTime())) insertData.created_at = createdAt;
    }

    if (order.updated_at) {
      const updatedAt = order.updated_at instanceof Date ? order.updated_at : new Date(order.updated_at);
      if (!isNaN(updatedAt.getTime())) insertData.updated_at = updatedAt;
    }

    // Siempre agregar server_sent_at si está definido (cuando la orden viene de una app cliente)
    if (order.server_sent_at !== undefined && order.server_sent_at !== null) {
      const serverSentAt = order.server_sent_at instanceof Date ? order.server_sent_at : new Date(order.server_sent_at);
      if (!isNaN(serverSentAt.getTime())) {
        insertData.server_sent_at = serverSentAt;
      }
    }
    
    const [created] = await db
      .insert(purchaseOrders)
      .values(insertData)
      .returning();

    // Verificar si la simulación automática está activada
    try {
      const [config] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, 'auto_simulate_orders_on_purchase'));

      if (config && config.value === 'true') {
        console.log('Auto-simulation enabled, creating order from purchase order:', created.purchase_order_id);
        
        // Generar order automáticamente usando la función de simulación
        const { createSimulatedOrder } = await import('./simulation.js');
        await createSimulatedOrder(created);
      }
    } catch (error) {
      console.error('Error checking auto-simulation config or creating order:', error);
      // No lanzar error para no interrumpir la creación de la purchase order
    }

    return created;
  }

  // Función para simular un pedido procesado a partir de una purchase order
  private async simulateOrderFromPurchaseOrder(purchaseOrder: PurchaseOrder): Promise<void> {
    try {
      // Obtener los items de la purchase order
      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchase_order_id, purchaseOrder.purchase_order_id));

      if (items.length === 0) {
        console.log('No items found for purchase order:', purchaseOrder.purchase_order_id);
        return;
      }

      // Obtener el store para conseguir el delivery center
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.code, purchaseOrder.store_id));

      if (!store) {
        console.error('Store not found for purchase order:', purchaseOrder.purchase_order_id);
        return;
      }

      // Generar ID del pedido procesado
      const timestamp = Date.now();
      const randomSuffix = nanoid(3).toUpperCase();
      const orderId = `${store.delivery_center_code}-${timestamp.toString().slice(-12)}-${randomSuffix}`;

      // Aplicar la lógica de simulación (80% sin cambios, 20% reducción)
      let newSubtotal = 0;
      let newTaxTotal = 0;
      const simulatedItems: any[] = [];

      for (const item of items) {
        let newQuantity = item.quantity;
        
        // 20% de posibilidades de reducir cantidad
        if (Math.random() < 0.2) {
          // Reducir cantidad entre 10% y 50%
          const reduction = 0.1 + Math.random() * 0.4;
          newQuantity = Math.max(1, Math.floor(item.quantity * (1 - reduction)));
        }

        const itemSubtotal = newQuantity * item.base_price_at_order;
        const itemTax = itemSubtotal * item.tax_rate_at_order;

        newSubtotal += itemSubtotal;
        newTaxTotal += itemTax;

        simulatedItems.push({
          order_id: orderId,
          item_ean: item.item_ean,
          item_title: item.item_title || null,
          item_description: item.item_description || null,
          unit_of_measure: item.unit_of_measure || null,
          quantity_measure: item.quantity_measure || null,
          image_url: item.image_url || null,
          quantity: newQuantity,
          base_price_at_order: item.base_price_at_order,
          tax_rate_at_order: item.tax_rate_at_order
        });
      }

      const newFinalTotal = newSubtotal + newTaxTotal;

      // Crear el pedido procesado
      const orderData = {
        order_id: orderId,
        source_purchase_order_id: purchaseOrder.purchase_order_id,
        user_email: purchaseOrder.user_email,
        store_id: purchaseOrder.store_id,
        observations: 'Pedido generado automáticamente mediante simulación',
        subtotal: Math.round(newSubtotal * 100) / 100,
        tax_total: Math.round(newTaxTotal * 100) / 100,
        final_total: Math.round(newFinalTotal * 100) / 100
      };

      // Insertar el pedido procesado
      const [createdOrder] = await db
        .insert(orders)
        .values(orderData)
        .returning();

      // Insertar los items del pedido procesado
      if (simulatedItems.length > 0) {
        await db
          .insert(orderItems)
          .values(simulatedItems);
      }

      console.log(`Simulated order created: ${orderId} from purchase order: ${purchaseOrder.purchase_order_id}`);
      
    } catch (error) {
      console.error('Error simulating order from purchase order:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(purchase_order_id: string, order: Partial<InsertPurchaseOrder & { created_at?: Date | string; updated_at?: Date | string }>): Promise<PurchaseOrder> {
    const now = new Date();
    
    // Función para convertir string a Date si es necesario
    const parseDate = (dateValue: any): Date => {
      if (!dateValue) return now;
      return dateValue instanceof Date ? dateValue : new Date(dateValue);
    };
    
    const [updated] = await db
      .update(purchaseOrders)
      .set({
        ...(order.status && { status: order.status }),
        ...(order.store_id && { store_id: order.store_id }),
        ...(order.purchase_order_id && { purchase_order_id: order.purchase_order_id }),
        ...(order.user_email && { user_email: order.user_email }),
        ...(order.subtotal !== undefined && { subtotal: order.subtotal }),
        ...(order.tax_total !== undefined && { tax_total: order.tax_total }),
        ...(order.final_total !== undefined && { final_total: order.final_total }),
        // Convertir updated_at de string a Date si es necesario
        updated_at: parseDate(order.updated_at),
        // Si hay server_sent_at, también convertirlo
        ...(order.server_sent_at && { server_sent_at: parseDate(order.server_sent_at) }),
        ...(order.created_at && { created_at: parseDate(order.created_at) }),
      })
      .where(eq(purchaseOrders.purchase_order_id, purchase_order_id))
      .returning();
    return updated;
  }

  // Método para crear purchase order con items de una vez
  async createPurchaseOrderWithItems(orderData: {
    purchaseOrder: InsertPurchaseOrder & { created_at?: Date | string; updated_at?: Date | string; server_sent_at?: Date | string };
    items: (InsertPurchaseOrderItem & { created_at?: Date | string; updated_at?: Date | string })[];
  }): Promise<PurchaseOrder> {
    const order = orderData.purchaseOrder;
    
    // Construir el objeto purchase order con solo campos válidos
    const insertData: any = {
      purchase_order_id: order.purchase_order_id,
      user_email: order.user_email,
      store_id: order.store_id,
      status: order.status,
      subtotal: order.subtotal,
      tax_total: order.tax_total,
      final_total: order.final_total,
    };

    // Solo agregar timestamps si están definidos
    if (order.created_at) {
      const createdAt = order.created_at instanceof Date ? order.created_at : new Date(order.created_at);
      if (!isNaN(createdAt.getTime())) insertData.created_at = createdAt;
    }

    if (order.updated_at) {
      const updatedAt = order.updated_at instanceof Date ? order.updated_at : new Date(order.updated_at);
      if (!isNaN(updatedAt.getTime())) insertData.updated_at = updatedAt;
    }

    // Siempre agregar server_sent_at si está definido (cuando la orden viene de una app cliente)
    if (order.server_sent_at !== undefined && order.server_sent_at !== null) {
      const serverSentAt = order.server_sent_at instanceof Date ? order.server_sent_at : new Date(order.server_sent_at);
      if (!isNaN(serverSentAt.getTime())) {
        insertData.server_sent_at = serverSentAt;
      }
    }
    
    // Crear la purchase order
    const [created] = await db
      .insert(purchaseOrders)
      .values(insertData)
      .returning();

    // Crear los items si se proporcionaron
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(item => {
        const itemData: any = {
          purchase_order_id: created.purchase_order_id,
          item_ean: item.item_ean,
          item_ref: item.item_ref,
          item_title: item.item_title,
          item_description: item.item_description,
          unit_of_measure: item.unit_of_measure,
          quantity_measure: item.quantity_measure,
          image_url: item.image_url,
          quantity: item.quantity,
          base_price_at_order: item.base_price_at_order,
          tax_rate_at_order: item.tax_rate_at_order,
        };

        // Solo agregar timestamps de item si están definidos
        if (item.created_at) {
          const createdAt = item.created_at instanceof Date ? item.created_at : new Date(item.created_at);
          if (!isNaN(createdAt.getTime())) itemData.created_at = createdAt;
        }

        if (item.updated_at) {
          const updatedAt = item.updated_at instanceof Date ? item.updated_at : new Date(item.updated_at);
          if (!isNaN(updatedAt.getTime())) itemData.updated_at = updatedAt;
        }

        return itemData;
      });
      
      await db.insert(purchaseOrderItems).values(itemsToInsert);
    }

    // Verificar si la simulación automática está activada
    try {
      const [config] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, 'auto_simulate_orders_on_purchase'));

      if (config && config.value === 'true') {
        console.log('Auto-simulation enabled, creating order from purchase order:', created.purchase_order_id);
        
        // Generar order automáticamente usando la función de simulación
        const { createSimulatedOrder } = await import('./simulation.js');
        await createSimulatedOrder(created);
      }
    } catch (error) {
      console.error('Error checking auto-simulation config or creating order:', error);
      // No lanzar error para no interrumpir la creación de la purchase order
    }

    return created;
  }

  async deletePurchaseOrder(purchase_order_id: string): Promise<boolean> {
    try {
      // Delete dependent orders first
      await db.delete(orderItems).where(sql`order_id IN (SELECT order_id FROM orders WHERE source_purchase_order_id = ${purchase_order_id})`);
      await db.delete(orders).where(eq(orders.source_purchase_order_id, purchase_order_id));
      
      // Delete purchase order items
      await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchase_order_id, purchase_order_id));
      
      // Finally delete the purchase order
      const result = await db.delete(purchaseOrders).where(eq(purchaseOrders.purchase_order_id, purchase_order_id));
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting purchase order with cascade:", error);
      return false;
    }
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

  async createPurchaseOrderItem(item: InsertPurchaseOrderItem & { created_at?: Date | string; updated_at?: Date | string }): Promise<PurchaseOrderItem> {
    const now = new Date();
    
    // Función para convertir string a Date si es necesario
    const parseDate = (dateValue: any): Date => {
      if (!dateValue) return now;
      return dateValue instanceof Date ? dateValue : new Date(dateValue);
    };
    
    const [created] = await db
      .insert(purchaseOrderItems)
      .values({
        ...item,
        // Convertir timestamps de string a Date si es necesario
        created_at: parseDate(item.created_at),
        updated_at: parseDate(item.updated_at),
      })
      .returning();

    // Verificar si la simulación automática está activada y si esta purchase order no tiene ya un pedido procesado
    try {
      const [config] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, 'auto_simulate_orders_on_purchase'));

      if (config && config.value === 'true') {
        // Verificar si ya existe un pedido procesado para esta purchase order
        const [existingOrder] = await db
          .select()
          .from(orders)
          .where(eq(orders.source_purchase_order_id, item.purchase_order_id));

        if (!existingOrder) {
          console.log('Auto-simulation enabled and no existing order found. Checking if purchase order has items now...');
          
          // Obtener la purchase order para disparar la simulación
          const [purchaseOrder] = await db
            .select()
            .from(purchaseOrders)
            .where(eq(purchaseOrders.purchase_order_id, item.purchase_order_id));

          if (purchaseOrder) {
            console.log('Purchase order found, triggering auto-simulation for:', purchaseOrder.purchase_order_id);
            const { createSimulatedOrder } = await import('./simulation.js');
            await createSimulatedOrder(purchaseOrder);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auto-simulation config when adding item:', error);
      // No lanzar error para no interrumpir la creación del item
    }

    return created;
  }

  async updatePurchaseOrderItem(item_id: number, item: Partial<InsertPurchaseOrderItem & { created_at?: Date | string; updated_at?: Date | string }>): Promise<PurchaseOrderItem> {
    const now = new Date();
    
    // Función para convertir string a Date si es necesario
    const parseDate = (dateValue: any): Date => {
      if (!dateValue) return now;
      return dateValue instanceof Date ? dateValue : new Date(dateValue);
    };
    
    const [updated] = await db
      .update(purchaseOrderItems)
      .set({
        ...(item.purchase_order_id && { purchase_order_id: item.purchase_order_id }),
        ...(item.item_ean && { item_ean: item.item_ean }),
        ...(item.item_ref && { item_ref: item.item_ref }),
        ...(item.item_title && { item_title: item.item_title }),
        ...(item.item_description && { item_description: item.item_description }),
        ...(item.unit_of_measure && { unit_of_measure: item.unit_of_measure }),
        ...(item.quantity_measure !== undefined && { quantity_measure: item.quantity_measure }),
        ...(item.image_url && { image_url: item.image_url }),
        ...(item.quantity !== undefined && { quantity: item.quantity }),
        ...(item.base_price_at_order !== undefined && { base_price_at_order: item.base_price_at_order }),
        ...(item.tax_rate_at_order !== undefined && { tax_rate_at_order: item.tax_rate_at_order }),
        // Convertir timestamps de string a Date si es necesario
        updated_at: parseDate(item.updated_at),
        ...(item.created_at && { created_at: parseDate(item.created_at) }),
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
  async getOrders(timestamp?: string, limit: number = 100, offset: number = 0, store_id?: string): Promise<OrderConnection> {
    try {
      let totalQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders);
      let query = db.select().from(orders);

      // Build WHERE conditions
      let whereConditions = [];
      
      if (timestamp) {
        const timestampDate = new Date(timestamp);
        whereConditions.push(sql`${orders.created_at} >= ${timestampDate} OR ${orders.updated_at} >= ${timestampDate}`);
      }
      
      if (store_id) {
        whereConditions.push(eq(orders.store_id, store_id));
      }

      // Apply WHERE conditions
      if (whereConditions.length > 0) {
        const combinedWhere = whereConditions.length === 1 
          ? whereConditions[0] 
          : sql`${whereConditions[0]} AND ${whereConditions[1]}`;
        totalQuery = totalQuery.where(combinedWhere);
        query = query.where(combinedWhere);
      }

      const totalResult = await totalQuery;
      const total = totalResult[0]?.count || 0;

      const ordersList = await query
        .limit(limit)
        .offset(offset)
        .orderBy(orders.order_id);

      return {
        orders: ordersList,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }
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
    try {
      // Delete order items first
      await db.delete(orderItems).where(eq(orderItems.order_id, order_id));
      
      // Delete the order
      const result = await db.delete(orders).where(eq(orders.order_id, order_id));
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting order with cascade:", error);
      return false;
    }
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

      let createdTaxes = [];
      if (newTaxes.length > 0) {
        createdTaxes = await db.insert(taxes).values(newTaxes).returning();
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

      const createdCenters = await db.insert(deliveryCenters).values(centersToCreate).returning();

      return {
        success: true,
        entityType: "delivery_centers",
        createdCount: createdCenters.length,
        message: `Successfully created ${createdCenters.length} delivery centers.`
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

      const createdStores = await db.insert(stores).values(storesToCreate).returning();

      return {
        success: true,
        entityType: "stores",
        createdCount: createdStores.length,
        message: `Successfully created ${createdStores.length} stores across ${existingDeliveryCenters.length} delivery centers.`
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

      const createdUsers = await db.insert(users).values(usersToCreate).returning();

      return {
        success: true,
        entityType: "users",
        createdCount: createdUsers.length,
        message: `Successfully created ${createdUsers.length} users across ${existingStores.length} stores.`
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

      // Get existing products for line items WITH TAX DATA (optimized with join)
      const existingProducts = await db
        .select({
          ean: products.ean,
          title: products.title,
          description: products.description,
          base_price: products.base_price,
          tax_code: products.tax_code,
          unit_of_measure: products.unit_of_measure,
          quantity_measure: products.quantity_measure,
          image_url: products.image_url,
          tax_rate: taxes.tax_rate
        })
        .from(products)
        .leftJoin(taxes, eq(products.tax_code, taxes.code))
        .limit(100)
        .execute();
        
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
        
        // Optimized ID generation - simpler and faster
        const orderId = `${randomUser.store_id}-${Date.now()}-${nanoid(3).toUpperCase()}${i.toString().padStart(3, '0')}`;
        
        // Generate 5-15 line items (optimized - no individual tax queries)
        const numItems = Math.floor(Math.random() * 11) + 5; // 5-15 items
        let subtotal = 0;
        let taxTotal = 0;
        
        for (let j = 0; j < numItems; j++) {
          const product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
          const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
          const unitPrice = product.base_price;
          const lineSubtotal = quantity * unitPrice;
          
          // Tax rate already loaded in the join query above
          const productTaxRate = product.tax_rate || 0.21; // Default to 21%
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
            created_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date(),
            updated_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date()
          });
        }
        
        const finalTotal = Math.round((subtotal + taxTotal) * 100) / 100;
        
        purchaseOrdersToCreate.push({
          purchase_order_id: orderId,
          user_email: randomUser.email,
          store_id: randomUser.store_id,
          status: PURCHASE_ORDER_STATUSES[Math.floor(Math.random() * PURCHASE_ORDER_STATUSES.length)],
          subtotal: Math.round(subtotal * 100) / 100,
          tax_total: Math.round(taxTotal * 100) / 100,
          final_total: finalTotal,
          created_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date(),
          updated_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date()
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

      // Get existing products WITH TAX DATA and delivery centers (optimized)
      const existingProducts = await db
        .select({
          ean: products.ean,
          title: products.title,
          description: products.description,
          base_price: products.base_price,
          tax_code: products.tax_code,
          unit_of_measure: products.unit_of_measure,
          quantity_measure: products.quantity_measure,
          image_url: products.image_url,
          tax_rate: taxes.tax_rate
        })
        .from(products)
        .leftJoin(taxes, eq(products.tax_code, taxes.code))
        .limit(100)
        .execute();
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
        
        // Optimized ID generation - simpler and faster
        const orderId = `${randomDC.code}-${Date.now()}-${nanoid(3).toUpperCase()}${i.toString().padStart(3, '0')}`;
        
        // Generate 5-15 line items (reduced for performance)
        const numItems = Math.floor(Math.random() * 11) + 5; // 5-15 items
        
        // Generate line items (optimized - no individual tax queries)
        let subtotal = 0;
        let taxTotal = 0;
        
        for (let j = 0; j < numItems; j++) {
          const product = existingProducts[Math.floor(Math.random() * existingProducts.length)];
          const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
          const unitPrice = product.base_price;
          const lineSubtotal = quantity * unitPrice;
          
          // Tax rate already loaded in the join query above
          const productTaxRate = product.tax_rate || 0.21; // Default to 21%
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
            created_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date(),
            updated_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date()
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
          created_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date(),
          updated_at: timestampOffset ? new Date(Date.now() - this.parseTimestampOffset(timestampOffset)) : new Date()
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
    clearExisting?: boolean;
  }): Promise<{
    success: boolean;
    summary: {
      deliveryCenters: number;
      stores: number;
      users: number;
    };
    message: string;
  }> {
    const {
      deliveryCenters: deliveryCentersCount = 5,
      storesPerCenter = 3,
      usersPerStore = 4,
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

      // Generate coherent entities (sin purchase orders - ciclo completo desde apps frontales)
      const generated = generateCoherentEntities({
        deliveryCenters: deliveryCentersCount,
        storesPerCenter,
        usersPerStore
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

      // Ya no insertamos purchase orders porque el ciclo completo se hace desde las apps frontales

      const message = `Successfully generated ${generated.summary.deliveryCenters} delivery centers, ${generated.summary.stores} stores, and ${generated.summary.users} users.`;
      
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
          users: 0
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

  // Export all current database data to SFTP
  async exportAllDataToSFTP(): Promise<{ success: boolean; message: string; details?: string; exportedEntities: string[] }> {
    try {
      console.log("🚀 Starting complete database export to SFTP...");
      
      let exportDetails = "🚀 Iniciando exportación completa de la BD a SFTP...\n";
      const exportedEntities: string[] = [];
      
      // Import SFTP service
      const { musgraveSftpService } = await import('./services/musgrave-sftp.js');
      
      // Export all entity types that have data
      const exportTasks = [
        { name: 'taxes', method: 'generateTaxesCSVBulk' },
        { name: 'delivery centers', method: 'generateDeliveryCentersCSVBulk' },
        { name: 'stores', method: 'generateStoresCSVBulk' },
        { name: 'users', method: 'generateUsersCSVBulk' },
        { name: 'products', method: 'generateProductsCSVBulk' }
      ];
      
      for (const task of exportTasks) {
        try {
          console.log(`📤 Exportando ${task.name}...`);
          exportDetails += `\n📤 Exportando ${task.name}...\n`;
          exportDetails += `🚀 Generando CSV masivo de ${task.name}...\n`;
          exportDetails += `✓ Conexión SFTP establecida con Musgrave\n`;
          
          // Call the appropriate export method
          const result = await (musgraveSftpService as any)[task.method]();
          
          exportedEntities.push(task.name);
          exportDetails += `✅ CSV masivo de ${task.name} generado exitosamente\n`;
          exportDetails += `✓ Desconectado del SFTP de Musgrave\n`;
          exportDetails += `✅ ${task.name} exportado exitosamente\n`;
          console.log(`✅ ${task.name} exportado exitosamente`);
        } catch (error: any) {
          exportDetails += `❌ Error exportando ${task.name}: ${error.message}\n`;
          console.warn(`⚠️ Error exportando ${task.name}:`, error);
          // Continue with other exports even if one fails
        }
      }
      
      exportDetails += `\n\n✅ Exportación completada. ${exportedEntities.length} entidades exportadas exitosamente.`;
      console.log(`✅ Exportación completa finalizada. Entidades exportadas: ${exportedEntities.join(', ')}`);
      
      return {
        success: true,
        message: `Exportación masiva completada. ${exportedEntities.length} entidades exportadas a SFTP.`,
        details: exportDetails,
        exportedEntities
      };
    } catch (error) {
      console.error('❌ Error durante la exportación masiva a SFTP:', error);
      return {
        success: false,
        message: `Error durante la exportación: ${error instanceof Error ? error.message : String(error)}`,
        details: `❌ Error crítico durante la exportación: ${error instanceof Error ? error.message : String(error)}`,
        exportedEntities: []
      };
    }
  }

  // Import all data from SFTP
  async importAllDataFromSFTP(): Promise<{ success: boolean; message: string; details?: string }> {
    try {
      console.log("🚀 Starting complete SFTP data import...");
      
      let importDetails = "🚀 Iniciando importación completa desde SFTP...\n";
      
      // Import in dependency order
      const importOrder = ['taxes', 'deliveryCenters', 'stores', 'users', 'products'];
      let totalRecordsImported = 0;
      
      for (const entityType of importOrder) {
        console.log(`📦 Importing ${entityType}...`);
        importDetails += `\n📦 Importando ${entityType}...\n`;
        
        const result = await this.importEntityFromSFTP(entityType);
        if (result.details) {
          importDetails += result.details + '\n';
        } else {
          importDetails += result.message + '\n';
        }
        
        if (!result.success) {
          throw new Error(`Failed to import ${entityType}: ${result.message}`);
        }
        
        // Add to total count
        totalRecordsImported += result.importedCount || 0;
      }
      
      console.log("🎉 All data imported successfully from SFTP");
      importDetails += `\n🎉 Todos los datos importados exitosamente desde SFTP\n`;
      importDetails += `📊 Total de registros importados: ${totalRecordsImported}\n`;
      
      return {
        success: true,
        message: `Todos los datos han sido importados desde SFTP correctamente. Total: ${totalRecordsImported} registros.`,
        details: importDetails
      };
      
    } catch (error) {
      console.error('Error importing all data from SFTP:', error);
      return {
        success: false,
        message: `Error durante la importación masiva: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Import specific entity from SFTP
  async importEntityFromSFTP(entityType: string): Promise<{ success: boolean; message: string; details?: string; importedCount?: number }> {
    try {
      console.log(`📦 Starting SFTP import for ${entityType}...`);
      
      const { MusgraveSftpService } = await import('./services/musgrave-sftp');
      const sftp = new MusgraveSftpService();
      
      // Map entity types to SFTP directories
      const directoryMap: { [key: string]: string } = {
        'taxes': '/out/taxes/',
        'products': '/out/products/',
        'delivery-centers': '/out/deliveryCenters/',
        'deliveryCenters': '/out/deliveryCenters/',
        'stores': '/out/stores/',
        'users': '/out/users/'
      };
      
      const directory = directoryMap[entityType];
      if (!directory) {
        throw new Error(`Tipo de entidad no válido: ${entityType}`);
      }
      
      // Get CSV files from SFTP directory
      const csvFiles = await sftp.listCSVFiles(directory);
      
      if (csvFiles.length === 0) {
        return {
          success: true,
          message: `No se encontraron archivos CSV en ${directory}`,
          importedCount: 0
        };
      }
      
      // Sort files by date (oldest first)
      csvFiles.sort((a, b) => a.name.localeCompare(b.name));
      
      let totalImported = 0;
      let importDetails = `Procesando ${csvFiles.length} archivos CSV de ${entityType}:\n`;
      
      for (const file of csvFiles) {
        const filePath = directory + file.name;
        console.log(`📄 Processing ${filePath}...`);
        importDetails += `📄 Procesando ${file.name}...\n`;
        
        const csvContent = await sftp.downloadFile(filePath);
        const records = this.parseCSV(csvContent);
        
        if (records.length === 0) {
          importDetails += `⚠️ No hay registros en ${file.name}\n`;
          continue;
        }
        
        // Count active/inactive records before import
        const activeCount = records.filter(r => r.is_active === 'true' || r.is_active === '1' || r.is_active === true).length;
        const inactiveCount = records.length - activeCount;
        
        // Import records based on entity type
        let imported = 0;
        
        switch (entityType) {
          case 'taxes':
            imported = await this.importTaxesFromCSVSimple(records);
            break;
          case 'products':
            imported = await this.importProductsFromCSVSimple(records);
            break;
          case 'deliveryCenters':
          case 'delivery-centers':
            imported = await this.importDeliveryCentersFromCSVSimple(records);
            break;
          case 'stores':
            imported = await this.importStoresFromCSVSimple(records);
            break;
          case 'users':
            imported = await this.importUsersFromCSVSimple(records);
            break;
          default:
            throw new Error(`Importación no implementada para ${entityType}`);
        }
        
        totalImported += imported;
        
        // Detailed import message with active/inactive breakdown
        let statusMessage = '';
        if (inactiveCount > 0) {
          statusMessage = ` (${activeCount} activos, ${inactiveCount} inactivos)`;
        } else if (activeCount === records.length) {
          statusMessage = ` (todos activos)`;
        }
        
        const importMessage = `✅ ${imported} ${entityType}${statusMessage} importados del fichero ${file.name}`;
        console.log(importMessage);
        importDetails += importMessage + '\n';
        
        // Si la importación fue exitosa, mover el archivo a /processed
        if (imported > 0) {
          try {
            await sftp.moveFileToProcessed(filePath, entityType);
            const moveMessage = `📁 Archivo ${file.name} movido a /processed/${entityType}/`;
            console.log(moveMessage);
            importDetails += moveMessage + '\n';
          } catch (moveError: any) {
            const warningMessage = `⚠️ Advertencia: No se pudo mover ${file.name} a processed: ${moveError.message}`;
            console.warn(warningMessage);
            importDetails += warningMessage + '\n';
          }
        }
      }
      
      console.log(`✅ ${entityType} import completed: ${totalImported} records`);
      importDetails += `🎉 Importación de ${entityType} completada: ${totalImported} registros totales de ${csvFiles.length} archivo(s)`;
      
      return {
        success: true,
        message: `${totalImported} ${entityType} importados correctamente de ${csvFiles.length} archivo(s) CSV`,
        details: importDetails,
        importedCount: totalImported
      };
      
    } catch (error) {
      console.error(`Error importing ${entityType} from SFTP:`, error);
      return {
        success: false,
        message: `Error importando ${entityType}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Parse CSV content
  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record);
      }
    }
    
    return records;
  }

  // Simplified CSV import methods
  private async importTaxesFromCSVSimple(records: any[]): Promise<number> {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    // Normalize values for proper comparison
    const normalizeNumber = (val: number | string): number => {
      return typeof val === 'string' ? parseFloat(val) || 0 : (val || 0);
    };
    
    for (const record of records) {
      try {
        const taxData = {
          code: record.code,
          name: record.name,
          tax_rate: parseFloat(record.rate || record.tax_rate) || 0
        };

        // First try to insert
        try {
          await db.insert(taxes).values(taxData);
        } catch (error: any) {
          // If conflict, check if data actually changed
          if (error.code === '23505') { // PostgreSQL unique violation
            const existingTax = await db.select().from(taxes).where(eq(taxes.code, taxData.code)).limit(1);
            
            if (existingTax.length > 0) {
              const existing = existingTax[0];
              
              // Log detailed comparison for debugging (first tax and every 10)
              if (imported === 0 || imported % 10 === 0) {
                console.log(`🔍 Comparing tax ${taxData.code}:`);
                console.log(`   Name: "${existing.name}" vs "${taxData.name}"`);
                console.log(`   Tax rate: ${existing.tax_rate} (${typeof existing.tax_rate}) vs ${taxData.tax_rate} (${typeof taxData.tax_rate})`);
                console.log(`   Normalized tax rate: ${normalizeNumber(existing.tax_rate)} vs ${normalizeNumber(taxData.tax_rate)}`);
              }
              
              const hasChanges = (
                existing.name !== taxData.name ||
                normalizeNumber(existing.tax_rate) !== normalizeNumber(taxData.tax_rate)
              );
              
              if (imported === 0 || imported % 10 === 0) {
                console.log(`   Has changes: ${hasChanges}`);
              }

              
              if (hasChanges) {
                await db.update(taxes)
                  .set({
                    name: taxData.name,
                    tax_rate: taxData.tax_rate,
                    updated_at: new Date()
                  })
                  .where(eq(taxes.code, taxData.code));
                console.log(`💰 Tax ${taxData.code} updated - data changed`);
                updated++;
              } else {
                console.log(`💰 Tax ${taxData.code} skipped - no changes detected`);
                skipped++;
              }
            }
          } else {
            throw error;
          }
        }
        imported++;
      } catch (error) {
        console.error(`Error importing tax ${record.code}:`, error);
      }
    }
    console.log(`💰 Tax import summary: ${imported} total, ${updated} updated, ${skipped} skipped`);
    return imported;
  }

  private async importProductsFromCSVSimple(records: any[]): Promise<number> {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    // Optimización: verificar si la DB está vacía para usar inserción masiva
    const productCountResult = await db.select({ count: sql`count(*)` }).from(products);
    const productCount = parseInt(productCountResult[0]?.count as string) || 0;
    const isEmptyDatabase = productCount === 0;
    
    console.log(`🚀 Base de datos de productos ${isEmptyDatabase ? 'vacía' : `tiene ${productCount} productos`} - usando estrategia ${isEmptyDatabase ? 'inserción masiva' : 'verificación individual'}`);
    
    if (isEmptyDatabase && records.length > 0) {
      // Estrategia optimizada: inserción masiva sin verificaciones
      console.log(`⚡ Insertando ${records.length} productos de forma masiva...`);
      
      const productBatch = records.map(record => ({
        ean: record.ean,
        ref: record.ref || '',
        title: record.name || record.title,
        description: record.description || '',
        base_price: parseFloat(record.unit_price || record.base_price) || 0,
        tax_code: record.tax_code || 'ALI',
        unit_of_measure: record.unit_of_measure || 'unidad',
        quantity_measure: parseFloat(record.quantity_measure) || 1,
        is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true,
        image_url: record.image_url || `https://placehold.co/300x300/e5e7eb/6b7280?text=${encodeURIComponent((record.name || record.title) || 'Producto')}`
      }));
      
      try {
        await db.insert(products).values(productBatch);
        imported = productBatch.length;
        console.log(`✅ ${imported} productos insertados masivamente`);
        return imported;
      } catch (error) {
        console.error('Error en inserción masiva, fallback a método individual:', error);
        // Si falla la inserción masiva, usar el método tradicional
      }
    }
    
    // Estrategia tradicional: verificación producto por producto
    console.log(`🔄 Procesando ${records.length} productos individualmente...`);
    
    // Normalize values for proper comparison
    const normalizeNumber = (val: number | string): number => {
      return typeof val === 'string' ? parseFloat(val) || 0 : (val || 0);
    };
    
    for (const record of records) {
      try {
        const productData = {
          ean: record.ean,
          ref: record.ref || '',
          title: record.name || record.title,
          description: record.description || '',
          base_price: parseFloat(record.unit_price || record.base_price) || 0,
          tax_code: record.tax_code || 'ALI',
          unit_of_measure: record.unit_of_measure || 'unidad',
          quantity_measure: parseFloat(record.quantity_measure) || 1,
          is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true,
          image_url: record.image_url || `https://placehold.co/300x300/e5e7eb/6b7280?text=${encodeURIComponent((record.name || record.title) || 'Producto')}`
        };

        try {
          await db.insert(products).values(productData);
        } catch (error: any) {
          if (error.code === '23505') {
            const existingProduct = await db.select().from(products).where(eq(products.ean, productData.ean)).limit(1);
            
            if (existingProduct.length > 0) {
              const existing = existingProduct[0];
              
              // Log detailed comparison for debugging (first product and every 500)
              if (imported === 0 || imported % 500 === 0) {
                console.log(`🔍 Comparing product ${productData.ean}:`);
                console.log(`   Title: "${existing.title}" vs "${productData.title}"`);
                console.log(`   Base price: ${existing.base_price} (${typeof existing.base_price}) vs ${productData.base_price} (${typeof productData.base_price})`);
                console.log(`   Active: ${existing.is_active} (${typeof existing.is_active}) vs ${productData.is_active} (${typeof productData.is_active})`);
                console.log(`   Normalized base price: ${normalizeNumber(existing.base_price)} vs ${normalizeNumber(productData.base_price)}`);
                console.log(`   Boolean active: ${Boolean(existing.is_active)} vs ${Boolean(productData.is_active)}`);
              }
              
              const hasChanges = (
                existing.ref !== productData.ref ||
                existing.title !== productData.title ||
                existing.description !== productData.description ||
                normalizeNumber(existing.base_price) !== normalizeNumber(productData.base_price) ||
                existing.tax_code !== productData.tax_code ||
                existing.unit_of_measure !== productData.unit_of_measure ||
                normalizeNumber(existing.quantity_measure) !== normalizeNumber(productData.quantity_measure) ||
                Boolean(existing.is_active) !== Boolean(productData.is_active) ||
                existing.image_url !== productData.image_url
              );
              
              if (imported === 0 || imported % 500 === 0) {
                console.log(`   Has changes: ${hasChanges}`);
              }
              
              if (hasChanges) {
                await db.update(products)
                  .set({
                    ref: productData.ref,
                    title: productData.title,
                    description: productData.description,
                    base_price: productData.base_price,
                    tax_code: productData.tax_code,
                    unit_of_measure: productData.unit_of_measure,
                    quantity_measure: productData.quantity_measure,
                    is_active: productData.is_active,
                    image_url: productData.image_url,
                    updated_at: new Date()
                  })
                  .where(eq(products.ean, productData.ean));
                updated++;
                if (updated % 100 === 0) { // Log every 100 updated products
                  console.log(`📦 ${updated} products updated so far (${imported} total processed)`);
                }
              } else {
                skipped++;
                if (skipped % 200 === 0) { // Log every 200 skipped products
                  console.log(`📦 ${skipped} products skipped so far (${imported} total processed)`);
                }
              }
            }
          } else {
            throw error;
          }
        }
        imported++;
      } catch (error) {
        console.error(`Error importing product ${record.ean}:`, error);
      }
    }
    console.log(`📦 Product import summary: ${imported} total, ${updated} updated, ${skipped} skipped`);
    return imported;
  }

  private async importDeliveryCentersFromCSVSimple(records: any[]): Promise<number> {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    for (const record of records) {
      try {
        const centerData = {
          code: record.code,
          name: record.name,
          is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true
        };

        try {
          await db.insert(deliveryCenters).values(centerData);
        } catch (error: any) {
          if (error.code === '23505') {
            const existingCenter = await db.select().from(deliveryCenters).where(eq(deliveryCenters.code, centerData.code)).limit(1);
            
            if (existingCenter.length > 0) {
              const existing = existingCenter[0];
              const hasChanges = (
                existing.name !== centerData.name ||
                existing.is_active !== centerData.is_active
              );
              
              if (hasChanges) {
                await db.update(deliveryCenters)
                  .set({
                    name: centerData.name,
                    is_active: centerData.is_active,
                    updated_at: new Date()
                  })
                  .where(eq(deliveryCenters.code, centerData.code));
                console.log(`🏢 Delivery center ${centerData.code} updated - data changed`);
                updated++;
              } else {
                console.log(`🏢 Delivery center ${centerData.code} skipped - no changes detected`);
                skipped++;
              }
            }
          } else {
            throw error;
          }
        }
        imported++;
      } catch (error) {
        console.error(`Error importing delivery center ${record.code}:`, error);
      }
    }
    console.log(`🏢 Delivery center import summary: ${imported} total, ${updated} updated, ${skipped} skipped`);
    return imported;
  }

  private async importStoresFromCSVSimple(records: any[]): Promise<number> {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    for (const record of records) {
      try {
        const storeData = {
          code: record.code,
          name: record.name,
          delivery_center_code: record.delivery_center_code,
          responsible_email: record.responsible_email || '',
          is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true
        };

        try {
          await db.insert(stores).values(storeData);
        } catch (error: any) {
          if (error.code === '23505') {
            const existingStore = await db.select().from(stores).where(eq(stores.code, storeData.code)).limit(1);
            
            if (existingStore.length > 0) {
              const existing = existingStore[0];
              const hasChanges = (
                existing.name !== storeData.name ||
                existing.delivery_center_code !== storeData.delivery_center_code ||
                existing.responsible_email !== storeData.responsible_email ||
                existing.is_active !== storeData.is_active
              );
              
              if (hasChanges) {
                await db.update(stores)
                  .set({
                    name: storeData.name,
                    delivery_center_code: storeData.delivery_center_code,
                    responsible_email: storeData.responsible_email,
                    is_active: storeData.is_active,
                    updated_at: new Date()
                  })
                  .where(eq(stores.code, storeData.code));
                console.log(`🏪 Store ${storeData.code} updated - data changed`);
                updated++;
              } else {
                console.log(`🏪 Store ${storeData.code} skipped - no changes detected`);
                skipped++;
              }
            }
          } else {
            throw error;
          }
        }
        imported++;
      } catch (error) {
        console.error(`Error importing store ${record.code}:`, error);
      }
    }
    console.log(`🏪 Store import summary: ${imported} total, ${updated} updated, ${skipped} skipped`);
    return imported;
  }

  private async importUsersFromCSVSimple(records: any[]): Promise<number> {
    const crypto = await import('crypto');
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    for (const record of records) {
      try {
        const password = record.password || 'password123';
        const saltedPassword = password + record.email;
        const passwordHash = crypto.createHash('sha3-256').update(saltedPassword).digest('hex');
        
        const userData = {
          email: record.email,
          name: record.name,
          password_hash: passwordHash,
          store_id: record.store_code || record.store_id,
          is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true
        };

        console.log(`🔄 Importing user: ${record.email} with data:`, userData);

        // First try to insert
        try {
          await db.insert(users).values(userData);
          console.log(`✅ New user ${record.email} inserted`);
        } catch (error: any) {
          // If conflict (user exists), check if data actually changed
          if (error.code === '23505') { // PostgreSQL unique violation
            // Get existing user data
            const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
            
            if (existingUser.length > 0) {
              const existing = existingUser[0];
              console.log(`📊 Comparing user ${record.email}:`);
              console.log(`   Existing: name="${existing.name}", store="${existing.store_id}", active=${existing.is_active}`);
              console.log(`   New data: name="${userData.name}", store="${userData.store_id}", active=${userData.is_active}`);
              
              const hasChanges = (
                existing.name !== userData.name ||
                existing.password_hash !== userData.password_hash ||
                existing.store_id !== userData.store_id ||
                existing.is_active !== userData.is_active
              );
              
              console.log(`   Has changes: ${hasChanges}`);
              
              if (hasChanges) {
                await db.update(users)
                  .set({
                    name: userData.name,
                    password_hash: userData.password_hash,
                    store_id: userData.store_id,
                    is_active: userData.is_active,
                    updated_at: new Date()
                  })
                  .where(eq(users.email, userData.email));
                console.log(`✅ User ${record.email} updated - data changed`);
                updated++;
              } else {
                console.log(`ℹ️ User ${record.email} skipped - no changes detected`);
                skipped++;
              }
            }
          } else {
            throw error; // Re-throw if it's not a unique violation
          }
        }
        imported++;
      } catch (error) {
        console.error(`Error importing user ${record.email}:`, error);
      }
    }
    console.log(`👤 User import summary: ${imported} total, ${updated} updated, ${skipped} skipped`);
    return imported;
  }

  // Import taxes from CSV records
  private async importTaxesFromCSV(records: any[]): Promise<number> {
    let imported = 0;
    
    for (const record of records) {
      if (!record.code || !record.name || record.rate === undefined) continue;
      
      try {
        // Check if tax already exists
        const existing = await db.select().from(taxes).where(eq(taxes.code, record.code)).limit(1);
        
        const taxData = {
          code: record.code,
          name: record.name,
          tax_rate: parseFloat(record.rate || record.tax_rate) || 0,
          is_active: record.is_active === 'true' || record.is_active === '1'
        };
        
        if (existing.length > 0) {
          // Update existing
          await db.update(taxes).set(taxData).where(eq(taxes.code, record.code));
        } else {
          // Insert new
          await db.insert(taxes).values(taxData);
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing tax ${record.code}:`, error);
      }
    }
    
    return imported;
  }

  // Import products from CSV records
  private async importProductsFromCSV(records: any[]): Promise<number> {
    let imported = 0;
    
    for (const record of records) {
      if (!record.ean || !record.name) continue;
      
      try {
        // Check if product already exists
        const existing = await db.select().from(products).where(eq(products.ean, record.ean)).limit(1);
        
        const productData = {
          ean: record.ean,
          title: record.name || record.title,
          brand: record.brand || '',
          category: record.category || 'Alimentación',
          description: record.description || '',
          base_price: parseFloat(record.unit_price || record.base_price) || 0,
          unit_cost: parseFloat(record.unit_cost) || 0,
          tax_code: record.tax_code || 'ALI',
          is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true,
          image_url: record.image_url || `https://placehold.co/300x300/e5e7eb/6b7280?text=${encodeURIComponent((record.name || record.title) || 'Producto')}`
        };
        
        if (existing.length > 0) {
          // Update existing
          await db.update(products).set(productData).where(eq(products.ean, record.ean));
        } else {
          // Insert new
          await db.insert(products).values(productData);
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing product ${record.ean}:`, error);
      }
    }
    
    return imported;
  }

  // Import delivery centers from CSV records
  private async importDeliveryCentersFromCSV(records: any[]): Promise<number> {
    let imported = 0;
    
    for (const record of records) {
      if (!record.code || !record.name) continue;
      
      try {
        // Check if delivery center already exists
        const existing = await db.select().from(deliveryCenters).where(eq(deliveryCenters.code, record.code)).limit(1);
        
        const centerData = {
          code: record.code,
          name: record.name,
          is_active: record.is_active === 'true' || record.is_active === '1'
        };
        
        if (existing.length > 0) {
          // Update existing
          await db.update(deliveryCenters).set(centerData).where(eq(deliveryCenters.code, record.code));
        } else {
          // Insert new
          await db.insert(deliveryCenters).values(centerData);
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing delivery center ${record.code}:`, error);
      }
    }
    
    return imported;
  }

  // Import stores from CSV records
  private async importStoresFromCSV(records: any[]): Promise<number> {
    let imported = 0;
    
    for (const record of records) {
      if (!record.code || !record.name || !record.delivery_center_code) continue;
      
      try {
        // Check if store already exists
        const existing = await db.select().from(stores).where(eq(stores.code, record.code)).limit(1);
        
        const storeData = {
          code: record.code,
          name: record.name,
          delivery_center_code: record.delivery_center_code,
          is_active: record.is_active === 'true' || record.is_active === '1'
        };
        
        if (existing.length > 0) {
          // Update existing
          await db.update(stores).set(storeData).where(eq(stores.code, record.code));
        } else {
          // Insert new
          await db.insert(stores).values(storeData);
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing store ${record.code}:`, error);
      }
    }
    
    return imported;
  }

  // Import users from CSV records
  private async importUsersFromCSV(records: any[]): Promise<number> {
    let imported = 0;
    
    for (const record of records) {
      if (!record.email || !record.name || !record.store_code) continue;
      
      try {
        // Check if user already exists
        const existing = await db.select().from(users).where(eq(users.email, record.email)).limit(1);
        
        // Use SHA3-256 with email as salt for password (default: 'password123')
        const crypto = await import('crypto');
        const password = record.password || 'password123';
        const saltedPassword = password + record.email;
        const passwordHash = crypto.createHash('sha3-256').update(saltedPassword).digest('hex');
        
        const userData = {
          email: record.email,
          name: record.name,
          password_hash: passwordHash,
          store_id: record.store_code || record.store_id,
          is_active: record.is_active === 'true' || record.is_active === '1' || record.is_active === true
        };
        
        if (existing.length > 0) {
          // Update existing
          await db.update(users).set(userData).where(eq(users.email, record.email));
        } else {
          // Insert new
          await db.insert(users).values(userData);
        }
        
        imported++;
      } catch (error) {
        console.error(`Error importing user ${record.email}:`, error);
      }
    }
    
    return imported;
  }
}

export const storage = new DatabaseStorage();
