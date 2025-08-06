import { storage } from "../storage";
import { db } from "../db";
import { products, taxes } from "@shared/schema";
import { eq } from "drizzle-orm";

export const resolvers = {
  Query: {
    products: async (_: any, { timestamp, limit = 100, offset = 0 }: { timestamp?: string; limit?: number; offset?: number }) => {
      return await storage.getProducts(timestamp, limit, offset);
    },
    
    product: async (_: any, { ean }: { ean: string }) => {
      return await storage.getProduct(ean);
    },
    
    taxes: async (_: any, { timestamp, limit = 100, offset = 0 }: { timestamp?: string; limit?: number; offset?: number }) => {
      return await storage.getTaxes(timestamp, limit, offset);
    },
    
    tax: async (_: any, { code }: { code: string }) => {
      return await storage.getTax(code);
    },
  },

  Mutation: {
    createProduct: async (_: any, { input }: { input: any }) => {
      return await storage.createProduct(input);
    },
    
    updateProduct: async (_: any, { ean, input }: { ean: string; input: any }) => {
      return await storage.updateProduct(ean, input);
    },
    
    deleteProduct: async (_: any, { ean }: { ean: string }) => {
      return await storage.deleteProduct(ean);
    },

    deleteAllProducts: async () => {
      return await storage.deleteAllProducts();
    },

    generateRandomProducts: async (_: any, { count, timestampOffset }: { count: number; timestampOffset: string }) => {
      return await storage.generateRandomProducts(count, timestampOffset);
    },
    
    createTax: async (_: any, { input }: { input: any }) => {
      return await storage.createTax(input);
    },
    
    updateTax: async (_: any, { code, input }: { code: string; input: any }) => {
      return await storage.updateTax(code, input);
    },
    
    deleteTax: async (_: any, { code }: { code: string }) => {
      return await storage.deleteTax(code);
    },
  },

  Product: {
    tax: async (parent: any) => {
      const [tax] = await db
        .select()
        .from(taxes)
        .where(eq(taxes.code, parent.tax_code));
      return tax;
    },
  },
};
