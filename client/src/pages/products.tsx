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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Trash2, Plus, RefreshCw, Building2, Store, Users, FileText, Receipt, ChevronLeft, ChevronRight, Eye, Settings } from "lucide-react";
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
  created_at: string;
  updated_at: string;
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
  final_total: number;
  server_sent_at?: string;
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
  source_purchase_order_id: string;
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
  sourcePurchaseOrder?: {
    purchase_order_id: string;
    status: string;
  };
}

interface Tax {
  code: string;
  name: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrderItem {
  item_id: string;
  purchase_order_id: string;
  item_ean: string;
  item_title: string | null;
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
  unit_of_measure: string | null;
  image_url: string | null;
}

interface EntitiesResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

interface PaginationComponentProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// Simple pagination component
function PaginationComponent({ currentPage, totalItems, pageSize, onPageChange }: PaginationComponentProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Página {currentPage + 1} de {totalPages} ({totalItems} registros)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
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

// Fetch functions for all entities
async function fetchProductsPaginated(page: number, pageSize: number): Promise<ProductsResponse> {
  const offset = page * pageSize;
  const query = `
    query GetProducts($limit: Int, $offset: Int) {
      products(limit: $limit, offset: $offset) {
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
          created_at
          updated_at
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
    body: JSON.stringify({ 
      query,
      variables: { limit: pageSize, offset }
    }),
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

async function fetchProducts(): Promise<ProductsResponse> {
  return fetchProductsPaginated(0, 20);
}

async function fetchDeliveryCentersPaginated(offset: number, limit: number): Promise<EntitiesResponse<DeliveryCenter>> {
  const query = `
    query GetDeliveryCenters($limit: Int, $offset: Int) {
      deliveryCenters(limit: $limit, offset: $offset) {
        deliveryCenters {
          code
          name
          is_active
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
    data: result.data.deliveryCenters.deliveryCenters,
    total: result.data.deliveryCenters.total,
    limit: result.data.deliveryCenters.limit,
    offset: result.data.deliveryCenters.offset
  };
}

async function fetchDeliveryCenters(): Promise<EntitiesResponse<DeliveryCenter>> {
  return fetchDeliveryCentersPaginated(0, 20);
}

async function fetchStoresPaginated(offset: number, limit: number): Promise<EntitiesResponse<Store>> {
  const query = `
    query GetStores($limit: Int, $offset: Int) {
      stores(limit: $limit, offset: $offset) {
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
    data: result.data.stores.stores,
    total: result.data.stores.total,
    limit: result.data.stores.limit,
    offset: result.data.stores.offset
  };
}

async function fetchStores(): Promise<EntitiesResponse<Store>> {
  return fetchStoresPaginated(0, 20);
}

async function fetchUsersPaginated(offset: number, limit: number): Promise<EntitiesResponse<User>> {
  const query = `
    query GetUsers($limit: Int, $offset: Int) {
      users(limit: $limit, offset: $offset) {
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
    data: result.data.users.users,
    total: result.data.users.total,
    limit: result.data.users.limit,
    offset: result.data.users.offset
  };
}

async function fetchUsers(): Promise<EntitiesResponse<User>> {
  return fetchUsersPaginated(0, 20);
}

async function fetchPurchaseOrdersPaginated(offset: number, limit: number): Promise<EntitiesResponse<PurchaseOrder>> {
  const query = `
    query GetPurchaseOrders($limit: Int, $offset: Int) {
      purchaseOrders(limit: $limit, offset: $offset) {
        purchaseOrders {
          purchase_order_id
          user_email
          store_id
          status
          final_total
          server_sent_at
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
    data: result.data.purchaseOrders.purchaseOrders,
    total: result.data.purchaseOrders.total,
    limit: result.data.purchaseOrders.limit,
    offset: result.data.purchaseOrders.offset
  };
}

async function fetchPurchaseOrders(): Promise<EntitiesResponse<PurchaseOrder>> {
  return fetchPurchaseOrdersPaginated(0, 20);
}

async function fetchOrdersPaginated(offset: number, limit: number): Promise<EntitiesResponse<Order>> {
  const query = `
    query GetOrders($limit: Int, $offset: Int) {
      orders(limit: $limit, offset: $offset) {
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
    data: result.data.orders.orders,
    total: result.data.orders.total,
    limit: result.data.orders.limit,
    offset: result.data.orders.offset
  };
}

async function fetchOrders(): Promise<EntitiesResponse<Order>> {
  return fetchOrdersPaginated(0, 20);
}

async function fetchTaxesPaginated(offset: number, limit: number): Promise<EntitiesResponse<Tax>> {
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
    data: result.data.taxes.taxes || [],
    total: result.data.taxes.total || 0,
    limit: result.data.taxes.limit || limit,
    offset: result.data.taxes.offset || offset
  };
}

async function fetchTaxes(): Promise<EntitiesResponse<Tax>> {
  return fetchTaxesPaginated(0, 20);
}

// Functions for generating random data
async function generateProducts(count: number, timestampOffset?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GenerateRandomProducts($count: Int!, $timestampOffset: String) {
          generateRandomProducts(count: $count, timestampOffset: $timestampOffset) {
            success
            message
          }
        }
      `,
      variables: { count, timestampOffset },
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

async function generateDeliveryCenters(count: number, clearExisting?: boolean, timestampOffset?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GenerateDeliveryCenters($count: Int!, $clearExisting: Boolean, $timestampOffset: String) {
          generateDeliveryCenters(count: $count, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
            success
            entityType
            createdCount
            message
          }
        }
      `,
      variables: { count, clearExisting, timestampOffset },
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

async function generateTaxes(clearExisting?: boolean, timestampOffset?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GenerateTaxes($clearExisting: Boolean, $timestampOffset: String) {
          generateTaxes(clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
            success
            message
          }
        }
      `,
      variables: { clearExisting, timestampOffset },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.generateTaxes;
}

async function generateStores(storesPerCenter: number, clearExisting?: boolean, timestampOffset?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GenerateStores($storesPerCenter: Int!, $clearExisting: Boolean, $timestampOffset: String) {
          generateStores(storesPerCenter: $storesPerCenter, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
            success
            entityType
            createdCount
            message
          }
        }
      `,
      variables: { storesPerCenter, clearExisting, timestampOffset },
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

async function generateUsers(usersPerStore: number, clearExisting?: boolean, timestampOffset?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GenerateUsers($usersPerStore: Int!, $clearExisting: Boolean, $timestampOffset: String) {
          generateUsers(usersPerStore: $usersPerStore, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
            success
            entityType
            createdCount
            message
          }
        }
      `,
      variables: { usersPerStore, clearExisting, timestampOffset },
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

async function generatePurchaseOrders(count: number, clearExisting?: boolean, timestampOffset?: string, autoSimulate = false): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GeneratePurchaseOrders($count: Int!, $clearExisting: Boolean, $timestampOffset: String, $autoSimulate: Boolean) {
          generatePurchaseOrders(count: $count, clearExisting: $clearExisting, timestampOffset: $timestampOffset, autoSimulate: $autoSimulate) {
            success
            message
          }
        }
      `,
      variables: { count, clearExisting, timestampOffset, autoSimulate },
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

async function generateOrders(count: number, clearExisting?: boolean, timestampOffset?: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation GenerateOrders($count: Int!, $clearExisting: Boolean, $timestampOffset: String) {
          generateOrders(count: $count, clearExisting: $clearExisting, timestampOffset: $timestampOffset) {
            success
            message
          }
        }
      `,
      variables: { count, clearExisting, timestampOffset },
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

async function deleteAllData(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
    body: JSON.stringify({
      query: `
        mutation DeleteAllData {
          deleteAllData {
            success
            message
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  return result.data.deleteAllData;
}

// Fetch order details
async function fetchPurchaseOrderItems(purchaseOrderId: string) {
  const query = `
    query GetPurchaseOrderItems($purchase_order_id: String!) {
      purchaseOrderItems(purchase_order_id: $purchase_order_id) {
        item_ean
        item_ref
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

  return result.data.purchaseOrderItems;
}

async function fetchOrderItems(orderId: string) {
  const query = `
    query GetOrderItems($order_id: String!) {
      orderItems(order_id: $order_id) {
        item_ean
        item_ref
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

  return result.data.orderItems;
}

// Order Details Component
interface OrderDetailsContentProps {
  order: PurchaseOrder | Order;
  orderType: 'purchase' | 'order';
}

interface OrderItem {
  item_ean: string;
  item_ref: string | null;
  item_title: string;
  item_description: string | null;
  unit_of_measure: string;
  quantity_measure: number;
  image_url: string | null;
  quantity: number;
  base_price_at_order: number;
  tax_rate_at_order: number;
  created_at: string;
  updated_at: string;
}

function OrderDetailsContent({ order, orderType }: OrderDetailsContentProps) {
  const orderId = orderType === 'purchase' 
    ? (order as PurchaseOrder).purchase_order_id 
    : (order as Order).order_id;

  const { data: orderItems, isLoading } = useQuery({
    queryKey: [orderType === 'purchase' ? 'purchase-order-items' : 'order-items', orderId],
    queryFn: () => orderType === 'purchase' 
      ? fetchPurchaseOrderItems(orderId)
      : fetchOrderItems(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!orderItems || orderItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay productos en esta orden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <span className="text-sm text-muted-foreground">ID de Orden:</span>
          <p className="font-mono text-sm">{orderId}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Cliente:</span>
          <p className="font-medium">{order.user?.name}</p>
          <p className="text-sm text-muted-foreground">{order.user?.email}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Tienda:</span>
          <p className="font-medium">{order.user?.store?.name}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Total:</span>
          <p className="font-bold text-lg">€{order.final_total.toFixed(2)}</p>
        </div>
        {orderType === 'purchase' && (
          <div>
            <span className="text-sm text-muted-foreground">Estado:</span>
            <div>
              <Badge variant={(order as PurchaseOrder).status === 'pending' ? 'secondary' : 'default'}>
                {(order as PurchaseOrder).status}
              </Badge>
            </div>
          </div>
        )}
        {orderType === 'order' && (
          <>
            <div>
              <span className="text-sm text-muted-foreground">Subtotal:</span>
              <p className="font-medium">€{(order as Order).subtotal.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">IVA:</span>
              <p className="font-medium">€{(order as Order).tax_total.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Orden Original:</span>
              <p className="font-mono text-sm">{(order as Order).source_purchase_order_id}</p>
            </div>
          </>
        )}
      </div>

      {/* Order Items Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Productos ({orderItems.length})</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>EAN / Ref</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio Unitario</TableHead>
              <TableHead>IVA</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderItems.map((item: OrderItem, index: number) => {
              const lineSubtotal = item.quantity * item.base_price_at_order;
              const lineTax = lineSubtotal * item.tax_rate_at_order;
              const lineTotal = lineSubtotal + lineTax;
              
              return (
                <TableRow key={`${item.item_ean}-${index}`}>
                  <TableCell>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.item_title}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">Sin imagen</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    <div>{item.item_ean}</div>
                    {item.item_ref && (
                      <div className="text-xs text-muted-foreground">Ref: {item.item_ref}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.item_title}</div>
                      {item.item_description && (
                        <div className="text-sm text-muted-foreground">{item.item_description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {item.quantity_measure} {item.unit_of_measure}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>€{item.base_price_at_order.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(item.tax_rate_at_order * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">€{lineTotal.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
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
  
  // Simulación automática de pedidos
  const [autoSimulateOrders, setAutoSimulateOrders] = useState(true);
  
  // Import data states
  const [isImportingAllData, setIsImportingAllData] = useState(false);
  const [isImportingEntity, setIsImportingEntity] = useState<string | null>(null);
  const [importEntityProgress, setImportEntityProgress] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;
  
  // Pagination states for all entities
  const [deliveryCentersPagination, setDeliveryCentersPagination] = useState({ limit: 20, offset: 0 });
  const [storesPagination, setStoresPagination] = useState({ limit: 20, offset: 0 });
  const [usersPagination, setUsersPagination] = useState({ limit: 20, offset: 0 });
  const [purchaseOrdersPagination, setPurchaseOrdersPagination] = useState({ limit: 20, offset: 0 });
  const [ordersPagination, setOrdersPagination] = useState({ limit: 20, offset: 0 });
  const [taxesPagination, setTaxesPagination] = useState({ limit: 20, offset: 0 });
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderType, setOrderType] = useState<'purchase' | 'order'>('purchase');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries for all entities with pagination
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: () => fetchProductsPaginated(currentPage, pageSize),
  });

  const { data: centersData, isLoading: centersLoading } = useQuery({
    queryKey: ["delivery-centers", deliveryCentersPagination.offset, deliveryCentersPagination.limit],
    queryFn: () => fetchDeliveryCentersPaginated(deliveryCentersPagination.offset, deliveryCentersPagination.limit),
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["stores", storesPagination.offset, storesPagination.limit],
    queryFn: () => fetchStoresPaginated(storesPagination.offset, storesPagination.limit),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", usersPagination.offset, usersPagination.limit],
    queryFn: () => fetchUsersPaginated(usersPagination.offset, usersPagination.limit),
  });

  const { data: purchaseOrdersData, isLoading: purchaseOrdersLoading } = useQuery({
    queryKey: ["purchase-orders", purchaseOrdersPagination.offset, purchaseOrdersPagination.limit],
    queryFn: () => fetchPurchaseOrdersPaginated(purchaseOrdersPagination.offset, purchaseOrdersPagination.limit),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", ordersPagination.offset, ordersPagination.limit],
    queryFn: () => fetchOrdersPaginated(ordersPagination.offset, ordersPagination.limit),
  });

  const { data: taxesData, isLoading: taxesLoading } = useQuery({
    queryKey: ["taxes", taxesPagination.offset, taxesPagination.limit],
    queryFn: () => fetchTaxesPaginated(taxesPagination.offset, taxesPagination.limit),
  });

  // Mutations for entity generation
  const generateMutation = useMutation({
    mutationFn: ({ count, timestampOffset }: { count: number; timestampOffset?: string }) => 
      generateProducts(count, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Productos creados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
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
      generatePurchaseOrders(count, clearExisting, timestampOffset, autoSimulateOrders),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Órdenes de compra creadas" : "Error", 
        description: result.message + (autoSimulateOrders ? " (simulación automática activada)" : ""),
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      // Si la simulación está activada también invalidar orders
      if (autoSimulateOrders) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
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

  const generateTaxesMutation = useMutation({
    mutationFn: ({ clearExisting, timestampOffset }: { clearExisting?: boolean; timestampOffset?: string }) => 
      generateTaxes(clearExisting, timestampOffset),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Impuestos creados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar impuestos",
        variant: "destructive",
      });
    },
  });

  // Delete all mutations for individual entities
  const deleteAllProductsMutation = useMutation({
    mutationFn: async () => {
      const query = `
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar productos");
      }
      return result.data.deleteAllProducts;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Productos eliminados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    }
  });

  const deleteAllTaxesMutation = useMutation({
    mutationFn: async () => {
      const query = `
        mutation DeleteAllTaxes {
          deleteAllTaxes {
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar impuestos");
      }
      return result.data.deleteAllTaxes;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Impuestos eliminados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["taxes"] });
      }
    }
  });

  const deleteAllDeliveryCentersMutation = useMutation({
    mutationFn: async () => {
      const query = `
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar centros");
      }
      return result.data.deleteAllDeliveryCenters;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Centros eliminados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
      }
    }
  });

  const deleteAllStoresMutation = useMutation({
    mutationFn: async () => {
      const query = `
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar tiendas");
      }
      return result.data.deleteAllStores;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Tiendas eliminadas" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["stores"] });
      }
    }
  });

  const deleteAllUsersMutation = useMutation({
    mutationFn: async () => {
      const query = `
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar usuarios");
      }
      return result.data.deleteAllUsers;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Usuarios eliminados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    }
  });

  const deleteAllPurchaseOrdersMutation = useMutation({
    mutationFn: async () => {
      const query = `
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar órdenes");
      }
      return result.data.deleteAllPurchaseOrders;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Órdenes eliminadas" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      }
    }
  });

  const deleteAllOrdersMutation = useMutation({
    mutationFn: async () => {
      const query = `
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
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar pedidos");
      }
      return result.data.deleteAllOrders;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Pedidos eliminados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    }
  });

  // Bulk data generation
  const [isGeneratingBulkData, setIsGeneratingBulkData] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);

  // Delete mutations for all entities
  const deleteProductMutation = useMutation({
    mutationFn: async (ean: string) => {
      const query = `
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
        body: JSON.stringify({ query, variables: { ean } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar producto");
      }
      return result.data.deleteProduct;
    },
    onSuccess: () => {
      toast({ title: "Producto eliminado", description: "El producto se ha eliminado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar producto",
        variant: "destructive" 
      });
    },
  });

  // Toggle active status mutations
  const toggleProductActiveMutation = useMutation({
    mutationFn: async (ean: string) => {
      const query = `
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
          query, 
          variables: { ean } 
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al actualizar producto");
      }
      return result.data.toggleProductStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al actualizar producto",
        variant: "destructive" 
      });
    },
  });

  const toggleStoreActiveMutation = useMutation({
    mutationFn: async (code: string) => {
      const query = `
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
          query, 
          variables: { code } 
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al actualizar tienda");
      }
      return result.data.toggleStoreStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al actualizar tienda",
        variant: "destructive" 
      });
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async (email: string) => {
      const query = `
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
          query, 
          variables: { email } 
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al actualizar usuario");
      }
      return result.data.toggleUserStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al actualizar usuario",
        variant: "destructive" 
      });
    },
  });

  const toggleDeliveryCenterActiveMutation = useMutation({
    mutationFn: async (code: string) => {
      const query = `
        mutation ToggleDeliveryCenterStatus($code: String!) {
          toggleDeliveryCenterStatus(code: $code) {
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
          query, 
          variables: { code } 
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al actualizar centro");
      }
      return result.data.toggleDeliveryCenterStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al actualizar centro",
        variant: "destructive" 
      });
    },
  });

  // Delete mutations for individual entities
  const deleteDeliveryCenterMutation = useMutation({
    mutationFn: async (code: string) => {
      const query = `
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
        body: JSON.stringify({ query, variables: { code } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar centro");
      }
      return result.data.deleteDeliveryCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
      toast({ title: "Centro eliminado", description: "Centro de distribución eliminado exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar centro",
        variant: "destructive" 
      });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (code: string) => {
      const query = `
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
        body: JSON.stringify({ query, variables: { code } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar tienda");
      }
      return result.data.deleteStore;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast({ title: "Tienda eliminada", description: "Tienda eliminada exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar tienda",
        variant: "destructive" 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const query = `
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
        body: JSON.stringify({ query, variables: { email } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar usuario");
      }
      return result.data.deleteUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuario eliminado", description: "Usuario eliminado exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar usuario",
        variant: "destructive" 
      });
    },
  });

  const deletePurchaseOrderMutation = useMutation({
    mutationFn: async (purchaseOrderId: string) => {
      const query = `
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
        body: JSON.stringify({ query, variables: { purchase_order_id: purchaseOrderId } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar orden de compra");
      }
      return result.data.deletePurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Orden eliminada", description: "Orden de compra eliminada exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar orden de compra",
        variant: "destructive" 
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const query = `
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
        body: JSON.stringify({ query, variables: { order_id: orderId } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar pedido");
      }
      return result.data.deleteOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido eliminado", description: "Pedido eliminado exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar pedido",
        variant: "destructive" 
      });
    },
  });

  const deleteTaxMutation = useMutation({
    mutationFn: async (code: string) => {
      const query = `
        mutation DeleteTax($code: String!) {
          deleteTax(code: $code)
        }
      `;
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Apollo-Require-Preflight": "true",
        },
        body: JSON.stringify({ query, variables: { code } }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Error al eliminar impuesto");
      }
      return result.data.deleteTax;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      toast({ title: "Impuesto eliminado", description: "Impuesto eliminado exitosamente" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar impuesto",
        variant: "destructive" 
      });
    },
  });

  // Delete all data mutation
  const deleteAllDataMutation = useMutation({
    mutationFn: deleteAllData,
    onSuccess: (result) => {
      toast({
        title: result.success ? "Datos eliminados" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar datos",
        variant: "destructive",
      });
    },
  });

  const generateCompleteDataset = async () => {
    setIsGeneratingBulkData(true);
    setProgressMessages([]);
    
    const addProgressMessage = (message: string) => {
      setProgressMessages(prev => [...prev, message]);
    };
    
    try {
      // Step 1: Generate Spanish IVA taxes first
      addProgressMessage("🚀 Generando impuestos IVA españoles...");
      toast({ title: "Iniciando generación masiva", description: "Generando impuestos IVA españoles..." });
      await generateTaxes(true, timestampOffset);
      addProgressMessage("✅ CSV masivo de taxes generado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["taxes"] });

      // Step 2: Generate 1,000 products
      addProgressMessage("🚀 Generando 1,000 productos...");
      toast({ title: "Paso 2/5", description: "Generando 1,000 productos..." });
      const productsResult = await generateProducts(1000, timestampOffset);
      if (!productsResult.success) {
        throw new Error(productsResult.message);
      }
      addProgressMessage("✅ CSV masivo de products generado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["products"] });

      // Step 3: Generate 20 delivery centers
      addProgressMessage("🚀 Generando CSV masivo de delivery centers...");
      toast({ title: "Paso 3/5", description: "Generando 20 centros de distribución..." });
      await generateDeliveryCenters(20, true, timestampOffset);
      addProgressMessage("✅ CSV masivo de delivery centers generado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });

      // Step 4: Generate stores (2 per center = 40 stores)
      addProgressMessage("🚀 Generando CSV masivo de stores...");
      toast({ title: "Paso 4/5", description: "Generando tiendas..." });
      await generateStores(2, true, timestampOffset);
      addProgressMessage("✅ CSV masivo de stores generado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["stores"] });

      // Step 5: Generate users (2 per store = 80 users)
      addProgressMessage("🚀 Generando CSV masivo de users...");
      toast({ title: "Paso 5/5", description: "Generando usuarios..." });
      await generateUsers(2, true, timestampOffset);
      addProgressMessage("✅ CSV masivo de users generado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["users"] });

      addProgressMessage("🎉 ¡Generación completa finalizada!");
      toast({
        title: "¡Datos completos generados!",
        description: "Se han creado 4 impuestos IVA, 1,000 productos, 20 centros, 40 tiendas y 80 usuarios con archivos CSV timestampeados.",
      });

    } catch (error) {
      addProgressMessage("❌ Error durante la generación de datos");
      toast({
        title: "Error en generación masiva",
        description: error instanceof Error ? error.message : "Error durante la generación de datos",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBulkData(false);
    }
  };

  // Import all data from SFTP
  const importAllDataFromSFTP = async () => {
    setIsImportingAllData(true);
    setProgressMessages([]);
    
    const addProgressMessage = (message: string) => {
      setProgressMessages(prev => [...prev, message]);
    };
    
    try {
      addProgressMessage("🚀 Iniciando importación masiva desde SFTP...");
      toast({ title: "Importación iniciada", description: "Importando todos los datos desde SFTP Musgrave..." });
      
      // Import entities sequentially with progress updates
      const importOrder = ['taxes', 'deliveryCenters', 'stores', 'users', 'products'];
      let totalRecordsImported = 0;
      
      for (const entityType of importOrder) {
        addProgressMessage(`🚀 Importando ${entityType}...`);
        toast({ title: `Importando ${entityType}`, description: `Procesando archivos CSV de ${entityType}...` });
        
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Apollo-Require-Preflight": "true",
          },
          body: JSON.stringify({
            query: `
              mutation ImportEntityFromSFTP($entityType: String!) {
                importEntityFromSFTP(entityType: $entityType) {
                  success
                  message
                  details
                  importedCount
                }
              }
            `,
            variables: { entityType }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0]?.message || "GraphQL error");
        }

        const importResult = result.data.importEntityFromSFTP;
        
        // Add detailed progress messages from backend
        if (importResult.details) {
          const detailLines = importResult.details.split('\n').filter((line: string) => line.trim());
          detailLines.forEach((line: string) => {
            if (line.trim()) {
              addProgressMessage(line.trim());
            }
          });
        }
        
        if (!importResult.success) {
          throw new Error(`Error importando ${entityType}: ${importResult.message}`);
        }
        
        totalRecordsImported += importResult.importedCount || 0;
        addProgressMessage(`✅ ${entityType} importado correctamente (${importResult.importedCount || 0} registros)`);
      }
      
      addProgressMessage("🎉 ¡Importación masiva completada exitosamente!");
      
      toast({
        title: "¡Importación completada!",
        description: `Todos los datos han sido importados desde SFTP. Total: ${totalRecordsImported} registros.`,
      });
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

    } catch (error) {
      addProgressMessage("❌ Error durante la importación de datos");
      toast({
        title: "Error en importación",
        description: error instanceof Error ? error.message : "Error durante la importación de datos",
        variant: "destructive",
      });
    } finally {
      setIsImportingAllData(false);
    }
  };

  // Import specific entity from SFTP
  const importEntityFromSFTP = async (entityType: string) => {
    setIsImportingEntity(entityType);
    setImportEntityProgress('');
    
    const addProgressMessage = (message: string) => {
      setImportEntityProgress(prev => prev + message + '\n');
    };
    
    try {
      addProgressMessage(`🚀 Importando ${entityType} desde SFTP...`);
      toast({ title: `Importando ${entityType}`, description: `Procesando archivos CSV de ${entityType}...` });
      
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Apollo-Require-Preflight": "true",
        },
        body: JSON.stringify({
          query: `
            mutation ImportEntityFromSFTP($entityType: String!) {
              importEntityFromSFTP(entityType: $entityType) {
                success
                message
                details
                importedCount
              }
            }
          `,
          variables: { entityType }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      const importResult = result.data.importEntityFromSFTP;
      addProgressMessage(importResult.details || importResult.message);
      
      if (importResult.success) {
        addProgressMessage(`✅ ${entityType} importado exitosamente (${importResult.importedCount || 0} registros)`);
        toast({
          title: `¡${entityType} importado!`,
          description: `Se han importado ${importResult.importedCount || 0} registros.`,
        });
        
        // Invalidate relevant queries
        if (entityType === 'products') {
          queryClient.invalidateQueries({ queryKey: ["products"] });
        } else if (entityType === 'delivery-centers') {
          queryClient.invalidateQueries({ queryKey: ["delivery-centers"] });
        } else if (entityType === 'stores') {
          queryClient.invalidateQueries({ queryKey: ["stores"] });
        } else if (entityType === 'users') {
          queryClient.invalidateQueries({ queryKey: ["users"] });
        } else if (entityType === 'taxes') {
          queryClient.invalidateQueries({ queryKey: ["taxes"] });
        }
      } else {
        throw new Error(importResult.message);
      }

    } catch (error) {
      addProgressMessage(`❌ Error importando ${entityType}`);
      toast({
        title: `Error importando ${entityType}`,
        description: error instanceof Error ? error.message : `Error durante la importación de ${entityType}`,
        variant: "destructive",
      });
    } finally {
      setIsImportingEntity(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Sistema PIM Alimentación
        </h1>
        <p className="text-xl text-muted-foreground">
          Gestión completa de productos de alimentación con sincronización de datos en tiempo real
        </p>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>GraphQL API</span>
          <span>•</span>
          <span>PostgreSQL</span>
          <span>•</span>
          <span>React + TypeScript</span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs defaultValue="view-data" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="view-data" className="flex items-center gap-2" data-testid="tab-view-data">
            <Eye className="h-4 w-4" />
            Ver Datos
          </TabsTrigger>
          <TabsTrigger value="import-data" className="flex items-center gap-2" data-testid="tab-import-data">
            <RefreshCw className="h-4 w-4" />
            Importar datos SFTP
          </TabsTrigger>
          <TabsTrigger value="generate-data" className="flex items-center gap-2" data-testid="tab-generate-data">
            <Settings className="h-4 w-4" />
            Generar Datos Aleatorios
          </TabsTrigger>
        </TabsList>

        {/* View Data Tab */}
        <TabsContent value="view-data" className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Productos ({productsData?.total || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="delivery-centers" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Centros ({centersData?.total || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="stores" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>Tiendas ({storesData?.total || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Usuarios ({usersData?.total || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="purchase-orders" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Órdenes Compra ({purchaseOrdersData?.total || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Pedidos ({ordersData?.total || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="taxes" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>Impuestos ({taxesData?.total || 0})</span>
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
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
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Imagen</TableHead>
                            <TableHead>EAN</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Precio Base</TableHead>
                            <TableHead>IVA</TableHead>
                            <TableHead>Precio Final</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead>Actualizado</TableHead>
                            <TableHead className="w-20">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productsData.products.map((product) => {
                            const finalPrice = product.base_price * (1 + (product.tax?.tax_rate || 0));
                            return (
                              <TableRow key={product.ean}>
                                <TableCell>
                                  {product.image_url ? (
                                    <img 
                                      src={product.image_url} 
                                      alt={product.title}
                                      className="w-12 h-12 object-cover rounded"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                      <span className="text-xs text-gray-500">Sin imagen</span>
                                    </div>
                                  )}
                                </TableCell>
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleProductActiveMutation.mutate(product.ean)}
                                    className="h-6"
                                    data-testid={`toggle-active-${product.ean}`}
                                  >
                                    <Badge variant={product.is_active ? "default" : "secondary"}>
                                      {product.is_active ? "Activo" : "Inactivo"}
                                    </Badge>
                                  </Button>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(product.created_at).toLocaleString('es-ES')}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(product.updated_at).toLocaleString('es-ES')}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteProductMutation.mutate(product.ean)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    data-testid={`delete-product-${product.ean}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4">
                        <PaginationComponent
                          currentPage={currentPage}
                          totalItems={productsData.total}
                          pageSize={pageSize}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay productos disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery Centers Tab */}
            <TabsContent value="delivery-centers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Centros de Distribución ({centersData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Centros de distribución para gestión logística
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {centersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : centersData?.data?.length ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead>Actualizado</TableHead>
                            <TableHead className="w-20">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {centersData.data.map((center) => (
                            <TableRow key={center.code}>
                              <TableCell className="font-mono">{center.code}</TableCell>
                              <TableCell className="font-medium">{center.name}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleDeliveryCenterActiveMutation.mutate(center.code)}
                                  className="h-6"
                                  data-testid={`toggle-center-active-${center.code}`}
                                >
                                  <Badge variant={(center as any).is_active ? "default" : "secondary"}>
                                    {(center as any).is_active ? "Activo" : "Inactivo"}
                                  </Badge>
                                </Button>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(center.created_at).toLocaleString('es-ES')}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(center.updated_at).toLocaleString('es-ES')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteDeliveryCenterMutation.mutate(center.code)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  data-testid={`delete-center-${center.code}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4">
                        <PaginationComponent
                          currentPage={Math.floor(deliveryCentersPagination.offset / deliveryCentersPagination.limit)}
                          totalItems={centersData.total}
                          pageSize={deliveryCentersPagination.limit}
                          onPageChange={(page) => setDeliveryCentersPagination({ 
                            ...deliveryCentersPagination, 
                            offset: page * deliveryCentersPagination.limit 
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay centros de distribución configurados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stores Tab */}
            <TabsContent value="stores" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Tiendas ({storesData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Tiendas vinculadas a centros de distribución
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {storesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : storesData?.data?.length ? (
                    <>
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Centro</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Creado</TableHead>
                          <TableHead>Actualizado</TableHead>
                          <TableHead className="w-20">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storesData.data.map((store) => (
                          <TableRow key={store.code}>
                            <TableCell className="font-mono">{store.code}</TableCell>
                            <TableCell className="font-medium">{store.name}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{store.deliveryCenter?.name}</div>
                                <div className="text-sm text-muted-foreground">{store.delivery_center_code}</div>
                              </div>
                            </TableCell>
                            <TableCell>{store.responsible_email}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStoreActiveMutation.mutate(store.code)}
                                className="h-6"
                                data-testid={`toggle-store-active-${store.code}`}
                              >
                                <Badge variant={store.is_active ? "default" : "secondary"}>
                                  {store.is_active ? "Activa" : "Inactiva"}
                                </Badge>
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(store.created_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(store.updated_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteStoreMutation.mutate(store.code)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                data-testid={`delete-store-${store.code}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4">
                      <PaginationComponent
                        currentPage={Math.floor(storesPagination.offset / storesPagination.limit)}
                        totalItems={storesData.total}
                        pageSize={storesPagination.limit}
                        onPageChange={(page) => setStoresPagination({ 
                          ...storesPagination, 
                          offset: page * storesPagination.limit 
                        })}
                      />
                    </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay tiendas configuradas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
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
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : usersData?.data?.length ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tienda</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead>Actualizado</TableHead>
                            <TableHead className="w-20">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersData.data.map((user) => (
                          <TableRow key={user.email}>
                            <TableCell className="font-mono">{user.email}</TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.store?.name}</div>
                                <div className="text-sm text-muted-foreground">{user.store?.code}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserActiveMutation.mutate(user.email)}
                                className="h-6"
                                data-testid={`toggle-user-active-${user.email}`}
                              >
                                <Badge variant={user.is_active ? "default" : "secondary"}>
                                  {user.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.updated_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUserMutation.mutate(user.email)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                data-testid={`delete-user-${user.email}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                      
                      <div className="mt-4">
                        <PaginationComponent
                          currentPage={Math.floor(usersPagination.offset / usersPagination.limit)}
                          totalItems={usersData.total}
                          pageSize={usersPagination.limit}
                          onPageChange={(page) => setUsersPagination({ 
                            ...usersPagination, 
                            offset: page * usersPagination.limit 
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay usuarios configurados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchase Orders Tab */}
            <TabsContent value="purchase-orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Órdenes de Compra ({purchaseOrdersData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Órdenes de compra en proceso de los clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {purchaseOrdersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : purchaseOrdersData?.data?.length ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Tienda</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Enviado al Servidor</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead>Actualizado</TableHead>
                            <TableHead className="w-24">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {purchaseOrdersData.data.map((order) => (
                          <TableRow key={order.purchase_order_id}>
                            <TableCell className="font-mono">{order.purchase_order_id.slice(-8)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.user?.name}</div>
                                <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{order.user?.store?.name}</TableCell>
                            <TableCell>
                              <Badge variant={order.status === 'pending' ? "secondary" : "default"}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">€{order.final_total.toFixed(2)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {order.server_sent_at ? new Date(order.server_sent_at).toLocaleString('es-ES') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.updated_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOrderType('purchase');
                                    setOrderDetailsOpen(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                  data-testid={`view-purchase-order-${order.purchase_order_id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deletePurchaseOrderMutation.mutate(order.purchase_order_id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  data-testid={`delete-purchase-order-${order.purchase_order_id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                      
                      <div className="mt-4">
                        <PaginationComponent
                          currentPage={Math.floor(purchaseOrdersPagination.offset / purchaseOrdersPagination.limit)}
                          totalItems={purchaseOrdersData.total}
                          pageSize={purchaseOrdersPagination.limit}
                          onPageChange={(page) => setPurchaseOrdersPagination({ 
                            ...purchaseOrdersPagination, 
                            offset: page * purchaseOrdersPagination.limit 
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay órdenes de compra</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Pedidos ({ordersData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Pedidos procesados y finalizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : ordersData?.data?.length ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Tienda</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead>IVA</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead>Actualizado</TableHead>
                            <TableHead className="w-24">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {ordersData.data.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-mono">{order.order_id.slice(-8)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.user?.name}</div>
                                <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{order.user?.store?.name}</TableCell>
                            <TableCell>€{order.subtotal.toFixed(2)}</TableCell>
                            <TableCell>€{order.tax_total.toFixed(2)}</TableCell>
                            <TableCell className="font-medium">€{order.final_total.toFixed(2)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.updated_at).toLocaleString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOrderType('order');
                                    setOrderDetailsOpen(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                  data-testid={`view-order-${order.order_id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteOrderMutation.mutate(order.order_id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  data-testid={`delete-order-${order.order_id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                      
                      <div className="mt-4">
                        <PaginationComponent
                          currentPage={Math.floor(ordersPagination.offset / ordersPagination.limit)}
                          totalItems={ordersData.total}
                          pageSize={ordersPagination.limit}
                          onPageChange={(page) => setOrdersPagination({ 
                            ...ordersPagination, 
                            offset: page * ordersPagination.limit 
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay pedidos procesados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Taxes Tab */}
            <TabsContent value="taxes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Impuestos ({taxesData?.total || 0})
                  </CardTitle>
                  <CardDescription>
                    Tipos de IVA aplicables en España
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {taxesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : taxesData?.data?.length ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo IVA</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead>Actualizado</TableHead>
                            <TableHead className="w-20">Acciones</TableHead>
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
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(tax.created_at).toLocaleString('es-ES')}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(tax.updated_at).toLocaleString('es-ES')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTaxMutation.mutate(tax.code)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  data-testid={`delete-tax-${tax.code}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4">
                        <PaginationComponent
                          currentPage={Math.floor(taxesPagination.offset / taxesPagination.limit)}
                          totalItems={taxesData.total}
                          pageSize={taxesPagination.limit}
                          onPageChange={(page) => setTaxesPagination({ 
                            ...taxesPagination, 
                            offset: page * taxesPagination.limit 
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay tipos de IVA configurados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Import Data Tab */}
        <TabsContent value="import-data" className="mt-6">
          <div className="space-y-6">
            {/* Bulk Data Import */}
            <Card className="border-2 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-6 w-6" />
                  Importación Masiva desde SFTP
                </CardTitle>
                <CardDescription>
                  Importa todos los datos desde el servidor SFTP Musgrave en orden correcto: delivery centers, taxes, stores, users y products. Si existen múltiples archivos, se importa desde el más antiguo al más reciente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={importAllDataFromSFTP}
                  disabled={isImportingAllData}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="button-import-all-data"
                >
                  {isImportingAllData ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Importando todos los datos...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Importar Todos los Datos del SFTP
                    </>
                  )}
                </Button>
                {isImportingAllData && (
                  <div className="mt-4 space-y-2">
                    <p className="text-center text-sm text-muted-foreground">
                      Procesando archivos CSV desde el servidor SFTP...
                    </p>
                    {progressMessages.length > 0 && (
                      <div className="bg-muted rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="space-y-1 text-sm">
                          {progressMessages.map((message, index) => (
                            <div key={index} className="font-mono">
                              {message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individual Entity Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Importación Individual de Entidades
                </CardTitle>
                <CardDescription>
                  Importa datos específicos desde el SFTP. Respeta el orden de dependencias para evitar errores de referencia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Delivery Centers Import */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Centros de Distribución</Label>
                    <Button
                      onClick={() => importEntityFromSFTP('delivery-centers')}
                      disabled={isImportingEntity === 'delivery-centers'}
                      variant="outline"
                      className="w-full"
                      data-testid="button-import-delivery-centers"
                    >
                      {isImportingEntity === 'delivery-centers' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 mr-2" />
                          Importar Centros
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Taxes Import */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Impuestos IVA</Label>
                    <Button
                      onClick={() => importEntityFromSFTP('taxes')}
                      disabled={isImportingEntity === 'taxes'}
                      variant="outline"
                      className="w-full"
                      data-testid="button-import-taxes"
                    >
                      {isImportingEntity === 'taxes' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Receipt className="h-4 w-4 mr-2" />
                          Importar Impuestos
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Stores Import */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tiendas</Label>
                    <Button
                      onClick={() => importEntityFromSFTP('stores')}
                      disabled={isImportingEntity === 'stores'}
                      variant="outline"
                      className="w-full"
                      data-testid="button-import-stores"
                    >
                      {isImportingEntity === 'stores' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Store className="h-4 w-4 mr-2" />
                          Importar Tiendas
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Users Import */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Usuarios</Label>
                    <Button
                      onClick={() => importEntityFromSFTP('users')}
                      disabled={isImportingEntity === 'users'}
                      variant="outline"
                      className="w-full"
                      data-testid="button-import-users"
                    >
                      {isImportingEntity === 'users' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Importar Usuarios
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Products Import */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Productos</Label>
                    <Button
                      onClick={() => importEntityFromSFTP('products')}
                      disabled={isImportingEntity === 'products'}
                      variant="outline"
                      className="w-full"
                      data-testid="button-import-products"
                    >
                      {isImportingEntity === 'products' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Importar Productos
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {importEntityProgress && (
                  <div className="mt-4 bg-muted p-3 rounded text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                    {importEntityProgress}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generate Data Tab */}
        <TabsContent value="generate-data" className="mt-6">
          <div className="space-y-6">
            {/* Bulk Data Generation */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Settings className="h-6 w-6" />
                  Generación Masiva de Datos
                </CardTitle>
                <CardDescription>
                  Genera un conjunto completo de datos de prueba: 4 impuestos IVA, 1,000 productos, 20 centros de distribución, 40 tiendas y 80 usuarios. Las órdenes se crean automáticamente desde apps frontales.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateCompleteDataset}
                  disabled={isGeneratingBulkData}
                  size="lg"
                  className="w-full"
                  data-testid="button-generate-complete-dataset"
                >
                  {isGeneratingBulkData ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Generando datos completos...
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5 mr-2" />
                      Generar Datos Completos
                    </>
                  )}
                </Button>
                {isGeneratingBulkData && (
                  <div className="mt-4 space-y-2">
                    <p className="text-center text-sm text-muted-foreground">
                      Esto puede tomar varios minutos. Por favor, espera...
                    </p>
                    {progressMessages.length > 0 && (
                      <div className="bg-muted rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="space-y-1 text-sm">
                          {progressMessages.map((message, index) => (
                            <div key={index} className="font-mono">
                              {message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete All Data */}
            <Card className="border-2 border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Eliminar Todos los Datos
                </CardTitle>
                <CardDescription>
                  Elimina completamente todos los datos: productos, centros, tiendas, usuarios, órdenes y pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => deleteAllDataMutation.mutate()}
                  disabled={deleteAllDataMutation.isPending}
                  variant="destructive"
                  className="w-full"
                  data-testid="button-delete-all-data"
                >
                  {deleteAllDataMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando todos los datos...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Todos los Datos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Timestamp Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Control de Tiempo
                </CardTitle>
                <CardDescription>
                  Configuración de timestamps para todas las entidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timestamp-offset">Desplazamiento de Timestamp (opcional)</Label>
                    <Input
                      id="timestamp-offset"
                      placeholder="Ej: -7d, -2h, -30m (días, horas, minutos)"
                      value={timestampOffset}
                      onChange={(e) => setTimestampOffset(e.target.value)}
                      data-testid="input-timestamp-offset"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use formato como "-7d" (7 días atrás), "-2h" (2 horas atrás), o "-30m" (30 minutos atrás)
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-simulate-orders"
                      checked={autoSimulateOrders}
                      onCheckedChange={(checked) => setAutoSimulateOrders(checked === true)}
                      data-testid="checkbox-auto-simulate-orders"
                    />
                    <Label htmlFor="auto-simulate-orders" className="text-sm font-medium">
                      Simular pedido al recibir orden de compra
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cuando está activo, al crear una orden de compra se generará automáticamente un pedido procesado con variaciones realistas en las cantidades
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Taxes Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Impuestos IVA
                </CardTitle>
                <CardDescription>
                  Genera los 4 tipos de IVA español (General, Reducido, Superreducido, Exento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => generateTaxesMutation.mutate({ timestampOffset })}
                    disabled={generateTaxesMutation.isPending}
                    data-testid="button-generate-taxes"
                  >
                    {generateTaxesMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Generar Impuestos IVA
                  </Button>
                  
                  <Button
                    onClick={() => deleteAllTaxesMutation.mutate()}
                    disabled={deleteAllTaxesMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-taxes"
                  >
                    {deleteAllTaxesMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos
                </CardTitle>
                <CardDescription>
                  Generación de productos aleatorios de alimentación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-count">Cantidad (1-100)</Label>
                    <Input
                      id="product-count"
                      type="number"
                      min="1"
                      max="100"
                      value={productCount}
                      onChange={(e) => setProductCount(parseInt(e.target.value) || 0)}
                      data-testid="input-product-count"
                      className="w-32"
                    />
                  </div>
                  
                  <Button
                    onClick={() => generateMutation.mutate({ 
                      count: productCount, 
                      timestampOffset 
                    })}
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

                  <Button
                    onClick={() => deleteAllProductsMutation.mutate()}
                    disabled={deleteAllProductsMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-products"
                  >
                    {deleteAllProductsMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Centers Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Centros de Distribución
                </CardTitle>
                <CardDescription>
                  Generación de centros de distribución logística
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="centers-count">Cantidad (1-10)</Label>
                    <Input
                      id="centers-count"
                      type="number"
                      min="1"
                      max="10"
                      value={deliveryCentersCount}
                      onChange={(e) => setDeliveryCentersCount(parseInt(e.target.value) || 0)}
                      data-testid="input-centers-count"
                      className="w-32"
                    />
                  </div>
                  
                  <Button
                    onClick={() => generateDeliveryCentersMutation.mutate({ 
                      count: deliveryCentersCount, 
                      timestampOffset 
                    })}
                    disabled={generateDeliveryCentersMutation.isPending}
                    data-testid="button-generate-centers"
                  >
                    {generateDeliveryCentersMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Generar Centros
                  </Button>

                  <Button
                    onClick={() => deleteAllDeliveryCentersMutation.mutate()}
                    disabled={deleteAllDeliveryCentersMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-centers"
                  >
                    {deleteAllDeliveryCentersMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stores Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Tiendas
                </CardTitle>
                <CardDescription>
                  Generación de tiendas vinculadas a centros existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stores-per-center">Tiendas por Centro (1-5)</Label>
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
                    onClick={() => deleteAllStoresMutation.mutate()}
                    disabled={deleteAllStoresMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-stores"
                  >
                    {deleteAllStoresMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios
                </CardTitle>
                <CardDescription>
                  Generación de usuarios para tiendas existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="users-per-store">Usuarios por Tienda (1-5)</Label>
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
                    onClick={() => deleteAllUsersMutation.mutate()}
                    disabled={deleteAllUsersMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-users"
                  >
                    {deleteAllUsersMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Orders Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Órdenes de Compra
                </CardTitle>
                <CardDescription>
                  Generación de órdenes de compra - requiere usuarios existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    onClick={() => deleteAllPurchaseOrdersMutation.mutate()}
                    disabled={deleteAllPurchaseOrdersMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-purchase-orders"
                  >
                    {deleteAllPurchaseOrdersMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Orders Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pedidos (Solo Desarrollo)
                </CardTitle>
                <CardDescription>
                  Generación de pedidos procesados - requiere usuarios existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    onClick={() => deleteAllOrdersMutation.mutate()}
                    disabled={deleteAllOrdersMutation.isPending}
                    variant="destructive"
                    data-testid="button-delete-all-orders"
                  >
                    {deleteAllOrdersMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {orderType === 'purchase' ? (
                <>
                  <FileText className="h-5 w-5" />
                  Detalles de Orden de Compra
                </>
              ) : (
                <>
                  <Receipt className="h-5 w-5" />
                  Detalles del Pedido
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <>
                  ID: {orderType === 'purchase' 
                    ? (selectedOrder as PurchaseOrder).purchase_order_id 
                    : (selectedOrder as Order).order_id}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <OrderDetailsContent 
              order={selectedOrder} 
              orderType={orderType}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}