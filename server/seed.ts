import { db } from "./db";
import { products, taxes } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingTaxes = await db.select().from(taxes).limit(1);
    if (existingTaxes.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with Spanish VAT taxes and grocery products...");

    // Insert Spanish VAT tax rates
    const spanishTaxes = [
      {
        code: "IVA_GENERAL",
        name: "IVA General",
        tax_rate: 0.21,
      },
      {
        code: "IVA_REDUCIDO",
        name: "IVA Reducido",
        tax_rate: 0.10,
      },
      {
        code: "IVA_SUPERREDUCIDO",
        name: "IVA Superreducido",
        tax_rate: 0.04,
      },
      {
        code: "IVA_ALIMENTACION",
        name: "IVA Alimentación",
        tax_rate: 0.04,
      },
      {
        code: "IVA_EXENTO",
        name: "IVA Exento",
        tax_rate: 0.00,
      },
    ];

    await db.insert(taxes).values(spanishTaxes.map(tax => ({
      ...tax,
      created_at: new Date(),
      updated_at: new Date(),
    })));

    // Insert 10 Spanish grocery products
    const groceryProducts = [
      {
        ean: "8414719000000",
        ref: "PROD001",
        title: "Aceite de Oliva Virgen Extra 500ml",
        description: "Aceite de oliva virgen extra de primera presión en frío",
        base_price: 8.95,
        tax_code: "IVA_GENERAL",
        unit_of_measure: "ml",
        quantity_measure: 500.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000001",
        ref: "PROD002", 
        title: "Pan Integral 500g",
        description: "Pan integral artesano con semillas",
        base_price: 2.45,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "g",
        quantity_measure: 500.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000002",
        ref: "PROD003",
        title: "Leche Entera 1L",
        description: "Leche entera pasteurizada",
        base_price: 1.25,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "L",
        quantity_measure: 1.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000003",
        ref: "PROD004",
        title: "Tomates Cherry 250g",
        description: "Tomates cherry frescos",
        base_price: 3.20,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "g",
        quantity_measure: 250.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000004",
        ref: "PROD005",
        title: "Pasta Integral 500g",
        description: "Pasta integral de trigo duro",
        base_price: 1.95,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "g",
        quantity_measure: 500.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000005",
        ref: "PROD006",
        title: "Queso Manchego Curado 200g",
        description: "Queso manchego curado artesanal",
        base_price: 12.50,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "g",
        quantity_measure: 200.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000006",
        ref: "PROD007",
        title: "Jamón Ibérico 100g",
        description: "Jamón ibérico de bellota loncheado",
        base_price: 18.90,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "g",
        quantity_measure: 100.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000007",
        ref: "PROD008",
        title: "Vino Tinto Crianza 750ml",
        description: "Vino tinto crianza Denominación de Origen",
        base_price: 15.75,
        tax_code: "IVA_GENERAL",
        unit_of_measure: "ml",
        quantity_measure: 750.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000008",
        ref: "PROD009",
        title: "Naranjas Valencia 1kg",
        description: "Naranjas valencianas frescas",
        base_price: 2.80,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "kg",
        quantity_measure: 1.0,
        image_url: null,
        is_active: true,
      },
      {
        ean: "8414719000009",
        ref: "PROD010",
        title: "Yogur Natural 4x125g",
        description: "Yogur natural sin azúcares añadidos",
        base_price: 3.15,
        tax_code: "IVA_ALIMENTACION",
        unit_of_measure: "g",
        quantity_measure: 500.0,
        image_url: null,
        is_active: true,
      },
    ];

    await db.insert(products).values(groceryProducts.map(product => ({
      ...product,
      created_at: new Date(),
      updated_at: new Date(),
    })));

    console.log("Database seeded successfully!");
    console.log(`- ${spanishTaxes.length} tax rates inserted`);
    console.log(`- ${groceryProducts.length} grocery products inserted`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
