import { products, taxes, type Product, type InsertProduct, type Tax, type InsertTax } from "@shared/schema";
import { db } from "./db";
import { eq, gte, desc } from "drizzle-orm";

export interface IStorage {
  // Product methods
  getProducts(timestamp?: string): Promise<Product[]>;
  getProduct(ean: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(ean: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(ean: string): Promise<boolean>;
  
  // Tax methods
  getTaxes(timestamp?: string): Promise<Tax[]>;
  getTax(code: string): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(code: string, tax: Partial<InsertTax>): Promise<Tax>;
  deleteTax(code: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(timestamp?: string): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (timestamp) {
      const timestampDate = new Date(timestamp);
      query = query.where(gte(products.updated_at, timestampDate));
    }
    
    return await query.orderBy(desc(products.updated_at));
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

  async getTaxes(timestamp?: string): Promise<Tax[]> {
    let query = db.select().from(taxes);
    
    if (timestamp) {
      const timestampDate = new Date(timestamp);
      query = query.where(gte(taxes.updated_at, timestampDate));
    }
    
    return await query.orderBy(desc(taxes.updated_at));
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
