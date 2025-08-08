import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Trash2, Plus, RefreshCw, Building2, Store, Users, FileText, Receipt, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import React, { useState } from "react";

interface Product {
  ean: string;
  ref: string | null;
  title: string;
  description: string | null;
  base_price: number;
  tax_code: string;
  unit_of_measure: string;
  quantity_measure: number;
  image_url: string | null;
  is_active: boolean;
  tax?: {
    name: string;
    tax_rate: number;
  };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

const GRAPHQL_ENDPOINT = "/graphql";

// Interfaces for all entities
interface DeliveryCenter {
  code: string;
  name: string;
  city: string;
  region: string;
  postal_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Store {
  code: string;
  name: string;
  delivery_center_code: string;
  responsible_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deliveryCenter?: {
    code: string;
    name: string;
  };
}

interface User {
  email: string;
  store_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  store?: {
    code: string;
    name: string;
  };
}

interface PurchaseOrder {
  purchase_order_id: string;
  user_email: string;
  store_id: string;
  status: string;
  subtotal: number;
  tax_total: number;
  final_total: number;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    store?: {
      name: string;
    };
  };
}

interface Order {
  order_id: string;
  source_purchase_order_id: string | null;
  user_email: string;
  store_id: string;
  observations: string | null;
  subtotal: number;
  tax_total: number;
  final_total: number;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    store?: {
      name: string;
    };
  };
  sourcePurchaseOrder?: PurchaseOrder | null;
}

interface Tax {
  code: string;
  name: string;
  tax_rate: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderItem {
  item_id: number;
  purchase_order_id: string;
  item_ean: string;
  item_title: string | null;
  item_description: string | null;
  unit_of_measure: string | null;
  quantity_measure: number | null;
  image_url: string | null;
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
  created_at: string;
  updated_at: string;
}

interface EntitiesResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

async function fetchProducts(): Promise<ProductsResponse> {
  const query = `
    query GetProducts {
      products(limit: 20, offset: 0) {
        products {
          ean
          ref
          title
          description
          base_price
          tax_code
          unit_of_measure
          quantity_measure
          image_url
          is_active
          tax {
            name
            tax_rate
          }
        }
        total
        limit
        offset
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.products;
}

// Function to fetch purchase order items
async function fetchPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
  const query = `
    query GetPurchaseOrderItems($purchase_order_id: String!) {
      purchaseOrderItems(purchase_order_id: $purchase_order_id) {
        item_id
        purchase_order_id
        item_ean
        item_title
        item_description
        unit_of_measure
        quantity_measure
        image_url
        quantity
        base_price_at_order
        tax_rate_at_order
        created_at
        updated_at
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query,
      variables: { purchase_order_id: purchaseOrderId }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.purchaseOrderItems || [];
}

// Function to fetch order items
async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const query = `
    query GetOrderItems($order_id: String!) {
      orderItems(order_id: $order_id) {
        item_id
        order_id
        item_ean
        item_title
        item_description
        unit_of_measure
        quantity_measure
        image_url
        quantity
        base_price_at_order
        tax_rate_at_order
        created_at
        updated_at
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query,
      variables: { order_id: orderId }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.orderItems || [];
}

// Component to display order items table
function OrderItemsTable({ orderId }: { orderId: string }) {
  const { data: orderItems, isLoading, error } = useQuery({
    queryKey: ["orderItems", orderId],
    queryFn: () => fetchOrderItems(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          Error al cargar las líneas del pedido: {error instanceof Error ? error.message : "Error desconocido"}
        </p>
      </div>
    );
  }

  if (!orderItems || orderItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Este pedido no tiene líneas de productos</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Imagen</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Precio Unitario</TableHead>
          <TableHead>IVA</TableHead>
          <TableHead>Total Línea</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderItems.map((item) => {
          const lineTotal = item.quantity * item.base_price_at_order * (1 + item.tax_rate_at_order);
          return (
            <TableRow key={item.item_id}>
              <TableCell>
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.item_title}
                    className="w-12 h-12 object-cover rounded border"
                  />
                )}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{item.item_title}</div>
                  <div className="text-sm text-muted-foreground">
                    EAN: {item.item_ean}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity_measure} {item.unit_of_measure}
                  </div>
                </div>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>€{item.base_price_at_order.toFixed(2)}</TableCell>
              <TableCell>{(item.tax_rate_at_order * 100).toFixed(1)}%</TableCell>
              <TableCell className="font-medium">€{lineTotal.toFixed(2)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

async function fetchDeliveryCenters(limit: number = 20, offset: number = 0): Promise<EntitiesResponse<DeliveryCenter>> {
  const query = `
    query GetDeliveryCenters {
      deliveryCenters {
        code
        name
        created_at
        updated_at
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query, variables: { limit, offset } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  // Simular paginación en el frontend ya que la query no la soporta
  const allCenters = result.data.deliveryCenters || [];
  const paginatedCenters = allCenters.slice(offset, offset + limit);
  
  return {
    data: paginatedCenters,
    total: allCenters.length,
    limit,
    offset
  };
}

async function fetchStores(limit: number = 20, offset: number = 0): Promise<EntitiesResponse<Store>> {
  const query = `
    query GetStores {
      stores {
        code
        name
        delivery_center_code
        responsible_email
        is_active
        created_at
        updated_at
        deliveryCenter {
          code
          name
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query, variables: { limit, offset } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  // Simular paginación en el frontend ya que la query no la soporta
  const allStores = result.data.stores || [];
  const paginatedStores = allStores.slice(offset, offset + limit);
  
  return {
    data: paginatedStores,
    total: allStores.length,
    limit,
    offset
  };
}

async function fetchUsers(limit: number = 20, offset: number = 0): Promise<EntitiesResponse<User>> {
  const query = `
    query GetUsers {
      users {
        email
        store_id
        name
        is_active
        created_at
        updated_at
        store {
          code
          name
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query, variables: { limit, offset } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  // Simular paginación en el frontend ya que la query no la soporta
  const allUsers = result.data.users || [];
  const paginatedUsers = allUsers.slice(offset, offset + limit);
  
  return {
    data: paginatedUsers,
    total: allUsers.length,
    limit,
    offset
  };
}

// Función para obtener pedidos (orders) - simplificada sin paginación por ahora
async function fetchOrders(limit: number = 10, offset: number = 0): Promise<EntitiesResponse<Order>> {
  const query = `
    query GetOrders {
      orders {
        order_id
        source_purchase_order_id
        user_email
        store_id
        observations
        subtotal
        tax_total
        final_total
        created_at
        updated_at
        user {
          name
          email
          store {
            name
          }
        }
        sourcePurchaseOrder {
          purchase_order_id
          status
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  // Simular paginación en frontend
  const allOrders = result.data.orders || [];
  const paginatedOrders = allOrders.slice(offset, offset + limit);
  
  return {
    data: paginatedOrders,
    total: allOrders.length,
    limit,
    offset
  };
}

async function fetchPurchaseOrders(limit: number = 20, offset: number = 0): Promise<EntitiesResponse<PurchaseOrder>> {
  const query = `
    query GetPurchaseOrders {
      purchaseOrders {
        purchase_order_id
        user_email
        store_id
        status
        final_total
        created_at
        updated_at
        user {
          name
          email
          store {
            name
          }
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query, variables: { limit, offset } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  // Simular paginación en el frontend ya que la query no la soporta
  const allOrders = result.data.purchaseOrders || [];
  const paginatedOrders = allOrders.slice(offset, offset + limit);
  
  return {
    data: paginatedOrders,
    total: allOrders.length,
    limit,
    offset
  };
}

async function fetchTaxes(limit: number = 20, offset: number = 0): Promise<EntitiesResponse<Tax>> {
  const query = `
    query GetTaxes($limit: Int, $offset: Int) {
      taxes(limit: $limit, offset: $offset) {
        taxes {
          code
          name
          tax_rate
          created_at
          updated_at
        }
        total
        limit
        offset
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query, variables: { limit, offset } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return {
    data: result.data.taxes.taxes,
    total: result.data.taxes.total,
    limit: result.data.taxes.limit,
    offset: result.data.taxes.offset
  };
}

async function deleteAllProducts() {
  const mutation = `
    mutation DeleteAllProducts {
      deleteAllProducts {
        success
        deletedCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllProducts;
}

async function generateRandomProducts(count: number, timestampOffset?: string) {
  const mutation = `
    mutation GenerateRandomProducts($count: Int!, $timestampOffset: String) {
      generateRandomProducts(count: $count, timestampOffset: $timestampOffset) {
        success
        createdCount
        message
        products {
          ean
          ref
          title
          base_price
          tax_code
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { count, timestampOffset: timestampOffset || null }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generateRandomProducts;
}

// Individual entity deletion functions
async function deleteAllDeliveryCenters() {
  const mutation = `
    mutation DeleteAllDeliveryCenters {
      deleteAllDeliveryCenters {
        success
        deletedCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllDeliveryCenters;
}

async function deleteAllStores() {
  const mutation = `
    mutation DeleteAllStores {
      deleteAllStores {
        success
        deletedCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllStores;
}

async function deleteAllUsers() {
  const mutation = `
    mutation DeleteAllUsers {
      deleteAllUsers {
        success
        deletedCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllUsers;
}

async function deleteAllPurchaseOrders() {
  const mutation = `
    mutation DeleteAllPurchaseOrders {
      deleteAllPurchaseOrders {
        success
        deletedCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllPurchaseOrders;
}

async function deleteAllOrders() {
  const mutation = `
    mutation DeleteAllOrders {
      deleteAllOrders {
        success
        deletedCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllOrders;
}

// Individual entity generation functions
async function generateDeliveryCenters(count: number, clearExisting: boolean = false, timestampOffset?: string) {
  const mutation = `
    mutation GenerateDeliveryCenters($count: Int!, $clearExisting: Boolean, $timestampOffset: String) {
      generateDeliveryCenters(count: $count, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
        success
        entityType
        createdCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { count, clearExisting, timestampOffset: timestampOffset || null }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generateDeliveryCenters;
}

async function generateStores(storesPerCenter: number, clearExisting: boolean = false, timestampOffset?: string) {
  const mutation = `
    mutation GenerateStores($storesPerCenter: Int!, $clearExisting: Boolean, $timestampOffset: String) {
      generateStores(storesPerCenter: $storesPerCenter, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
        success
        entityType
        createdCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { storesPerCenter, clearExisting, timestampOffset: timestampOffset || null }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generateStores;
}

async function generateUsers(usersPerStore: number, clearExisting: boolean = false, timestampOffset?: string) {
  const mutation = `
    mutation GenerateUsers($usersPerStore: Int!, $clearExisting: Boolean, $timestampOffset: String) {
      generateUsers(usersPerStore: $usersPerStore, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
        success
        entityType
        createdCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { usersPerStore, clearExisting, timestampOffset: timestampOffset || null }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generateUsers;
}

async function generatePurchaseOrders(count: number, clearExisting: boolean = false, timestampOffset?: string) {
  const mutation = `
    mutation GeneratePurchaseOrders($count: Int!, $clearExisting: Boolean, $timestampOffset: String) {
      generatePurchaseOrders(count: $count, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
        success
        entityType
        createdCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { count, clearExisting, timestampOffset: timestampOffset || null }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generatePurchaseOrders;
}

// Function to generate orders
async function generateOrders(count: number, clearExisting: boolean = false, timestampOffset?: string) {
  const mutation = `
    mutation GenerateOrders($count: Int!, $clearExisting: Boolean, $timestampOffset: String) {
      generateOrders(count: $count, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
        success
        entityType
        createdCount
        message
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { count, clearExisting, timestampOffset: timestampOffset || null }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generateOrders;
}

// Función para crear un pedido directo (sin orden de compra)
// Funciones para toggle status y delete individual
async function toggleProductStatus(ean: string) {
  const mutation = `
    mutation ToggleProductStatus($ean: String!) {
      toggleProductStatus(ean: $ean) {
        ean
        is_active
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { ean }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.toggleProductStatus;
}

async function toggleStoreStatus(code: string) {
  const mutation = `
    mutation ToggleStoreStatus($code: String!) {
      toggleStoreStatus(code: $code) {
        code
        is_active
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { code }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.toggleStoreStatus;
}

async function toggleUserStatus(email: string) {
  const mutation = `
    mutation ToggleUserStatus($email: String!) {
      toggleUserStatus(email: $email) {
        email
        is_active
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { email }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.toggleUserStatus;
}

async function deleteProduct(ean: string) {
  const mutation = `
    mutation DeleteProduct($ean: String!) {
      deleteProduct(ean: $ean)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { ean }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteProduct;
}

async function deleteStore(code: string) {
  const mutation = `
    mutation DeleteStore($code: String!) {
      deleteStore(code: $code)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { code }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteStore;
}

async function deleteUser(email: string) {
  const mutation = `
    mutation DeleteUser($email: String!) {
      deleteUser(email: $email)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { email }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteUser;
}

async function deleteDeliveryCenter(code: string) {
  const mutation = `
    mutation DeleteDeliveryCenter($code: String!) {
      deleteDeliveryCenter(code: $code)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { code }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteDeliveryCenter;
}

async function deletePurchaseOrder(purchase_order_id: string) {
  const mutation = `
    mutation DeletePurchaseOrder($purchase_order_id: String!) {
      deletePurchaseOrder(purchase_order_id: $purchase_order_id)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { purchase_order_id }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deletePurchaseOrder;
}

async function deleteOrder(order_id: string) {
  const mutation = `
    mutation DeleteOrder($order_id: String!) {
      deleteOrder(order_id: $order_id)
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { order_id }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteOrder;
}

async function createDirectOrder(userEmail: string, storeId: string): Promise<Order> {
  const mutation = `
    mutation CreateOrder($input: OrderInput!) {
      createOrder(input: $input) {
        order_id
        source_purchase_order_id
        user_email
        store_id
        observations
        subtotal
        tax_total
        final_total
        created_at
        updated_at
      }
    }
  `;

  const orderData = {
    order_id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source_purchase_order_id: null, // Pedido directo sin orden de compra
    user_email: userEmail,
    store_id: storeId,
    observations: "Pedido creado directamente",
    subtotal: 0.0,
    tax_total: 0.0,
    final_total: 0.0
  };

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({ 
      query: mutation,
      variables: { input: orderData }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.createOrder;
}

// Función para crear una orden de compra




// Componente para crear órdenes de compra


// Componente de paginación
function PaginationComponent({ 
  currentPage, 
  totalItems, 
  pageSize, 
  onPageChange 
}: { 
  currentPage: number; 
  totalItems: number; 
  pageSize: number; 
  onPageChange: (page: number) => void; 
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Página {currentPage + 1} de {totalPages} ({totalItems} elementos total)
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i;
            } else if (currentPage < 2) {
              pageNumber = i;
            } else if (currentPage > totalPages - 3) {
              pageNumber = totalPages - 5 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                className="w-8"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber + 1}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const totalPrice = product.base_price * (1 + (product.tax?.tax_rate || 0));
  
  return (
    <Card className="h-full overflow-hidden" data-testid={`card-product-${product.ean}`}>
      {product.image_url && (
        <div className="aspect-square w-full overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.title}
            className="w-full h-full object-cover"
            data-testid={`img-product-${product.ean}`}
            loading="lazy"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight" data-testid={`text-title-${product.ean}`}>
            {product.title}
          </CardTitle>
          <Badge variant={product.is_active ? "default" : "secondary"}>
            {product.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <CardDescription data-testid={`text-description-${product.ean}`}>
          {product.description || "Sin descripción"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">EAN</div>
            <div data-testid={`text-ean-${product.ean}`}>{product.ean}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Ref</div>
            <div data-testid={`text-ref-${product.ean}`}>{product.ref || "N/A"}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Medida</div>
            <div data-testid={`text-measure-${product.ean}`}>
              {product.quantity_measure} {product.unit_of_measure}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">IVA</div>
            <div data-testid={`text-tax-${product.ean}`}>
              {product.tax?.name} ({(product.tax?.tax_rate || 0) * 100}%)
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground">Precio base</div>
              <div className="text-lg font-medium" data-testid={`text-base-price-${product.ean}`}>
                €{product.base_price.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Precio final</div>
              <div className="text-xl font-bold text-primary" data-testid={`text-final-price-${product.ean}`}>
                €{totalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para crear pedidos directos (sin orden de compra previa)
function CreateDirectOrderForm({ 
  users, 
  stores, 
  onSuccess 
}: { 
  users: User[]; 
  stores: Store[]; 
  onSuccess: () => void;
}) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const createDirectOrderMutation = useMutation({
    mutationFn: ({ userEmail, storeId }: { userEmail: string; storeId: string }) => 
      createDirectOrder(userEmail, storeId),
    onSuccess: () => {
      toast({
        title: "Pedido directo creado",
        description: "Nuevo pedido creado correctamente sin orden de compra previa",
      });
      onSuccess();
      setSelectedUser("");
      setSelectedStore("");
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el pedido directo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && selectedStore) {
      createDirectOrderMutation.mutate({ userEmail: selectedUser, storeId: selectedStore });
    }
  };

  const availableUsers = users.filter(user => user.is_active);
  const availableStores = stores.filter(store => store.is_active);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-direct-order">
          <Plus className="h-4 w-4 mr-2" />
          Crear Pedido Directo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Pedido Directo</DialogTitle>
          <DialogDescription>
            Crea un nuevo pedido sin necesidad de orden de compra previa
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user">Usuario</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.email} value={user.email}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableUsers.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No hay usuarios activos disponibles
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="store">Tienda</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tienda..." />
              </SelectTrigger>
              <SelectContent>
                {availableStores.map((store) => (
                  <SelectItem key={store.code} value={store.code}>
                    {store.name} ({store.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableStores.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No hay tiendas activas disponibles
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedUser || !selectedStore || createDirectOrderMutation.isPending}
              data-testid="button-submit-direct-order"
            >
              {createDirectOrderMutation.isPending ? "Creando..." : "Crear Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Products() {
  // Tab state
  const [activeTab, setActiveTab] = useState("products");
  
  // Common timestamp for all entities
  const [timestampOffset, setTimestampOffset] = useState('');
  
  // Entity generation states
  const [productCount, setProductCount] = useState(10);
  const [deliveryCentersCount, setDeliveryCentersCount] = useState(2);
  const [storesPerCenter, setStoresPerCenter] = useState(2);
  const [usersPerStore, setUsersPerStore] = useState(2);
  const [purchaseOrdersCount, setPurchaseOrdersCount] = useState(10);
  const [ordersCount, setOrdersCount] = useState(10);
  
  // Pagination states
  const [currentPageProducts, setCurrentPageProducts] = useState(0);
  const [currentPageCenters, setCurrentPageCenters] = useState(0);
  const [currentPageStores, setCurrentPageStores] = useState(0);
  const [currentPageUsers, setCurrentPageUsers] = useState(0);
  const [currentPagePurchaseOrders, setCurrentPagePurchaseOrders] = useState(0);
  const [currentPageOrders, setCurrentPageOrders] = useState(0);
  const [currentPageTaxes, setCurrentPageTaxes] = useState(0);
  const pageSize = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal state for purchase order items
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<string | null>(null);
  const [isOrderItemsModalOpen, setIsOrderItemsModalOpen] = useState(false);

  // Data queries for all entities with pagination
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products", currentPageProducts],
    queryFn: fetchProducts,
  });

  const { data: centersData, isLoading: centersLoading } = useQuery({
    queryKey: ["delivery-centers", currentPageCenters],
    queryFn: () => fetchDeliveryCenters(pageSize, currentPageCenters * pageSize),
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["stores", currentPageStores],
    queryFn: () => fetchStores(pageSize, currentPageStores * pageSize),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", currentPageUsers],
    queryFn: () => fetchUsers(pageSize, currentPageUsers * pageSize),
  });

  const { data: purchaseOrdersData, isLoading: purchaseOrdersLoading } = useQuery({
    queryKey: ["purchase-orders", currentPagePurchaseOrders],
    queryFn: () => fetchPurchaseOrders(pageSize, currentPagePurchaseOrders * pageSize),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", currentPageOrders],
    queryFn: () => fetchOrders(pageSize, currentPageOrders * pageSize),
  });

  const { data: taxesData, isLoading: taxesLoading } = useQuery({
    queryKey: ["taxes", currentPageTaxes],
    queryFn: () => fetchTaxes(pageSize, currentPageTaxes * pageSize),
  });

  // Query for purchase order items when modal is open
  const { data: purchaseOrderItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["purchase-order-items", selectedPurchaseOrderId],
    queryFn: () => selectedPurchaseOrderId ? fetchPurchaseOrderItems(selectedPurchaseOrderId) : Promise.resolve([]),
    enabled: !!selectedPurchaseOrderId && isOrderItemsModalOpen,
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllProducts,
    onSuccess: (result) => {
      toast({
        title: "Productos eliminados",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar productos",
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ count, timestamp }: { count: number; timestamp?: string }) => 
      generateRandomProducts(count, timestamp),
    onSuccess: (result) => {
      toast({
        title: "Productos generados",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar productos",
        variant: "destructive",
      });
    },
  });

  // Delete mutations for all entities
  const deleteAllCentersMutation = useMutation({
    mutationFn: deleteAllDeliveryCenters,
    onSuccess: (result) => {
      toast({
        title: "Centros eliminados",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar centros",
        variant: "destructive",
      });
    },
  });

  const deleteAllStoresMutation = useMutation({
    mutationFn: deleteAllStores,
    onSuccess: (result) => {
      toast({
        title: "Tiendas eliminadas",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar tiendas",
        variant: "destructive",
      });
    },
  });

  const deleteAllUsersMutation = useMutation({
    mutationFn: deleteAllUsers,
    onSuccess: (result) => {
      toast({
        title: "Usuarios eliminados",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar usuarios",
        variant: "destructive",
      });
    },
  });

  const deleteAllPurchaseOrdersMutation = useMutation({
    mutationFn: deleteAllPurchaseOrders,
    onSuccess: (result) => {
      toast({
        title: "Órdenes de compra eliminadas",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar órdenes de compra",
        variant: "destructive",
      });
    },
  });

  const deleteAllOrdersMutation = useMutation({
    mutationFn: deleteAllOrders,
    onSuccess: (result) => {
      toast({
        title: "Pedidos eliminados",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar pedidos",
        variant: "destructive",
      });
    },
  });

  // Individual delete functions
  const deletePurchaseOrder = async (purchase_order_id: string) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Apollo-Require-Preflight": "true",
      },
      body: JSON.stringify({
        query: `
          mutation DeletePurchaseOrder($purchase_order_id: String!) {
            deletePurchaseOrder(purchase_order_id: $purchase_order_id)
          }
        `,
        variables: { purchase_order_id },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data.deletePurchaseOrder;
  };

  const deleteOrder = async (order_id: string) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Apollo-Require-Preflight": "true",
      },
      body: JSON.stringify({
        query: `
          mutation DeleteOrder($order_id: String!) {
            deleteOrder(order_id: $order_id)
          }
        `,
        variables: { order_id },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data.deleteOrder;
  };

  const deleteUser = async (email: string) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Apollo-Require-Preflight": "true",
      },
      body: JSON.stringify({
        query: `
          mutation DeleteUser($email: String!) {
            deleteUser(email: $email)
          }
        `,
        variables: { email },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data.deleteUser;
  };

  const deleteStore = async (code: string) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Apollo-Require-Preflight": "true",
      },
      body: JSON.stringify({
        query: `
          mutation DeleteStore($code: String!) {
            deleteStore(code: $code)
          }
        `,
        variables: { code },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data.deleteStore;
  };

  const deleteDeliveryCenter = async (code: string) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Apollo-Require-Preflight": "true",
      },
      body: JSON.stringify({
        query: `
          mutation DeleteDeliveryCenter($code: String!) {
            deleteDeliveryCenter(code: $code)
          }
        `,
        variables: { code },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data.deleteDeliveryCenter;
  };

  const deleteProduct = async (ean: string) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Apollo-Require-Preflight": "true",
      },
      body: JSON.stringify({
        query: `
          mutation DeleteProduct($ean: String!) {
            deleteProduct(ean: $ean)
          }
        `,
        variables: { ean },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    return result.data.deleteProduct;
  };



  // Individual entity generation mutations
  const generateDeliveryCentersMutation = useMutation({
    mutationFn: ({ count, clearExisting, timestampOffset }: { count: number; clearExisting?: boolean; timestampOffset?: string }) => 
      generateDeliveryCenters(count, clearExisting, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Centros de distribución creados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar centros",
        variant: "destructive",
      });
    },
  });

  const generateStoresMutation = useMutation({
    mutationFn: ({ storesPerCenter, clearExisting, timestampOffset }: { storesPerCenter: number; clearExisting?: boolean; timestampOffset?: string }) => 
      generateStores(storesPerCenter, clearExisting, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Tiendas creadas" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar tiendas",
        variant: "destructive",
      });
    },
  });

  const generateUsersMutation = useMutation({
    mutationFn: ({ usersPerStore, clearExisting, timestampOffset }: { usersPerStore: number; clearExisting?: boolean; timestampOffset?: string }) => 
      generateUsers(usersPerStore, clearExisting, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Usuarios creados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar usuarios",
        variant: "destructive",
      });
    },
  });

  const generatePurchaseOrdersMutation = useMutation({
    mutationFn: ({ count, clearExisting, timestampOffset }: { count: number; clearExisting?: boolean; timestampOffset?: string }) => 
      generatePurchaseOrders(count, clearExisting, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Órdenes de compra creadas" : "Error", 
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar órdenes",
        variant: "destructive",
      });
    },
  });

  const generateOrdersMutation = useMutation({
    mutationFn: ({ count, clearExisting, timestampOffset }: { count: number; clearExisting?: boolean; timestampOffset?: string }) => 
      generateOrders(count, clearExisting, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Pedidos creados" : "Error", 
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar pedidos",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating purchase orders


  // Mutation for creating direct orders (without purchase order)
  const createDirectOrderMutation = useMutation({
    mutationFn: ({ userEmail, storeId }: { userEmail: string; storeId: string }) => 
      createDirectOrder(userEmail, storeId),
    onSuccess: (result) => {
      toast({
        title: "Pedido directo creado",
        description: `Nuevo pedido ${result.order_id} creado correctamente sin orden de compra`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el pedido directo",
        variant: "destructive",
      });
    },
  });

  // Delete handlers
  const handleDeleteAllProducts = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODOS los productos? Esta acción no se puede deshacer.")) {
      deleteAllMutation.mutate();
    }
  };

  const handleDeleteAllCenters = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODOS los centros de distribución? Esta acción no se puede deshacer.")) {
      deleteAllCentersMutation.mutate();
    }
  };

  const handleDeleteAllStores = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODAS las tiendas? Esta acción no se puede deshacer.")) {
      deleteAllStoresMutation.mutate();
    }
  };

  const handleDeleteAllUsers = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODOS los usuarios? Esta acción no se puede deshacer.")) {
      deleteAllUsersMutation.mutate();
    }
  };

  const handleDeleteAllPurchaseOrders = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODAS las órdenes de compra? Esta acción no se puede deshacer.")) {
      deleteAllPurchaseOrdersMutation.mutate();
    }
  };

  const handleDeleteAllOrders = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODOS los pedidos? Esta acción no se puede deshacer.")) {
      deleteAllOrdersMutation.mutate();
    }
  };



  const handleGenerateProducts = () => {
    if (productCount <= 0 || productCount > 1000) {
      toast({
        title: "Error",
        description: "El número de productos debe estar entre 1 y 1000",
        variant: "destructive",
      });
      return;
    }

    // Only validate timestamp if provided
    let finalTimestamp = undefined;
    if (timestampOffset && timestampOffset.trim()) {
      const timestamp = new Date(timestampOffset);
      if (isNaN(timestamp.getTime())) {
        toast({
          title: "Error",
          description: "Formato de fecha inválido",
          variant: "destructive",
        });
        return;
      }
      finalTimestamp = timestampOffset;
    }

    generateMutation.mutate({ count: productCount, timestamp: timestampOffset || finalTimestamp });
  };

  if (productsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error al cargar productos</h1>
          <p className="text-muted-foreground mb-4">
            {productsError instanceof Error ? productsError.message : "Error desconocido"}
          </p>
          <Button onClick={() => window.location.reload()} data-testid="button-retry">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Catálogo de Productos
            </h1>
            <p className="text-muted-foreground">
              Sistema de gestión de productos de alimentación con IVA español
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
            variant="outline"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Admin Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Herramientas de Administración</CardTitle>
          <CardDescription>
            Gestión completa de entidades del sistema con validación de dependencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Timestamp */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="space-y-2">
              <Label htmlFor="global-timestamp">Fecha/Hora de Creación (para todas las entidades)</Label>
              <Input
                id="global-timestamp"
                type="datetime-local"
                value={timestampOffset ? timestampOffset.slice(0, 16) : ''}
                onChange={(e) => setTimestampOffset(e.target.value ? new Date(e.target.value).toISOString() : '')}
                placeholder="Usa el momento actual si se deja vacío"
                data-testid="input-global-timestamp"
              />
              <p className="text-xs text-muted-foreground">
                Esta fecha/hora se aplicará a todas las entidades que generes
              </p>
            </div>
          </div>

          {/* Products Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gestión de productos españoles con categorías y marcas auténticas
                </p>
              </div>
              <Button
                onClick={handleDeleteAllProducts}
                variant="destructive"
                size="sm"
                disabled={deleteAllMutation.isPending}
                data-testid="button-delete-all-products"
              >
                {deleteAllMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar Todos
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-count">Cantidad (1-1000)</Label>
                <Input
                  id="product-count"
                  type="number"
                  min="1"
                  max="1000"
                  value={productCount}
                  onChange={(e) => setProductCount(parseInt(e.target.value) || 0)}
                  data-testid="input-product-count"
                  className="w-32"
                />
              </div>
              
              <Button
                onClick={handleGenerateProducts}
                disabled={generateMutation.isPending}
                data-testid="button-generate-products"
              >
                {generateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Productos
              </Button>
            </div>
          </div>

          {/* Delivery Centers Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Centros de Distribución
                </h3>
                <p className="text-sm text-muted-foreground">
                  Centros logísticos sin dependencias requeridas
                </p>
              </div>
              <Button
                onClick={handleDeleteAllCenters}
                variant="destructive"
                size="sm"
                disabled={deleteAllCentersMutation.isPending}
                data-testid="button-delete-all-centers"
              >
                {deleteAllCentersMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar Todos
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-centers-count">Cantidad (1-10)</Label>
                <Input
                  id="delivery-centers-count"
                  type="number"
                  min="1"
                  max="10"
                  value={deliveryCentersCount}
                  onChange={(e) => setDeliveryCentersCount(parseInt(e.target.value) || 0)}
                  data-testid="input-delivery-centers-count"
                  className="w-32"
                />
              </div>
              
              <Button
                onClick={() => generateDeliveryCentersMutation.mutate({ 
                  count: deliveryCentersCount, 
                  timestampOffset 
                })}
                disabled={generateDeliveryCentersMutation.isPending}
                data-testid="button-generate-delivery-centers"
              >
                {generateDeliveryCentersMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Centros
              </Button>
              
              <Button
                onClick={() => generateDeliveryCentersMutation.mutate({ 
                  count: deliveryCentersCount, 
                  clearExisting: true, 
                  timestampOffset 
                })}
                disabled={generateDeliveryCentersMutation.isPending}
                variant="outline"
                data-testid="button-replace-delivery-centers"
              >
                Reemplazar Existentes
              </Button>
            </div>
          </div>

          {/* Stores Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Tiendas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Requiere centros de distribución existentes
                </p>
              </div>
              <Button
                onClick={handleDeleteAllStores}
                variant="destructive"
                size="sm"
                disabled={deleteAllStoresMutation.isPending}
                data-testid="button-delete-all-stores"
              >
                {deleteAllStoresMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar Todas
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="stores-per-center">Por Centro (1-5)</Label>
                <Input
                  id="stores-per-center"
                  type="number"
                  min="1"
                  max="5"
                  value={storesPerCenter}
                  onChange={(e) => setStoresPerCenter(parseInt(e.target.value) || 0)}
                  data-testid="input-stores-per-center"
                  className="w-32"
                />
              </div>
              
              <Button
                onClick={() => generateStoresMutation.mutate({ 
                  storesPerCenter, 
                  timestampOffset 
                })}
                disabled={generateStoresMutation.isPending}
                data-testid="button-generate-stores"
              >
                {generateStoresMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Tiendas
              </Button>
              
              <Button
                onClick={() => generateStoresMutation.mutate({ 
                  storesPerCenter, 
                  clearExisting: true, 
                  timestampOffset 
                })}
                disabled={generateStoresMutation.isPending}
                variant="outline"
                data-testid="button-replace-stores"
              >
                Reemplazar Existentes
              </Button>
            </div>
          </div>

          {/* Users Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </h3>
                <p className="text-sm text-muted-foreground">
                  Personal de tiendas - requiere tiendas existentes
                </p>
              </div>
              <Button
                onClick={handleDeleteAllUsers}
                variant="destructive"
                size="sm"
                disabled={deleteAllUsersMutation.isPending}
                data-testid="button-delete-all-users"
              >
                {deleteAllUsersMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar Todos
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="users-per-store">Por Tienda (1-5)</Label>
                <Input
                  id="users-per-store"
                  type="number"
                  min="1"
                  max="5"
                  value={usersPerStore}
                  onChange={(e) => setUsersPerStore(parseInt(e.target.value) || 0)}
                  data-testid="input-users-per-store"
                  className="w-32"
                />
              </div>
              
              <Button
                onClick={() => generateUsersMutation.mutate({ 
                  usersPerStore, 
                  timestampOffset 
                })}
                disabled={generateUsersMutation.isPending}
                data-testid="button-generate-users"
              >
                {generateUsersMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Usuarios
              </Button>
              
              <Button
                onClick={() => generateUsersMutation.mutate({ 
                  usersPerStore, 
                  clearExisting: true, 
                  timestampOffset 
                })}
                disabled={generateUsersMutation.isPending}
                variant="outline"
                data-testid="button-replace-users"
              >
                Reemplazar Existentes
              </Button>
            </div>
          </div>

          {/* Purchase Orders Section - Solo para desarrollo */}
          <div className="p-4 border rounded-lg space-y-4">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Órdenes de Compra (Solo Desarrollo)
              </h3>
              <p className="text-sm text-muted-foreground">
                Generación de datos de prueba - requiere usuarios existentes
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-orders-count">Cantidad (1-50)</Label>
                <Input
                  id="purchase-orders-count"
                  type="number"
                  min="1"
                  max="50"
                  value={purchaseOrdersCount}
                  onChange={(e) => setPurchaseOrdersCount(parseInt(e.target.value) || 0)}
                  data-testid="input-purchase-orders-count"
                  className="w-32"
                />
              </div>
              
              <Button
                onClick={() => generatePurchaseOrdersMutation.mutate({ 
                  count: purchaseOrdersCount, 
                  timestampOffset 
                })}
                disabled={generatePurchaseOrdersMutation.isPending}
                data-testid="button-generate-purchase-orders"
              >
                {generatePurchaseOrdersMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Órdenes
              </Button>
              
              <Button
                onClick={() => generatePurchaseOrdersMutation.mutate({ 
                  count: purchaseOrdersCount, 
                  clearExisting: true, 
                  timestampOffset 
                })}
                disabled={generatePurchaseOrdersMutation.isPending}
                variant="outline"
                data-testid="button-replace-purchase-orders"
              >
                Reemplazar Existentes
              </Button>
            </div>
          </div>

          {/* Orders Generation Section */}
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
            <div className="mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pedidos (Solo Desarrollo)
              </h3>
              <p className="text-sm text-muted-foreground">
                Generación de pedidos procesados - requiere usuarios existentes
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="orders-count">Cantidad (1-50)</Label>
                <Input
                  id="orders-count"
                  type="number"
                  min="1"
                  max="50"
                  value={ordersCount}
                  onChange={(e) => setOrdersCount(parseInt(e.target.value) || 0)}
                  data-testid="input-orders-count"
                  className="w-32"
                />
              </div>
              
              <Button
                onClick={() => generateOrdersMutation.mutate({ 
                  count: ordersCount, 
                  timestampOffset 
                })}
                disabled={generateOrdersMutation.isPending}
                data-testid="button-generate-orders"
              >
                {generateOrdersMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Pedidos
              </Button>
              
              <Button
                onClick={() => generateOrdersMutation.mutate({ 
                  count: ordersCount, 
                  clearExisting: true, 
                  timestampOffset 
                })}
                disabled={generateOrdersMutation.isPending}
                variant="outline"
                data-testid="button-replace-orders"
              >
                Reemplazar Existentes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entities Data Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="delivery-centers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Centros</span>
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>Tiendas</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Órdenes Compra</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Impuestos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos ({productsData?.total || 0})
              </CardTitle>
              <CardDescription>
                Catálogo completo de productos de alimentación con información de precios e IVA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : productsData?.products.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>EAN</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio Base</TableHead>
                      <TableHead>IVA</TableHead>
                      <TableHead>Precio Final</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData.products.map((product) => {
                      const finalPrice = product.base_price * (1 + (product.tax?.tax_rate || 0));
                      return (
                        <TableRow key={product.ean}>
                          <TableCell className="font-mono">{product.ean}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.quantity_measure} {product.unit_of_measure}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>€{product.base_price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.tax?.name} ({((product.tax?.tax_rate || 0) * 100).toFixed(0)}%)
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">€{finalPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.is_active ? "default" : "secondary"}
                              className="cursor-pointer hover:bg-opacity-80"
                              onClick={async () => {
                                try {
                                  await toggleProductStatus(product.ean);
                                  queryClient.invalidateQueries({ queryKey: ["products"] });
                                } catch (error) {
                                  console.error('Error toggling product status:', error);
                                }
                              }}
                              data-testid={`badge-toggle-product-${product.ean}`}
                            >
                              {product.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`¿Estás seguro de que quieres eliminar el producto ${product.title}?`)) {
                                  try {
                                    await deleteProduct(product.ean);
                                    queryClient.invalidateQueries({ queryKey: ["products"] });
                                  } catch (error) {
                                    console.error('Error deleting product:', error);
                                  }
                                }
                              }}
                              data-testid={`button-delete-product-${product.ean}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay productos disponibles</p>
                </div>
              )}
              
              {/* Paginación para productos */}
              {productsData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPageProducts}
                    totalItems={productsData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPageProducts}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery-centers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Centros de Distribución ({centersData?.total || 0})
              </CardTitle>
              <CardDescription>
                Centros de distribución para la gestión logística
              </CardDescription>
            </CardHeader>
            <CardContent>
              {centersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : centersData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Información</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centersData.data.map((center) => (
                      <TableRow key={center.code}>
                        <TableCell className="font-mono">{center.code}</TableCell>
                        <TableCell className="font-medium">{center.name}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Badge variant="default">Activo</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(center.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de que quieres eliminar el centro ${center.name}?`)) {
                                try {
                                  await deleteDeliveryCenter(center.code);
                                  queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
                                } catch (error) {
                                  console.error('Error deleting delivery center:', error);
                                }
                              }
                            }}
                            data-testid={`button-delete-center-${center.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay centros de distribución disponibles</p>
                </div>
              )}
              
              {/* Paginación para centros */}
              {centersData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPageCenters}
                    totalItems={centersData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPageCenters}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Tiendas ({storesData?.total || 0})
              </CardTitle>
              <CardDescription>
                Red de tiendas vinculadas a centros de distribución
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : storesData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Centro/Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storesData.data.map((store) => (
                      <TableRow key={store.code}>
                        <TableCell className="font-mono">{store.code}</TableCell>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{store.deliveryCenter?.name || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">
                              {store.responsible_email || "Sin responsable"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={store.is_active ? "default" : "secondary"}
                            className="cursor-pointer hover:bg-opacity-80"
                            onClick={async () => {
                              try {
                                await toggleStoreStatus(store.code);
                                queryClient.invalidateQueries({ queryKey: ["stores"] });
                              } catch (error) {
                                console.error('Error toggling store status:', error);
                              }
                            }}
                            data-testid={`badge-toggle-store-${store.code}`}
                          >
                            {store.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(store.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de que quieres eliminar la tienda ${store.name}?`)) {
                                try {
                                  await deleteStore(store.code);
                                  queryClient.invalidateQueries({ queryKey: ["stores"] });
                                } catch (error) {
                                  console.error('Error deleting store:', error);
                                }
                              }
                            }}
                            data-testid={`button-delete-store-${store.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay tiendas disponibles</p>
                </div>
              )}
              
              {/* Paginación para tiendas */}
              {storesData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPageStores}
                    totalItems={storesData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPageStores}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios ({usersData?.total || 0})
              </CardTitle>
              <CardDescription>
                Personal de tiendas con acceso al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : usersData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.data.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell className="font-mono text-sm">{user.email.slice(0, 10)}...</TableCell>
                        <TableCell className="font-medium">{user.name || "Sin nombre"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.store?.name || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.store_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Usuario</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.is_active ? "default" : "secondary"}
                            className="cursor-pointer hover:bg-opacity-80"
                            onClick={async () => {
                              try {
                                await toggleUserStatus(user.email);
                                queryClient.invalidateQueries({ queryKey: ["users"] });
                              } catch (error) {
                                console.error('Error toggling user status:', error);
                              }
                            }}
                            data-testid={`badge-toggle-user-${user.email}`}
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de que quieres eliminar el usuario ${user.name || user.email}?`)) {
                                try {
                                  await deleteUser(user.email);
                                  queryClient.invalidateQueries({ queryKey: ["users"] });
                                } catch (error) {
                                  console.error('Error deleting user:', error);
                                }
                              }
                            }}
                            data-testid={`button-delete-user-${user.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay usuarios disponibles</p>
                </div>
              )}
              
              {/* Paginación para usuarios */}
              {usersData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPageUsers}
                    totalItems={usersData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPageUsers}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Órdenes de Compra ({purchaseOrdersData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Órdenes de compra realizadas por los usuarios
                  </CardDescription>
                </div>
                <Button
                  onClick={handleDeleteAllPurchaseOrders}
                  variant="destructive"
                  size="sm"
                  disabled={deleteAllPurchaseOrdersMutation.isPending}
                  data-testid="button-delete-all-purchase-orders-tab"
                >
                  {deleteAllPurchaseOrdersMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Eliminar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {purchaseOrdersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : purchaseOrdersData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrdersData.data.map((order) => (
                      <TableRow key={order.purchase_order_id}>
                        <TableCell className="font-mono text-sm">{order.purchase_order_id.slice(-8)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user?.name || "Sin nombre"}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.user?.email || order.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{order.user?.store?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'pending' ? "secondary" : order.status === 'completed' ? "default" : "destructive"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">€{order.final_total.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPurchaseOrderId(order.purchase_order_id);
                                setIsOrderItemsModalOpen(true);
                              }}
                              data-testid={`button-view-items-${order.purchase_order_id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`¿Estás seguro de que quieres eliminar la orden ${order.purchase_order_id.slice(-8)}?`)) {
                                  try {
                                    await deletePurchaseOrder(order.purchase_order_id);
                                    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
                                  } catch (error) {
                                    console.error('Error deleting purchase order:', error);
                                  }
                                }
                              }}
                              data-testid={`button-delete-purchase-order-${order.purchase_order_id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay órdenes de compra disponibles</p>
                </div>
              )}
              
              {/* Paginación para órdenes de compra */}
              {purchaseOrdersData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPagePurchaseOrders}
                    totalItems={purchaseOrdersData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPagePurchaseOrders}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pedidos ({ordersData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Pedidos procesados del sistema (con o sin orden de compra previa)
                  </CardDescription>
                </div>
                <Button
                  onClick={handleDeleteAllOrders}
                  variant="destructive"
                  size="sm"
                  disabled={deleteAllOrdersMutation.isPending}
                  data-testid="button-delete-all-orders"
                >
                  {deleteAllOrdersMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Eliminar Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : ordersData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Orden de Compra</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData.data.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell className="font-mono text-sm">{order.order_id?.slice(-8) || 'N/A'}</TableCell>
                        <TableCell>
                          {order.source_purchase_order_id ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {order.source_purchase_order_id.slice(-8)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Directo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user?.name || "Sin nombre"}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.user?.email || order.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{order.user?.store?.name || order.store_id}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm">
                            {order.observations || "Sin observaciones"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">€{order.final_total?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-view-order-${order.order_id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalles del Pedido: {order.order_id}</DialogTitle>
                                  <DialogDescription>
                                    Información completa del pedido y sus líneas de productos
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  {/* Order Information */}
                                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                                    <div>
                                      <h4 className="font-semibold">Información General</h4>
                                      <div className="text-sm space-y-1 mt-2">
                                        <div><span className="font-medium">ID:</span> {order.order_id}</div>
                                        <div><span className="font-medium">Usuario:</span> {order.user?.name || "Sin nombre"} ({order.user?.email})</div>
                                        <div><span className="font-medium">Tienda:</span> {order.user?.store?.name || order.store_id}</div>
                                        <div><span className="font-medium">Fecha:</span> {new Date(order.created_at).toLocaleDateString('es-ES')}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Totales</h4>
                                      <div className="text-sm space-y-1 mt-2">
                                        <div><span className="font-medium">Subtotal:</span> €{order.subtotal?.toFixed(2) || '0.00'}</div>
                                        <div><span className="font-medium">IVA:</span> €{order.tax_total?.toFixed(2) || '0.00'}</div>
                                        <div><span className="font-medium text-lg">Total:</span> <span className="text-lg">€{order.final_total?.toFixed(2) || '0.00'}</span></div>
                                        {order.observations && (
                                          <div><span className="font-medium">Observaciones:</span> {order.observations}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Order Items */}
                                  <div>
                                    <h4 className="font-semibold mb-3">Líneas del Pedido</h4>
                                    <OrderItemsTable orderId={order.order_id} />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`¿Estás seguro de que quieres eliminar el pedido ${order.order_id?.slice(-8) || 'N/A'}?`)) {
                                  try {
                                    await deleteOrder(order.order_id);
                                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                                  } catch (error) {
                                    console.error('Error deleting order:', error);
                                  }
                                }
                              }}
                              data-testid={`button-delete-order-${order.order_id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay pedidos disponibles</p>
                </div>
              )}
              
              {/* Paginación para pedidos */}
              {ordersData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPageOrders}
                    totalItems={ordersData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPageOrders}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Impuestos ({taxesData?.total || 0})
              </CardTitle>
              <CardDescription>
                Tipos de IVA españoles configurados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taxesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : taxesData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tasa</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxesData.data.map((tax) => (
                      <TableRow key={tax.code}>
                        <TableCell className="font-mono">{tax.code}</TableCell>
                        <TableCell className="font-medium">{tax.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(tax.tax_rate * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Badge variant="default">Activo</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tax.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay impuestos configurados</p>
                </div>
              )}
              
              {/* Paginación para impuestos */}
              {taxesData && (
                <div className="mt-4">
                  <PaginationComponent 
                    currentPage={currentPageTaxes}
                    totalItems={taxesData.total}
                    pageSize={pageSize}
                    onPageChange={setCurrentPageTaxes}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para ver líneas de pedido */}
      <Dialog open={isOrderItemsModalOpen} onOpenChange={setIsOrderItemsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Líneas de Pedido</DialogTitle>
            <DialogDescription>
              Orden: {selectedPurchaseOrderId?.slice(-8) || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          {itemsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : purchaseOrderItems && purchaseOrderItems.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>EAN</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Total Línea</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrderItems.map((item) => {
                    const lineTotal = item.quantity * item.base_price_at_order * (1 + item.tax_rate_at_order);
                    return (
                      <TableRow key={item.item_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.item_title || 'Producto'}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.item_title || 'Sin título'}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.unit_of_measure || 'unidad'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.item_ean}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>€{item.base_price_at_order.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">€{lineTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="flex justify-end pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: €{purchaseOrderItems.reduce((sum, item) => {
                    const lineTotal = item.quantity * item.base_price_at_order * (1 + item.tax_rate_at_order);
                    return sum + lineTotal;
                  }, 0).toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay líneas de pedido para esta orden</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsOrderItemsModalOpen(false);
                setSelectedPurchaseOrderId(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}