# GraphQL API Examples

This headless microservice provides a GraphQL API at `http://localhost:4000/` for managing grocery products and Spanish VAT taxes with timestamp synchronization.

## Query Examples

### Get all products
```graphql
query {
  products {
    ean
    title
    description
    base_price
    tax_code
    unit_of_measure
    quantity_measure
    is_active
    created_at
    updated_at
    tax {
      name
      tax_rate
    }
  }
}
```

### Get products with timestamp filtering (for sync)
```graphql
query {
  products(timestamp: "2025-08-06T09:00:00.000Z") {
    ean
    title
    base_price
    updated_at
  }
}
```

### Get all taxes
```graphql
query {
  taxes {
    code
    name
    tax_rate
    created_at
    updated_at
  }
}
```

### Get specific product by EAN
```graphql
query {
  product(ean: "8414719000000") {
    ean
    title
    base_price
    tax {
      name
      tax_rate
    }
  }
}
```

## Mutation Examples

### Create a new product
```graphql
mutation {
  createProduct(input: {
    ean: "8414719000011"
    ref: "PROD012"
    title: "Manzanas Golden 1kg"
    description: "Manzanas Golden de temporada"
    base_price: 2.90
    tax_code: "IVA_ALIMENTACION"
    unit_of_measure: "kg"
    quantity_measure: 1.0
    is_active: true
  }) {
    ean
    title
    base_price
    created_at
  }
}
```

### Update a product
```graphql
mutation {
  updateProduct(ean: "8414719000011", input: {
    base_price: 3.20
    description: "Manzanas Golden premium de temporada"
  }) {
    ean
    title
    base_price
    updated_at
  }
}
```

### Create a new tax rate
```graphql
mutation {
  createTax(input: {
    code: "IVA_ESPECIAL"
    name: "IVA Especial"
    tax_rate: 0.15
  }) {
    code
    name
    tax_rate
    created_at
  }
}
```

### Delete a product
```graphql
mutation {
  deleteProduct(ean: "8414719000011")
}
```

## Spanish VAT Tax Codes

The system includes the following Spanish VAT tax rates:

- `IVA_GENERAL` - IVA General (21%)
- `IVA_ALIMENTACION` - IVA Alimentación (4%)
- `IVA_REDUCIDO` - IVA Reducido (10%)
- `IVA_SUPERREDUCIDO` - IVA Superreducido (4%)
- `IVA_EXENTO` - IVA Exento (0%)

## Timestamp Synchronization

The API supports timestamp-based synchronization for efficient data updates:

- All records include `created_at` and `updated_at` timestamps with timezone information
- Query parameters accept ISO 8601 timestamps: `2025-08-06T09:00:00.000Z`
- Returns only records modified on or after the specified timestamp
- Ideal for incremental sync operations with frontend applications

## Sample Data

The system includes 10 sample Spanish grocery products:

1. Aceite de Oliva Virgen Extra 500ml
2. Pan Integral 500g
3. Leche Entera 1L
4. Tomates Cherry 250g
5. Pasta Integral 500g
6. Queso Manchego Curado 200g
7. Jamón Ibérico 100g
8. Vino Tinto Crianza 750ml
9. Naranjas Valencia 1kg
10. Yogur Natural 4x125g

## Health Check

Check service status at: `GET http://localhost:5000/api/health`