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

async function fetchDeliveryCenters(): Promise<EntitiesResponse<DeliveryCenter>> {
  const query = `
    query GetDeliveryCenters {
      deliveryCenters {
        code
        name
        city
        region
        postal_code
        is_active
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
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  const centers = result.data.deliveryCenters || [];
  return {
    data: centers,
    total: centers.length,
    limit: 100,
    offset: 0
  };
}

async function fetchStores(): Promise<EntitiesResponse<Store>> {
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
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  const stores = result.data.stores || [];
  return {
    data: stores,
    total: stores.length,
    limit: 100,
    offset: 0
  };
}

async function fetchUsers(): Promise<EntitiesResponse<User>> {
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
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  const users = result.data.users || [];
  return {
    data: users,
    total: users.length,
    limit: 100,
    offset: 0
  };
}

async function fetchPurchaseOrders(): Promise<EntitiesResponse<PurchaseOrder>> {
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
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  const orders = result.data.purchaseOrders || [];
  return {
    data: orders,
    total: orders.length,
    limit: 100,
    offset: 0
  };
}

async function fetchOrders(): Promise<EntitiesResponse<Order>> {
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

  const orders = result.data.orders || [];
  return {
    data: orders,
    total: orders.length,
    limit: 100,
    offset: 0
  };
}

async function fetchTaxes(): Promise<EntitiesResponse<Tax>> {
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
    body: JSON.stringify({ query, variables: { limit: 10, offset: 0 } }),
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
    limit: result.data.taxes.limit || 10,
    offset: result.data.taxes.offset || 0
  };
}

export default function Products() {
  // Tab state
  const [activeTab, setActiveTab] = useState("products");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries for all entities
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: centersData, isLoading: centersLoading } = useQuery({
    queryKey: ["delivery-centers"],
    queryFn: fetchDeliveryCenters,
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchStores,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const { data: purchaseOrdersData, isLoading: purchaseOrdersLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: fetchPurchaseOrders,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const { data: taxesData, isLoading: taxesLoading } = useQuery({
    queryKey: ["taxes"],
    queryFn: fetchTaxes,
  });

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
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="view-data" className="flex items-center gap-2" data-testid="tab-view-data">
            <Eye className="h-4 w-4" />
            Ver Datos
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
                <span>Centros ({centersData?.data?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="stores" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>Tiendas ({storesData?.data?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Usuarios ({usersData?.data?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="purchase-orders" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Órdenes Compra ({purchaseOrdersData?.data?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Pedidos ({ordersData?.data?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="taxes" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>Impuestos ({taxesData?.data?.length || 0})</span>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>EAN</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio Base</TableHead>
                          <TableHead>IVA</TableHead>
                          <TableHead>Precio Final</TableHead>
                          <TableHead>Estado</TableHead>
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
                                <Badge variant={product.is_active ? "default" : "secondary"}>
                                  {product.is_active ? "Activo" : "Inactivo"}
                                </Badge>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery Centers Tab */}
            <TabsContent value="delivery-centers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Centros de Distribución ({centersData?.data?.length || 0})
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Región</TableHead>
                          <TableHead>CP</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {centersData.data.map((center) => (
                          <TableRow key={center.code}>
                            <TableCell className="font-mono">{center.code}</TableCell>
                            <TableCell className="font-medium">{center.name}</TableCell>
                            <TableCell>{center.city}</TableCell>
                            <TableCell>{center.region}</TableCell>
                            <TableCell>{center.postal_code}</TableCell>
                            <TableCell>
                              <Badge variant={center.is_active ? "default" : "secondary"}>
                                {center.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    Tiendas ({storesData?.data?.length || 0})
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Centro</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead>Estado</TableHead>
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
                              <Badge variant={store.is_active ? "default" : "secondary"}>
                                {store.is_active ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    Usuarios ({usersData?.data?.length || 0})
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tienda</TableHead>
                          <TableHead>Estado</TableHead>
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
                              <Badge variant={user.is_active ? "default" : "secondary"}>
                                {user.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    Órdenes de Compra ({purchaseOrdersData?.data?.length || 0})
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Tienda</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Fecha</TableHead>
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
                              {new Date(order.created_at).toLocaleDateString('es-ES')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    Pedidos ({ordersData?.data?.length || 0})
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Tienda</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>IVA</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Fecha</TableHead>
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
                              {new Date(order.created_at).toLocaleDateString('es-ES')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    Impuestos ({taxesData?.data?.length || 0})
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo IVA</TableHead>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

        {/* Generate Data Tab */}
        <TabsContent value="generate-data" className="mt-6">
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Funcionalidad de generación en construcción</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}