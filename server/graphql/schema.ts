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
    products(timestamp: String): [Product!]!
    product(ean: String!): Product
    taxes(timestamp: String): [Tax!]!
    tax(code: String!): Tax
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(ean: String!, input: UpdateProductInput!): Product!
    deleteProduct(ean: String!): Boolean!
    
    createTax(input: TaxInput!): Tax!
    updateTax(code: String!, input: UpdateTaxInput!): Tax!
    deleteTax(code: String!): Boolean!
  }
`;
