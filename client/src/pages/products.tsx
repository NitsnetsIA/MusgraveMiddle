import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, Euro } from "lucide-react";
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

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
      <div className="flex items-center gap-3 mb-8">
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