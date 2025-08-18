import { nanoid } from "nanoid";

export interface ProductCategory {
  name: string;
  brands: string[];
  variants: string[];
  units: { measure: string; quantities: number[] }[];
  taxCode: string;
  priceRange: { min: number; max: number };
  imageKeyword: string; // For generating appropriate images
  imageUrl: string; // Real category image URL
}

export const SPANISH_GROCERY_CATEGORIES: ProductCategory[] = [
  {
    name: "Leche y Lácteos",
    brands: ["Pascual", "Central Lechera Asturiana", "Puleva", "Kaiku", "Danone", "Nestlé"],
    variants: ["Leche Entera", "Leche Desnatada", "Leche Semidesnatada", "Leche Sin Lactosa", "Bebida de Avena", "Bebida de Almendra"],
    units: [
      { measure: "L", quantities: [1, 1.5, 2] },
      { measure: "ml", quantities: [250, 500, 1000] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.89, max: 3.50 },
    imageKeyword: "milk",
    imageUrl: "https://i.ibb.co/SX6c1CBv/Leche-y-lacteos.jpg"
  },
  {
    name: "Yogures y Postres",
    brands: ["Danone", "Nestlé", "Pascual", "Central Lechera Asturiana", "Yoplait"],
    variants: ["Yogur Natural", "Yogur Griego", "Yogur con Frutas", "Yogur Desnatado", "Flan", "Natillas", "Cuajada"],
    units: [
      { measure: "g", quantities: [125, 150, 200, 500, 1000] },
      { measure: "unidades", quantities: [4, 6, 8, 12] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.65, max: 4.99 },
    imageKeyword: "yogurt",
    imageUrl: "https://i.ibb.co/SZgWcy4/Yogures-y-postres.jpg"
  },
  {
    name: "Quesos",
    brands: ["García Baquero", "Burgos", "Roncal", "Cabrales", "Manchego", "El Pastor"],
    variants: ["Queso Manchego", "Queso de Cabra", "Queso Fresco", "Queso Curado", "Queso Semicurado", "Queso Azul"],
    units: [
      { measure: "g", quantities: [150, 200, 250, 300, 500] },
      { measure: "kg", quantities: [1] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 2.50, max: 25.00 },
    imageKeyword: "cheese",
    imageUrl: "https://i.ibb.co/zWQCx8L9/Quesos.jpg"
  },
  {
    name: "Carnes Frescas",
    brands: ["ElPozo", "Campofrío", "Oscar Mayer", "Casademont", "Navidul"],
    variants: ["Pollo Entero", "Pechuga de Pollo", "Carne Picada", "Chuletas de Cerdo", "Ternera", "Cordero"],
    units: [
      { measure: "kg", quantities: [0.5, 1, 1.5, 2] },
      { measure: "g", quantities: [300, 500, 750, 1000] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 3.99, max: 18.99 },
    imageKeyword: "meat",
    imageUrl: "https://i.ibb.co/cSm7x776/carnes-frescas.jpg"
  },
  {
    name: "Embutidos",
    brands: ["ElPozo", "Campofrío", "Casa Tarradellas", "Navidul", "Oscar Mayer"],
    variants: ["Jamón Serrano", "Jamón York", "Chorizo", "Salchichón", "Lomo", "Mortadela"],
    units: [
      { measure: "g", quantities: [80, 100, 150, 200, 250] },
      { measure: "lonchas", quantities: [6, 8, 10, 12] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 1.99, max: 15.99 },
    imageKeyword: "ham",
    imageUrl: "https://i.ibb.co/Fby97v9G/embutidos.jpg"
  },
  {
    name: "Pescados y Mariscos",
    brands: ["Pescanova", "Findus", "Frinova", "Virgen Extra", "Calvo"],
    variants: ["Salmón", "Merluza", "Bacalao", "Sardinas", "Atún", "Gambas", "Mejillones"],
    units: [
      { measure: "g", quantities: [250, 400, 500, 750, 1000] },
      { measure: "kg", quantities: [1, 2] },
      { measure: "lata", quantities: [1, 2, 3] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 1.89, max: 22.99 },
    imageKeyword: "fish",
    imageUrl: "https://i.ibb.co/0jj5htpn/pescados-y-mariscos.jpg"
  },
  {
    name: "Frutas",
    brands: ["Valencia", "Almería", "Andalucía", "Murcia", "Canarias"],
    variants: ["Naranjas", "Manzanas", "Plátanos", "Fresas", "Peras", "Uvas", "Limones", "Kiwis"],
    units: [
      { measure: "kg", quantities: [0.5, 1, 1.5, 2] },
      { measure: "unidades", quantities: [4, 6, 8, 10, 12] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.99, max: 6.99 },
    imageKeyword: "fruit",
    imageUrl: "https://i.ibb.co/Vs78Qst/frutas.jpg"
  },
  {
    name: "Verduras y Hortalizas",
    brands: ["Almería", "Murcia", "Valencia", "Andalucía", "Campo de Cartagena"],
    variants: ["Tomates", "Lechugas", "Cebollas", "Patatas", "Zanahorias", "Pimientos", "Calabacines", "Berenjenas"],
    units: [
      { measure: "kg", quantities: [0.5, 1, 1.5, 2, 2.5] },
      { measure: "unidades", quantities: [1, 2, 3, 4, 6] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.79, max: 4.99 },
    imageKeyword: "vegetables",
    imageUrl: "https://i.ibb.co/xqsbwRdy/verduras-y-hortalizas.jpg"
  },
  {
    name: "Pan y Bollería",
    brands: ["Bimbo", "Panrico", "Donuts", "Madre Tierra", "Artesano"],
    variants: ["Pan de Molde", "Pan Integral", "Croissants", "Magdalenas", "Bizcochos", "Pan Tostado"],
    units: [
      { measure: "g", quantities: [300, 450, 500, 750] },
      { measure: "unidades", quantities: [4, 6, 8, 10, 12] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.89, max: 4.99 },
    imageKeyword: "bread",
    imageUrl: "https://i.ibb.co/tTJPt43w/Pan-y-Boller-a.jpg"
  },
  {
    name: "Cereales y Legumbres",
    brands: ["Gallo", "SOS", "Luengo", "Hacendado", "Carrefour"],
    variants: ["Arroz", "Pasta", "Lentejas", "Garbanzos", "Alubias", "Quinoa", "Avena"],
    units: [
      { measure: "kg", quantities: [0.5, 1, 2] },
      { measure: "g", quantities: [250, 500, 750, 1000] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.99, max: 8.99 },
    imageKeyword: "rice",
    imageUrl: "https://i.ibb.co/Mx1VJdsn/Cereales-y-Legumbres.jpg"
  },
  {
    name: "Aceites y Vinagres",
    brands: ["Carbonell", "Coosur", "Ybarra", "La Española", "Borges"],
    variants: ["Aceite de Oliva Virgen Extra", "Aceite de Girasol", "Vinagre de Jerez", "Vinagre Balsámico", "Aceite de Coco"],
    units: [
      { measure: "L", quantities: [0.25, 0.5, 1, 2] },
      { measure: "ml", quantities: [250, 500, 750, 1000] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 1.99, max: 15.99 },
    imageKeyword: "oil",
    imageUrl: "https://i.ibb.co/cW4xcDz/aceites-y-vinagres.jpg"
  },
  {
    name: "Conservas",
    brands: ["Calvo", "Ortiz", "Albo", "Hida", "Isabel"],
    variants: ["Atún en Aceite", "Sardinas", "Tomate Frito", "Pimientos Asados", "Espárragos", "Aceitunas"],
    units: [
      { measure: "g", quantities: [80, 120, 150, 200, 400] },
      { measure: "ml", quantities: [350, 400, 500, 720] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 0.89, max: 8.99 },
    imageKeyword: "canned",
    imageUrl: "https://i.ibb.co/hJQS8fHG/conservas.jpg"
  },
  {
    name: "Bebidas Refrescantes",
    brands: ["Coca-Cola", "Pepsi", "Fanta", "Sprite", "Aquarius", "Nestea"],
    variants: ["Cola", "Naranja", "Limón", "Té Frío", "Agua con Gas", "Bebida Isotónica"],
    units: [
      { measure: "L", quantities: [0.33, 0.5, 1, 1.5, 2] },
      { measure: "ml", quantities: [250, 330, 500, 1000] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 0.65, max: 3.99 },
    imageKeyword: "drinks",
    imageUrl: "https://i.ibb.co/9msKcZ0F/bebidas-refrescantes.jpg"
  },
  {
    name: "Vinos",
    brands: ["Marqués de Cáceres", "Faustino", "Campo Viejo", "Protos", "Ramón Bilbao"],
    variants: ["Tinto Crianza", "Tinto Joven", "Blanco", "Rosado", "Reserva", "Gran Reserva"],
    units: [
      { measure: "ml", quantities: [375, 750] },
      { measure: "L", quantities: [1] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 3.99, max: 49.99 },
    imageKeyword: "wine",
    imageUrl: "https://i.ibb.co/z0BqCcv/vinos.jpg"
  },
  {
    name: "Cervezas",
    brands: ["Mahou", "San Miguel", "Estrella Galicia", "Cruzcampo", "Heineken"],
    variants: ["Lager", "Pilsner", "Sin Alcohol", "Trigo", "Tostada", "IPA"],
    units: [
      { measure: "ml", quantities: [250, 330, 500] },
      { measure: "L", quantities: [1] },
      { measure: "pack", quantities: [6, 12, 24] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 0.79, max: 15.99 },
    imageKeyword: "beer",
    imageUrl: "https://i.ibb.co/1fxZW7PW/cervezas.jpg"
  },
  {
    name: "Snacks y Aperitivos",
    brands: ["Lay's", "Ruffles", "Cheetos", "Doritos", "Pringles"],
    variants: ["Patatas Fritas", "Nachos", "Frutos Secos", "Palomitas", "Galletas Saladas"],
    units: [
      { measure: "g", quantities: [45, 75, 130, 160, 200] },
      { measure: "unidades", quantities: [1] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 0.99, max: 4.99 },
    imageKeyword: "snacks",
    imageUrl: "https://i.ibb.co/BV2zpc97/snacks-y-aperitivos.jpg"
  },
  {
    name: "Dulces y Chocolate",
    brands: ["Nestlé", "Ferrero", "Lindt", "Valor", "Cadbury"],
    variants: ["Chocolate con Leche", "Chocolate Negro", "Chocolate Blanco", "Bombones", "Galletas", "Caramelos"],
    units: [
      { measure: "g", quantities: [50, 100, 125, 150, 200, 300] },
      { measure: "unidades", quantities: [1] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 0.89, max: 12.99 },
    imageKeyword: "chocolate",
    imageUrl: "https://i.ibb.co/SGRP7hk/dulces-y-chocolates.jpg"
  },
  {
    name: "Productos de Limpieza",
    brands: ["Fairy", "Skip", "Ariel", "Mistol", "Sanytol"],
    variants: ["Detergente", "Suavizante", "Lavavajillas", "Limpiador Multiusos", "Lejía"],
    units: [
      { measure: "L", quantities: [1, 2, 3, 4] },
      { measure: "ml", quantities: [500, 750, 1000, 1500] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 1.99, max: 12.99 },
    imageKeyword: "cleaning",
    imageUrl: "https://i.ibb.co/zWCCJ5SZ/productos-de-limpieza.jpg"
  },
  {
    name: "Higiene Personal",
    brands: ["Dove", "Nivea", "L'Oréal", "Head & Shoulders", "Gillette"],
    variants: ["Champú", "Gel de Ducha", "Crema Hidratante", "Pasta de Dientes", "Desodorante"],
    units: [
      { measure: "ml", quantities: [200, 250, 300, 400, 500] },
      { measure: "g", quantities: [75, 100, 150] }
    ],
    taxCode: "IVA_GENERAL",
    priceRange: { min: 1.49, max: 8.99 },
    imageKeyword: "cosmetics",
    imageUrl: "https://i.ibb.co/YgZ0bLS/higiene-personal.jpg"
  },
  {
    name: "Productos para Bebés",
    brands: ["Dodot", "Nestlé", "Hero", "Blevit", "Chicco"],
    variants: ["Pañales", "Toallitas", "Papillas", "Leche de Continuación", "Potitos"],
    units: [
      { measure: "unidades", quantities: [30, 40, 60, 80] },
      { measure: "g", quantities: [200, 250, 400, 800] },
      { measure: "L", quantities: [1] }
    ],
    taxCode: "IVA_SUPERREDUCIDO",
    priceRange: { min: 2.99, max: 19.99 },
    imageKeyword: "baby",
    imageUrl: "https://i.ibb.co/6RxsbsHH/productos-para-bebes.jpg"
  }
];

export function generateRandomProduct(timestampOffset: string): {
  ean: string;
  ref: string;
  title: string;
  description: string;
  base_price: number;
  tax_code: string;
  unit_of_measure: string;
  quantity_measure: number;
  image_url: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
} {
  // Select random category
  const category = SPANISH_GROCERY_CATEGORIES[Math.floor(Math.random() * SPANISH_GROCERY_CATEGORIES.length)];
  
  // Select random elements from category
  const brand = category.brands[Math.floor(Math.random() * category.brands.length)];
  const variant = category.variants[Math.floor(Math.random() * category.variants.length)];
  const unitType = category.units[Math.floor(Math.random() * category.units.length)];
  const quantity = unitType.quantities[Math.floor(Math.random() * unitType.quantities.length)];
  
  // Generate price within range
  const price = Number((Math.random() * (category.priceRange.max - category.priceRange.min) + category.priceRange.min).toFixed(2));
  
  // Generate EAN-13 code with maximum uniqueness (starts with 8414 for Spanish products)
  // Structure: 8414 + 7 digits + 1 check digit = 13 total
  const now = Date.now();
  const microseconds = Math.floor((performance.now() * 1000) % 1000); // 0-999
  const timestampPart = (now % 100000).toString().padStart(5, '0'); // Last 5 digits of timestamp
  const microPart = microseconds.toString().padStart(3, '0').slice(-2); // Last 2 digits of microseconds
  
  // Build 12-digit base: 8414 (4) + timestampPart (5) + microPart (2) + random (1) = 12 digits
  const randomDigit = Math.floor(Math.random() * 10); // Single random digit
  const eanWithoutCheck = `8414${timestampPart}${microPart}${randomDigit}`;
  
  // Validate we have exactly 12 digits before checksum
  if (eanWithoutCheck.length !== 12) {
    throw new Error(`EAN base should be 12 digits, got ${eanWithoutCheck.length}: ${eanWithoutCheck}`);
  }
  
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(eanWithoutCheck[i]);
    if (isNaN(digit)) {
      throw new Error(`Invalid digit at position ${i}: '${eanWithoutCheck[i]}' in EAN base: ${eanWithoutCheck}`);
    }
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const ean = `${eanWithoutCheck}${checkDigit}`;
  
  // Final validation - must be exactly 13 digits
  if (ean.length !== 13 || !/^\d{13}$/.test(ean)) {
    throw new Error(`Generated EAN invalid: length=${ean.length}, format check failed. EAN: ${ean}`);
  }
  
  // Generate product reference
  const ref = `${brand.toUpperCase().replace(/\s/g, '').substring(0, 4)}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  
  // Generate title
  const title = `${brand} ${variant} ${quantity}${unitType.measure}`;
  
  // Generate description
  const descriptions = [
    `${variant} de alta calidad de la marca ${brand}`,
    `Producto premium ${variant.toLowerCase()} elaborado por ${brand}`,
    `${variant} tradicional ${brand} con el mejor sabor`,
    `Excelente ${variant.toLowerCase()} de ${brand} para toda la familia`,
    `${variant} seleccionado de ${brand} con ingredientes naturales`
  ];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // Use real category image URL with EAN as query string to prevent client caching
  const imageUrl = `${category.imageUrl}?ean=${ean}`;
  
  // Calculate timestamps
  const offsetDate = new Date(timestampOffset);
  const created_at = new Date(offsetDate);
  const updated_at = new Date(offsetDate);
  
  return {
    ean,
    ref,
    title,
    description,
    base_price: price,
    tax_code: category.taxCode,
    unit_of_measure: unitType.measure,
    quantity_measure: quantity,
    image_url: imageUrl,
    is_active: Math.random() > 0.1, // 90% active products
    created_at,
    updated_at
  };
}