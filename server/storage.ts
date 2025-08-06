import { products, taxes, type Product, type InsertProduct, type Tax, type InsertTax } from "@shared/schema";
import { db } from "./db";
import { eq, gte, desc, sql } from "drizzle-orm";
import { generateRandomProducts } from "./product-generator.js";

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

      // Generate random products
      const randomProducts = generateRandomProducts(count, finalTimestamp);
      
      // Insert into database
      const insertedProducts = await db
        .insert(products)
        .values(randomProducts)
        .returning();

      return {
        success: true,
        createdCount: insertedProducts.length,
        products: insertedProducts,
        message: `Successfully generated ${insertedProducts.length} random products`
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
}

export const storage = new DatabaseStorage();
