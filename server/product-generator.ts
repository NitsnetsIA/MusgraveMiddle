import { nanoid } from "nanoid";

export interface ProductCategory {
  name: string;
  brands: string[];
  variants: string[];
  units: { measure: string; quantities: number[] }[];
  taxCode: string;
  priceRange: { min: number; max: number };
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
    priceRange: { min: 0.89, max: 3.50 }
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
    priceRange: { min: 0.65, max: 4.99 }
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
    priceRange: { min: 2.50, max: 25.00 }
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
    priceRange: { min: 3.99, max: 18.99 }
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
    priceRange: { min: 1.99, max: 15.99 }
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
    priceRange: { min: 1.89, max: 22.99 }
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
    priceRange: { min: 0.99, max: 6.99 }
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
    priceRange: { min: 0.79, max: 4.99 }
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
    priceRange: { min: 0.89, max: 4.99 }
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
    priceRange: { min: 0.99, max: 8.99 }
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
    priceRange: { min: 1.99, max: 15.99 }
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
    priceRange: { min: 0.89, max: 8.99 }
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
    priceRange: { min: 0.65, max: 3.99 }
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
    priceRange: { min: 3.99, max: 49.99 }
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
    priceRange: { min: 0.79, max: 15.99 }
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
    priceRange: { min: 0.99, max: 4.99 }
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
    priceRange: { min: 0.89, max: 12.99 }
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
    priceRange: { min: 1.99, max: 12.99 }
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
    priceRange: { min: 1.49, max: 8.99 }
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
    priceRange: { min: 2.99, max: 19.99 }
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
  image_url: null;
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
  
  // Generate EAN code (simplified, starts with 841471 for Spanish products)
  const ean = `841471${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  
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
    image_url: null,
    is_active: Math.random() > 0.1, // 90% active products
    created_at,
    updated_at
  };
}

export function generateRandomProducts(count: number, timestampOffset: string) {
  const products = [];
  const usedEans = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let product;
    let attempts = 0;
    
    // Ensure unique EAN codes
    do {
      product = generateRandomProduct(timestampOffset);
      attempts++;
      if (attempts > 100) {
        throw new Error("Unable to generate unique EAN codes after 100 attempts");
      }
    } while (usedEans.has(product.ean));
    
    usedEans.add(product.ean);
    products.push(product);
  }
  
  return products;
}