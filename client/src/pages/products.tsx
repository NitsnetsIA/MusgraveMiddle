import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Trash2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

interface Product {
  ean: string;
  ref: string | null;
  title: string;
  description: string | null;
  base_price: number;
  tax_code: string;
  unit_of_measure: string;
  quantity_measure: number;
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

const GRAPHQL_ENDPOINT = "http://localhost:4000/";

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

function ProductCard({ product }: { product: Product }) {
  const totalPrice = product.base_price * (1 + (product.tax?.tax_rate || 0));
  
  return (
    <Card className="h-full" data-testid={`card-product-${product.ean}`}>
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

export default function Products() {
  const [productCount, setProductCount] = useState(10);
  const [timestampOffset, setTimestampOffset] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
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

  const handleDeleteAll = () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODOS los productos? Esta acción no se puede deshacer.")) {
      deleteAllMutation.mutate();
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

    generateMutation.mutate({ count: productCount, timestamp: finalTimestamp });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error al cargar productos</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Error desconocido"}
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
            Gestiona el catálogo de productos con operaciones masivas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delete All Products */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Eliminar todos los productos</h3>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente todos los productos del catálogo
              </p>
            </div>
            <Button
              onClick={handleDeleteAll}
              variant="destructive"
              disabled={deleteAllMutation.isPending}
              data-testid="button-delete-all"
            >
              {deleteAllMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar Todo
            </Button>
          </div>

          {/* Generate Random Products */}
          <div className="p-4 border rounded-lg space-y-4">
            <div>
              <h3 className="font-medium">Generar productos aleatorios</h3>
              <p className="text-sm text-muted-foreground">
                Crea productos españoles realistas con categorías y marcas auténticas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-count">Número de productos (1-1000)</Label>
                <Input
                  id="product-count"
                  type="number"
                  min="1"
                  max="1000"
                  value={productCount}
                  onChange={(e) => setProductCount(parseInt(e.target.value) || 0)}
                  data-testid="input-product-count"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timestamp-offset">Fecha/Hora de creación (opcional)</Label>
                <Input
                  id="timestamp-offset"
                  type="datetime-local"
                  value={timestampOffset ? timestampOffset.slice(0, 16) : ''}
                  onChange={(e) => setTimestampOffset(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  placeholder="Usa el momento actual si se deja vacío"
                  data-testid="input-timestamp"
                />
              </div>
            </div>
            
            <Button
              onClick={handleGenerateProducts}
              disabled={generateMutation.isPending}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generar Productos
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div>
          <div className="mb-6 flex items-center gap-2 text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span data-testid="text-total-products">
              {data.total} productos en total
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.products.map((product) => (
              <ProductCard key={product.ean} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">No hay productos</h2>
          <p className="text-muted-foreground">No se encontraron productos en el catálogo.</p>
        </div>
      )}
    </div>
  );
}