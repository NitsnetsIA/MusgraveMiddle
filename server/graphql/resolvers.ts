import { storage } from "../storage";
import { db } from "../db";
import { 
  products, taxes, deliveryCenters, stores, users, purchaseOrders, purchaseOrderItems, orders, orderItems 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateCoherentEntities } from '../entity-generator';

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

    // Delivery Centers queries
    deliveryCenters: async (_: any, { timestamp, limit = 100, offset = 0 }: { timestamp?: string; limit?: number; offset?: number }) => {
      return await storage.getDeliveryCenters(timestamp, limit, offset);
    },
    
    deliveryCenter: async (_: any, { code }: { code: string }) => {
      return await storage.getDeliveryCenter(code);
    },

    // Stores queries
    stores: async (_: any, { timestamp, limit = 100, offset = 0 }: { timestamp?: string; limit?: number; offset?: number }) => {
      return await storage.getStores(timestamp, limit, offset);
    },
    
    store: async (_: any, { code }: { code: string }) => {
      return await storage.getStore(code);
    },

    // Users queries
    users: async (_: any, { timestamp, limit = 100, offset = 0, store_id }: { timestamp?: string; limit?: number; offset?: number; store_id?: string }) => {
      return await storage.getUsers(timestamp, limit, offset, store_id);
    },
    
    user: async (_: any, { email }: { email: string }) => {
      return await storage.getUser(email);
    },

    // Purchase Orders queries
    purchaseOrders: async (_: any, { timestamp, limit = 100, offset = 0, store_id }: { timestamp?: string; limit?: number; offset?: number; store_id?: string }) => {
      return await storage.getPurchaseOrders(timestamp, limit, offset, store_id);
    },
    
    purchaseOrder: async (_: any, { purchase_order_id }: { purchase_order_id: string }) => {
      return await storage.getPurchaseOrder(purchase_order_id);
    },

    // Purchase Order Items queries
    purchaseOrderItems: async (_: any, { purchase_order_id }: { purchase_order_id?: string }) => {
      if (purchase_order_id) {
        return await storage.getPurchaseOrderItemsByOrderId(purchase_order_id);
      }
      return await storage.getPurchaseOrderItems();
    },
    
    purchaseOrderItem: async (_: any, { item_id }: { item_id: number }) => {
      return await storage.getPurchaseOrderItem(item_id);
    },

    // Order Items queries
    orderItems: async (_: any, { order_id }: { order_id?: string }) => {
      if (order_id) {
        return await storage.getOrderItemsByOrderId(order_id);
      }
      return await storage.getOrderItems();
    },

    // Orders queries
    orders: async (_: any, { timestamp, limit = 100, offset = 0, store_id }: { timestamp?: string; limit?: number; offset?: number; store_id?: string }) => {
      return await storage.getOrders(timestamp, limit, offset, store_id);
    },
    
    order: async (_: any, { order_id }: { order_id: string }) => {
      return await storage.getOrder(order_id);
    },


    
    orderItem: async (_: any, { item_id }: { item_id: number }) => {
      return await storage.getOrderItem(item_id);
    },

    // Sync info query
    sync_info: async () => {
      return await storage.getSyncInfo();
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

    toggleProductStatus: async (_: any, { ean }: { ean: string }) => {
      return await storage.toggleProductStatus(ean);
    },

    generateRandomProducts: async (_: any, { count, timestampOffset }: { count: number; timestampOffset?: string }) => {
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

    deleteAllTaxes: async () => {
      return await storage.deleteAllTaxes();
    },

    // Delivery Centers mutations
    createDeliveryCenter: async (_: any, { input }: { input: any }) => {
      return await storage.createDeliveryCenter(input);
    },
    
    updateDeliveryCenter: async (_: any, { code, input }: { code: string; input: any }) => {
      return await storage.updateDeliveryCenter(code, input);
    },
    
    deleteDeliveryCenter: async (_: any, { code }: { code: string }) => {
      return await storage.deleteDeliveryCenter(code);
    },

    deleteAllDeliveryCenters: async () => {
      return await storage.deleteAllDeliveryCenters();
    },

    toggleDeliveryCenterStatus: async (_: any, { code }: { code: string }) => {
      return await storage.toggleDeliveryCenterStatus(code);
    },

    // Stores mutations
    createStore: async (_: any, { input }: { input: any }) => {
      return await storage.createStore(input);
    },
    
    updateStore: async (_: any, { code, input }: { code: string; input: any }) => {
      return await storage.updateStore(code, input);
    },
    
    deleteStore: async (_: any, { code }: { code: string }) => {
      return await storage.deleteStore(code);
    },

    deleteAllStores: async () => {
      return await storage.deleteAllStores();
    },

    toggleStoreStatus: async (_: any, { code }: { code: string }) => {
      return await storage.toggleStoreStatus(code);
    },

    // Users mutations
    createUser: async (_: any, { input }: { input: any }) => {
      return await storage.createUser(input);
    },
    
    updateUser: async (_: any, { email, input }: { email: string; input: any }) => {
      return await storage.updateUser(email, input);
    },
    
    deleteUser: async (_: any, { email }: { email: string }) => {
      return await storage.deleteUser(email);
    },

    deleteAllUsers: async () => {
      return await storage.deleteAllUsers();
    },

    toggleUserStatus: async (_: any, { email }: { email: string }) => {
      return await storage.toggleUserStatus(email);
    },

    loginUser: async (_: any, { input }: { input: { email: string; password: string } }) => {
      return await storage.loginUser(input.email, input.password);
    },

    // Purchase Orders mutations
    createPurchaseOrder: async (_: any, { input }: { input: any }) => {
      // Si hay items incluidos, usar el método que crea todo junto
      if (input.items && input.items.length > 0) {
        const { items, ...purchaseOrderData } = input;
        return await storage.createPurchaseOrderWithItems({
          purchaseOrder: purchaseOrderData,
          items: items
        });
      } else {
        // Si no hay items, usar el método tradicional
        const { items, ...purchaseOrderData } = input;
        return await storage.createPurchaseOrder(purchaseOrderData);
      }
    },

    // Crear Purchase Order con simulación automática opcional
    createPurchaseOrderWithSimulation: async (_: any, { input, simulateOrder }: { input: any; simulateOrder: boolean }) => {
      try {
        // Crear la purchase order con sus items
        const { items, ...purchaseOrderData } = input;
        const createdPurchaseOrder = await storage.createPurchaseOrderWithItems({
          purchaseOrder: purchaseOrderData,
          items: items
        });

        let simulatedOrder = null;
        let message = 'Purchase order created successfully';

        // Si simulateOrder es true, crear el pedido simulado
        if (simulateOrder) {
          try {
            const { createSimulatedOrder: createSimulated } = await import('../simulation.js');
            simulatedOrder = await createSimulated(createdPurchaseOrder);
            message = 'Purchase order created and order simulated successfully';
          } catch (error) {
            console.error('Error creating simulated order:', error);
            message = 'Purchase order created but order simulation failed';
          }
        }

        return {
          purchaseOrder: createdPurchaseOrder,
          simulatedOrder,
          message
        };
      } catch (error) {
        throw new Error(`Failed to create purchase order with simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    updatePurchaseOrder: async (_: any, { purchase_order_id, input }: { purchase_order_id: string; input: any }) => {
      return await storage.updatePurchaseOrder(purchase_order_id, input);
    },
    
    deletePurchaseOrder: async (_: any, { purchase_order_id }: { purchase_order_id: string }) => {
      return await storage.deletePurchaseOrder(purchase_order_id);
    },

    deleteAllPurchaseOrders: async () => {
      return await storage.deleteAllPurchaseOrders();
    },

    // Purchase Order Items mutations
    createPurchaseOrderItem: async (_: any, { input }: { input: any }) => {
      return await storage.createPurchaseOrderItem(input);
    },
    
    updatePurchaseOrderItem: async (_: any, { item_id, input }: { item_id: number; input: any }) => {
      return await storage.updatePurchaseOrderItem(item_id, input);
    },
    
    deletePurchaseOrderItem: async (_: any, { item_id }: { item_id: number }) => {
      return await storage.deletePurchaseOrderItem(item_id);
    },

    deleteAllPurchaseOrderItems: async () => {
      return await storage.deleteAllPurchaseOrderItems();
    },

    // Orders mutations
    createOrder: async (_: any, { input }: { input: any }) => {
      return await storage.createOrder(input);
    },
    
    updateOrder: async (_: any, { order_id, input }: { order_id: string; input: any }) => {
      return await storage.updateOrder(order_id, input);
    },
    
    deleteOrder: async (_: any, { order_id }: { order_id: string }) => {
      return await storage.deleteOrder(order_id);
    },

    deleteAllOrders: async () => {
      return await storage.deleteAllOrders();
    },

    // Order Items mutations
    createOrderItem: async (_: any, { input }: { input: any }) => {
      return await storage.createOrderItem(input);
    },
    
    updateOrderItem: async (_: any, { item_id, input }: { item_id: number; input: any }) => {
      return await storage.updateOrderItem(item_id, input);
    },
    
    deleteOrderItem: async (_: any, { item_id }: { item_id: number }) => {
      return await storage.deleteOrderItem(item_id);
    },

    deleteAllOrderItems: async () => {
      return await storage.deleteAllOrderItems();
    },

    // Entity generation mutation
    // Individual entity generation methods
    generateTaxes: async (_: any, { clearExisting, timestampOffset }: { clearExisting?: boolean; timestampOffset?: string }) => {
      return await storage.generateTaxes(clearExisting || false, timestampOffset);
    },

    generateDeliveryCenters: async (_: any, { count, clearExisting, timestampOffset }: { count: number; clearExisting?: boolean; timestampOffset?: string }) => {
      return await storage.generateDeliveryCenters(count, clearExisting || false, timestampOffset);
    },

    generateStores: async (_: any, { storesPerCenter, clearExisting, timestampOffset }: { storesPerCenter: number; clearExisting?: boolean; timestampOffset?: string }) => {
      return await storage.generateStores(storesPerCenter, clearExisting || false, timestampOffset);
    },

    generateUsers: async (_: any, { usersPerStore, clearExisting, timestampOffset }: { usersPerStore: number; clearExisting?: boolean; timestampOffset?: string }) => {
      return await storage.generateUsers(usersPerStore, clearExisting || false, timestampOffset);
    },

    generatePurchaseOrders: async (_: any, { count, clearExisting, timestampOffset, autoSimulate }: { count: number; clearExisting?: boolean; timestampOffset?: string; autoSimulate?: boolean }) => {
      const result = await storage.generatePurchaseOrders(count, clearExisting || false, timestampOffset);
      
      // Si autoSimulate está activado, generar orders automáticamente para cada purchase order creada
      if (autoSimulate && result.success) {
        try {
          console.log(`Auto-simulating orders for ${count} purchase orders...`);
          const ordersResult = await storage.generateOrders(count, false, timestampOffset);
          if (ordersResult.success) {
            return {
              ...result,
              message: `${result.message} + ${ordersResult.message} (simulación automática activada)`
            };
          }
        } catch (error) {
          console.error('Error in auto-simulation:', error);
          return {
            ...result,
            message: `${result.message} (simulación automática falló: ${error instanceof Error ? error.message : 'Unknown error'})`
          };
        }
      }
      
      return result;
    },

    generateOrders: async (_: any, { count, clearExisting, timestampOffset }: { count: number; clearExisting?: boolean; timestampOffset?: string }) => {
      return await storage.generateOrders(count, clearExisting || false, timestampOffset);
    },

    generateEntities: async (_: any, { input }: { input: any }) => {
      return await storage.generateEntities(input);
    },

    // Delete all data
    deleteAllData: async () => {
      return await storage.deleteAllData();
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

  // Delivery Center resolvers
  DeliveryCenter: {
    stores: async (parent: any) => {
      return await db
        .select()
        .from(stores)
        .where(eq(stores.delivery_center_code, parent.code));
    },
  },

  // Store resolvers
  Store: {
    deliveryCenter: async (parent: any) => {
      const [deliveryCenter] = await db
        .select()
        .from(deliveryCenters)
        .where(eq(deliveryCenters.code, parent.delivery_center_code));
      return deliveryCenter;
    },
    users: async (parent: any) => {
      return await db
        .select()
        .from(users)
        .where(eq(users.store_id, parent.code));
    },
    purchaseOrders: async (parent: any) => {
      return await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.store_id, parent.code));
    },
    orders: async (parent: any) => {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.store_id, parent.code));
    },
  },

  // User resolvers
  User: {
    store: async (parent: any) => {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.code, parent.store_id));
      return store;
    },
    purchaseOrders: async (parent: any) => {
      return await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.user_email, parent.email));
    },
    orders: async (parent: any) => {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.user_email, parent.email));
    },
  },

  // Purchase Order resolvers
  PurchaseOrder: {
    user: async (parent: any) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, parent.user_email));
      return user;
    },
    store: async (parent: any) => {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.code, parent.store_id));
      return store;
    },
    items: async (parent: any) => {
      return await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchase_order_id, parent.purchase_order_id));
    },
    order: async (parent: any) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.source_purchase_order_id, parent.purchase_order_id));
      return order;
    },
  },

  // Purchase Order Item resolvers
  PurchaseOrderItem: {
    purchaseOrder: async (parent: any) => {
      const [purchaseOrder] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.purchase_order_id, parent.purchase_order_id));
      return purchaseOrder;
    },
  },

  // Order resolvers
  Order: {
    sourcePurchaseOrder: async (parent: any) => {
      const [purchaseOrder] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.purchase_order_id, parent.source_purchase_order_id));
      return purchaseOrder;
    },
    user: async (parent: any) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, parent.user_email));
      return user;
    },
    store: async (parent: any) => {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.code, parent.store_id));
      return store;
    },
    items: async (parent: any) => {
      return await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.order_id, parent.order_id));
    },
  },

  // Order Item resolvers
  OrderItem: {
    order: async (parent: any) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.order_id, parent.order_id));
      return order;
    },
  },
};

// Función auxiliar para crear un pedido simulado basado en una purchase order
export async function createSimulatedOrder(sourcePurchaseOrder: any): Promise<any> {
  // Obtener los items de la purchase order
  const purchaseOrderItemsResult = await db.select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchase_order_id, sourcePurchaseOrder.purchase_order_id));

  // Obtener información de la tienda y centro de distribución
  const storeResult = await db.select()
    .from(stores)
    .where(eq(stores.code, sourcePurchaseOrder.store_id))
    .limit(1);

  if (!storeResult.length) {
    throw new Error(`Store ${sourcePurchaseOrder.store_id} not found`);
  }

  const store = storeResult[0];

  // Generar ID coherente con el centro de distribución
  const deliveryCenterCode = store.delivery_center_code;
  const now = new Date();
  const timeStr = now.toISOString().slice(2, 19).replace(/[-:T]/g, '').slice(0, 12); // YYMMDDHHMMSS
  const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
  const orderId = `${deliveryCenterCode}-${timeStr}-${randomSuffix}`;

  // Obtener todos los productos para posibles sustituciones
  const allProductsResult = await db.select().from(products).where(eq(products.is_active, true));

  // Simular variaciones en las líneas
  const simulatedItems: any[] = [];
  
  for (const item of purchaseOrderItemsResult) {
    const random = Math.random();
    
    if (random <= 0.8) {
      // 80% - sin cambios
      simulatedItems.push({
        order_id: orderId,
        item_ean: item.item_ean,
        item_title: item.item_title,
        item_description: item.item_description,
        unit_of_measure: item.unit_of_measure,
        quantity_measure: item.quantity_measure,
        image_url: item.image_url,
        quantity: item.quantity,
        base_price_at_order: item.base_price_at_order,
        tax_rate_at_order: item.tax_rate_at_order,
      });
    } else {
      // 20% - reducir cantidad aleatoriamente
      const reductionFactor = Math.random() * 0.7 + 0.1; // Reducir entre 10% y 80%
      const newQuantity = Math.floor(item.quantity * reductionFactor);
      
      if (newQuantity > 0) {
        simulatedItems.push({
          order_id: orderId,
          item_ean: item.item_ean,
          item_title: item.item_title,
          item_description: item.item_description,
          unit_of_measure: item.unit_of_measure,
          quantity_measure: item.quantity_measure,
          image_url: item.image_url,
          quantity: newQuantity,
          base_price_at_order: item.base_price_at_order,
          tax_rate_at_order: item.tax_rate_at_order,
        });
      }
      // Si la cantidad llega a 0, la línea se elimina y hay 20% posibilidad de sustituto
      else if (Math.random() <= 0.2 && allProductsResult.length > 0) {
        // Crear línea sustituta con producto aleatorio
        const substituteProduct = allProductsResult[Math.floor(Math.random() * allProductsResult.length)];
        simulatedItems.push({
          order_id: orderId,
          item_ean: substituteProduct.ean,
          item_title: substituteProduct.title,
          item_description: substituteProduct.description,
          unit_of_measure: substituteProduct.unit_of_measure,
          quantity_measure: substituteProduct.quantity_measure,
          image_url: substituteProduct.image_url,
          quantity: item.quantity, // Cantidad original
          base_price_at_order: substituteProduct.base_price,
          tax_rate_at_order: substituteProduct.tax_code === 'GEN' ? 0.21 : 
                            substituteProduct.tax_code === 'RED' ? 0.10 :
                            substituteProduct.tax_code === 'SUP' ? 0.04 : 0,
        });
      }
    }
  }

  // Calcular totales
  let subtotal = 0;
  let taxTotal = 0;
  
  for (const item of simulatedItems) {
    const lineSubtotal = item.quantity * item.base_price_at_order;
    const lineTax = lineSubtotal * item.tax_rate_at_order;
    subtotal += lineSubtotal;
    taxTotal += lineTax;
  }

  const finalTotal = subtotal + taxTotal;

  // Crear el pedido procesado
  const [createdOrder] = await db
    .insert(orders)
    .values({
      order_id: orderId,
      source_purchase_order_id: sourcePurchaseOrder.purchase_order_id,
      user_email: sourcePurchaseOrder.user_email,
      store_id: sourcePurchaseOrder.store_id,
      observations: 'Pedido generado automáticamente mediante simulación',
      subtotal,
      tax_total: taxTotal,
      final_total: finalTotal,
    })
    .returning();

  // Crear los items del pedido
  if (simulatedItems.length > 0) {
    await db.insert(orderItems).values(simulatedItems);
  }

  return createdOrder;
}
