import { db } from './db.js';
import { purchaseOrderItems, purchaseOrders, stores, products, orders, orderItems } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Función para crear un pedido simulado basado en una purchase order
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
  // Formato: YYMMDDHHMMSS
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  const timeStr = `${year}${month}${day}${hour}${minute}${second}`;
  
  // Generar 4 caracteres alfanuméricos aleatorios
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomSuffix = Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
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
        item_ref: item.item_ref,
        item_title: item.item_title,
        item_description: item.item_description,
        unit_of_measure: item.unit_of_measure,
        quantity_measure: item.quantity_measure,
        image_url: item.image_url,
        nutrition_label_url: item.nutrition_label_url,
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
          item_ref: item.item_ref,
          item_title: item.item_title,
          item_description: item.item_description,
          unit_of_measure: item.unit_of_measure,
          quantity_measure: item.quantity_measure,
          image_url: item.image_url,
          nutrition_label_url: item.nutrition_label_url,
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
          item_ref: substituteProduct.ref,
          item_title: substituteProduct.title,
          item_description: substituteProduct.description,
          unit_of_measure: substituteProduct.unit_of_measure,
          quantity_measure: substituteProduct.quantity_measure,
          image_url: substituteProduct.image_url,
          nutrition_label_url: substituteProduct.nutrition_label_url,
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

  // Actualizar el estado de la purchase order a "COMPLETADO"
  await db
    .update(purchaseOrders)
    .set({
      status: 'COMPLETADO',
      updated_at: new Date()
    })
    .where(eq(purchaseOrders.purchase_order_id, sourcePurchaseOrder.purchase_order_id));

  return createdOrder;
}