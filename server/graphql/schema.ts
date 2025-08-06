export const typeDefs = `#graphql
  scalar DateTime

  type Tax {
    code: String!
    name: String!
    tax_rate: Float!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Product {
    ean: String!
    ref: String
    title: String!
    description: String
    base_price: Float!
    tax_code: String!
    unit_of_measure: String!
    quantity_measure: Float!
    image_url: String
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
    tax: Tax
  }

  input TaxInput {
    code: String!
    name: String!
    tax_rate: Float!
  }

  input ProductInput {
    ean: String!
    ref: String
    title: String!
    description: String
    base_price: Float!
    tax_code: String!
    unit_of_measure: String!
    quantity_measure: Float!
    image_url: String
    is_active: Boolean
  }

  input UpdateTaxInput {
    name: String
    tax_rate: Float
  }

  input UpdateProductInput {
    ref: String
    title: String
    description: String
    base_price: Float
    tax_code: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    is_active: Boolean
  }

  type Query {
    products(timestamp: String, limit: Int, offset: Int): ProductConnection!
    product(ean: String!): Product
    taxes(timestamp: String, limit: Int, offset: Int): TaxConnection!
    tax(code: String!): Tax
  }

  type ProductConnection {
    products: [Product!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type TaxConnection {
    taxes: [Tax!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(ean: String!, input: UpdateProductInput!): Product!
    deleteProduct(ean: String!): Boolean!
    deleteAllProducts: DeleteAllProductsResult!
    generateRandomProducts(count: Int!, timestampOffset: String!): GenerateProductsResult!
    
    createTax(input: TaxInput!): Tax!
    updateTax(code: String!, input: UpdateTaxInput!): Tax!
    deleteTax(code: String!): Boolean!
  }

  type DeleteAllProductsResult {
    success: Boolean!
    deletedCount: Int!
    message: String!
  }

  type GenerateProductsResult {
    success: Boolean!
    createdCount: Int!
    products: [Product!]!
    message: String!
  }
`;
