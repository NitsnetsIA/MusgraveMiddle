import { nanoid } from "nanoid";
import { createHash } from "crypto";

// Función para generar hash SHA3 usando email como salt
export function hashPassword(password: string, email: string): string {
  const saltedPassword = email + password;
  return createHash('sha3-256').update(saltedPassword).digest('hex');
}

// Datos realistas españoles para generar entidades coherentes

export const SPANISH_CITIES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Palma", 
  "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Hospitalet",
  "Vitoria", "La Coruña", "Granada", "Elche", "Oviedo", "Badalona", "Cartagena", "Terrassa",
  "Jerez", "Sabadell", "Móstoles", "Santa Cruz", "Pamplona", "Almería"
];

export const SPANISH_PROVINCES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Baleares", 
  "Las Palmas", "Vizcaya", "Alicante", "Córdoba", "Valladolid", "Pontevedra", "Asturias", 
  "Barcelona", "Álava", "La Coruña", "Granada", "Alicante", "Asturias", "Barcelona", "Murcia", 
  "Barcelona", "Cádiz", "Barcelona", "Madrid", "Santa Cruz de Tenerife", "Navarra", "Almería"
];

export const SPANISH_NAMES = {
  firstNames: [
    "María", "Carmen", "Josefa", "Ana", "Francisca", "Laura", "Antonia", "Dolores", "Isabel", "Pilar",
    "Antonio", "José", "Manuel", "Francisco", "David", "Juan", "Javier", "Daniel", "Carlos", "Miguel",
    "Elena", "Cristina", "Paula", "Sara", "Andrea", "Marta", "Lucía", "Natalia", "Patricia", "Alba",
    "Alejandro", "Pablo", "Adrián", "Álvaro", "Sergio", "Diego", "Jorge", "Iván", "Rubén", "Óscar"
  ],
  lastNames: [
    "García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín",
    "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Alonso", "Gutiérrez",
    "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco", "Suárez",
    "Molina", "Morales", "Ortega", "Delgado", "Castro", "Ortiz", "Rubio", "Marín", "Sanz", "Iglesias"
  ]
};

export const DELIVERY_CENTER_TYPES = [
  "Centro de Distribución Regional",
  "Almacén Central",
  "Centro Logístico",
  "Plataforma de Distribución",
  "Hub Regional"
];

export const STORE_TYPES = [
  "Supermercado",
  "Hipermercado", 
  "Tienda de Conveniencia",
  "Market",
  "Express"
];

export const USER_ROLES = [
  "Gerente",
  "Cajero/a",
  "Reponedor/a",
  "Encargado/a de Sección",
  "Vendedor/a",
  "Administrativo/a"
];

export const PURCHASE_ORDER_STATUSES = [
  "PENDIENTE",
  "EN_PROCESO", 
  "COMPLETADO",
  "CANCELADO"
];

// Generadores de datos coherentes
export function generateDeliveryCenters(count: number = 5) {
  const centers = [];
  const usedCities = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let city;
    do {
      city = SPANISH_CITIES[Math.floor(Math.random() * SPANISH_CITIES.length)];
    } while (usedCities.has(city) && usedCities.size < SPANISH_CITIES.length);
    
    usedCities.add(city);
    const province = SPANISH_PROVINCES[SPANISH_CITIES.indexOf(city)] || city;
    const type = DELIVERY_CENTER_TYPES[Math.floor(Math.random() * DELIVERY_CENTER_TYPES.length)];
    
    centers.push({
      code: `DC${String(i + 1).padStart(3, '0')}`,
      name: `${type} ${city}`
    });
  }
  
  return centers;
}

export function generateStores(deliveryCenters: any[], storesPerCenter: number = 3) {
  const stores = [];
  let storeCounter = 1;
  
  // Primero crear la tienda ES001 para el usuario por defecto
  const firstCenter = deliveryCenters[0];
  if (firstCenter) {
    stores.push({
      code: 'ES001',
      name: 'Supermercado Madrid Centro',
      delivery_center_code: firstCenter.code,
      responsible_email: 'luis@esgranvia.es',
      is_active: true
    });
  }
  
  for (const center of deliveryCenters) {
    const numStores = Math.floor(Math.random() * storesPerCenter) + 1;
    
    for (let i = 0; i < numStores; i++) {
      const storeType = STORE_TYPES[Math.floor(Math.random() * STORE_TYPES.length)];
      const neighborhood = generateNeighborhood();
      const centerCity = center.name.split(' ').pop() || 'Centro';
      
      const storeCode = `ST${String(storeCounter).padStart(3, '0')}`;
      
      // Evitar duplicar ES001
      if (storeCode === 'ES001') {
        storeCounter++;
        continue;
      }
      
      stores.push({
        code: storeCode,
        name: `${storeType} ${centerCity} ${neighborhood}`,
        delivery_center_code: center.code,
        responsible_email: null,
        is_active: Math.random() > 0.05 // 95% activas
      });
      
      storeCounter++;
    }
  }
  
  return stores;
}

export function generateUsers(stores: any[], usersPerStore: number = 4) {
  const users = [];
  
  // Primero, agregar el usuario por defecto Luis Romero Pérez
  const defaultStore = stores.find(store => store.code === 'ES001') || stores[0];
  if (defaultStore) {
    const defaultEmail = 'luis@esgranvia.es';
    users.push({
      email: defaultEmail,
      store_id: defaultStore.code,
      name: 'Luis Romero Pérez',
      password_hash: hashPassword('password123', defaultEmail),
      is_active: true
    });
  }
  
  // Luego generar el resto de usuarios
  for (const store of stores) {
    const numUsers = Math.floor(Math.random() * usersPerStore) + 1;
    
    for (let i = 0; i < numUsers; i++) {
      const firstName = SPANISH_NAMES.firstNames[Math.floor(Math.random() * SPANISH_NAMES.firstNames.length)];
      const lastName1 = SPANISH_NAMES.lastNames[Math.floor(Math.random() * SPANISH_NAMES.lastNames.length)];
      const lastName2 = SPANISH_NAMES.lastNames[Math.floor(Math.random() * SPANISH_NAMES.lastNames.length)];
      
      const email = `${firstName.toLowerCase()}.${lastName1.toLowerCase()}@${store.code.toLowerCase()}.tiendas.com`;
      
      // Evitar duplicar el email del usuario por defecto
      if (email === 'luis@esgranvia.es') {
        continue;
      }
      
      users.push({
        email,
        store_id: store.code,
        name: `${firstName} ${lastName1} ${lastName2}`,
        password_hash: hashPassword('password123', email),
        is_active: Math.random() > 0.1 // 90% activos
      });
    }
  }
  
  return users;
}

export function generatePurchaseOrders(users: any[], stores: any[], products: any[] = [], count: number = 20) {
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const store = stores.find(s => s.code === user.store_id);
    const status = PURCHASE_ORDER_STATUSES[Math.floor(Math.random() * PURCHASE_ORDER_STATUSES.length)];
    
    // Generar totales realistas
    const subtotal = Math.round((Math.random() * 200 + 50) * 100) / 100;
    const taxTotal = Math.round(subtotal * 0.1 * 100) / 100; // Promedio 10%
    const finalTotal = Math.round((subtotal + taxTotal) * 100) / 100;
    
    orders.push({
      purchase_order_id: `PO${Date.now()}-${nanoid(6)}`,
      user_email: user.email,
      store_id: store.code,
      status,
      subtotal,
      tax_total: taxTotal,
      final_total: finalTotal
    });
  }
  
  return orders;
}

function generateNeighborhood(): string {
  const neighborhoods = [
    "Centro", "Norte", "Sur", "Este", "Oeste", "Plaza Mayor", "Estación", "Universidad",
    "Hospital", "Industrial", "Residencial", "Comercial", "Alameda", "Parque", "Avenida"
  ];
  return neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
}

function generateStreetName(): string {
  const streetTypes = ["Mayor", "Real", "España", "Constitución", "Libertad", "Paz", "Victoria", "Sol"];
  const streetPrefixes = ["Calle", "Avenida", "Plaza", "Paseo"];
  
  const prefix = streetPrefixes[Math.floor(Math.random() * streetPrefixes.length)];
  const name = streetTypes[Math.floor(Math.random() * streetTypes.length)];
  
  return `${prefix} ${name}`;
}

// Función principal para generar todas las entidades de forma coherente
export function generateCoherentEntities(options: {
  deliveryCenters?: number;
  storesPerCenter?: number;
  usersPerStore?: number;
  purchaseOrders?: number;
}) {
  const {
    deliveryCenters = 5,
    storesPerCenter = 3,
    usersPerStore = 4,
    purchaseOrders = 20
  } = options;
  
  console.log("Generando centros de distribución...");
  const centers = generateDeliveryCenters(deliveryCenters);
  
  console.log("Generando tiendas...");
  const stores = generateStores(centers, storesPerCenter);
  
  console.log("Generando usuarios...");
  const users = generateUsers(stores, usersPerStore);
  
  // Ya no generamos purchase orders ni orders en "generar datos completos"
  // porque ahora el ciclo completo se hace desde las apps frontales
  
  return {
    deliveryCenters: centers,
    stores,
    users,
    summary: {
      deliveryCenters: centers.length,
      stores: stores.length,
      users: users.length
    }
  };
}