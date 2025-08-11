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

  type DeliveryCenter {
    code: String!
    name: String!
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
    stores: [Store!]
  }

  type Store {
    code: String!
    name: String!
    responsible_email: String
    delivery_center_code: String!
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
    deliveryCenter: DeliveryCenter
    users: [User!]
    purchaseOrders: [PurchaseOrder!]
    orders: [Order!]
  }

  type User {
    email: String!
    store_id: String!
    name: String
    password_hash: String!
    is_active: Boolean!
    last_login: DateTime
    created_at: DateTime!
    updated_at: DateTime!
    store: Store
    purchaseOrders: [PurchaseOrder!]
    orders: [Order!]
  }

  type PurchaseOrder {
    purchase_order_id: String!
    user_email: String!
    store_id: String!
    status: String!
    subtotal: Float!
    tax_total: Float!
    final_total: Float!
    server_sent_at: DateTime
    created_at: DateTime!
    updated_at: DateTime!
    user: User
    store: Store
    items: [PurchaseOrderItem!]
    order: Order
  }

  type PurchaseOrderItem {
    item_id: Int!
    purchase_order_id: String!
    item_ean: String!
    item_title: String
    item_description: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    quantity: Float!
    base_price_at_order: Float!
    tax_rate_at_order: Float!
    created_at: DateTime!
    updated_at: DateTime!
    purchaseOrder: PurchaseOrder
  }

  type Order {
    order_id: String!
    source_purchase_order_id: String!
    user_email: String!
    store_id: String!
    observations: String
    subtotal: Float!
    tax_total: Float!
    final_total: Float!
    created_at: DateTime!
    updated_at: DateTime!
    sourcePurchaseOrder: PurchaseOrder
    user: User
    store: Store
    items: [OrderItem!]
  }

  type OrderItem {
    item_id: Int!
    order_id: String!
    item_ean: String!
    item_title: String
    item_description: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    quantity: Float!
    base_price_at_order: Float!
    tax_rate_at_order: Float!
    created_at: DateTime!
    updated_at: DateTime!
    order: Order
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

  input DeliveryCenterInput {
    code: String!
    name: String!
    is_active: Boolean
  }

  input UpdateDeliveryCenterInput {
    name: String
    is_active: Boolean
  }

  input StoreInput {
    code: String!
    name: String!
    responsible_email: String
    delivery_center_code: String!
    is_active: Boolean
  }

  input UpdateStoreInput {
    name: String
    responsible_email: String
    delivery_center_code: String
    is_active: Boolean
  }

  input UserInput {
    email: String!
    store_id: String!
    name: String
    password_hash: String!
    is_active: Boolean
  }

  input UpdateUserInput {
    store_id: String
    name: String
    password_hash: String
    is_active: Boolean
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input PurchaseOrderInput {
    purchase_order_id: String!
    user_email: String!
    store_id: String!
    status: String!
    subtotal: Float!
    tax_total: Float!
    final_total: Float!
    server_sent_at: DateTime
    created_at: DateTime
    updated_at: DateTime
    items: [PurchaseOrderItemInput!]
  }

  input UpdatePurchaseOrderInput {
    user_email: String
    store_id: String
    status: String
    subtotal: Float
    tax_total: Float
    final_total: Float
    server_sent_at: DateTime
    created_at: DateTime
    updated_at: DateTime
  }

  input PurchaseOrderItemInput {
    purchase_order_id: String
    item_ean: String!
    item_title: String
    item_description: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    quantity: Float!
    base_price_at_order: Float!
    tax_rate_at_order: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  input UpdatePurchaseOrderItemInput {
    purchase_order_id: String
    item_ean: String
    item_title: String
    item_description: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    quantity: Float
    base_price_at_order: Float
    tax_rate_at_order: Float
  }

  input OrderInput {
    order_id: String!
    source_purchase_order_id: String  # Opcional - null para pedidos directos
    user_email: String!
    store_id: String!
    observations: String
    subtotal: Float!
    tax_total: Float!
    final_total: Float!
  }

  input UpdateOrderInput {
    source_purchase_order_id: String
    user_email: String
    store_id: String
    observations: String
    subtotal: Float
    tax_total: Float
    final_total: Float
  }

  input OrderItemInput {
    order_id: String!
    item_ean: String!
    item_title: String
    item_description: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    quantity: Float!
    base_price_at_order: Float!
    tax_rate_at_order: Float!
  }

  input UpdateOrderItemInput {
    order_id: String
    item_ean: String
    item_title: String
    item_description: String
    unit_of_measure: String
    quantity_measure: Float
    image_url: String
    quantity: Float
    base_price_at_order: Float
    tax_rate_at_order: Float
  }

  type Query {
    products(timestamp: String, limit: Int, offset: Int): ProductConnection!
    product(ean: String!): Product
    taxes(timestamp: String, limit: Int, offset: Int): TaxConnection!
    tax(code: String!): Tax
    
    deliveryCenters(timestamp: String, limit: Int, offset: Int): DeliveryCenterConnection!
    deliveryCenter(code: String!): DeliveryCenter
    
    stores(timestamp: String, limit: Int, offset: Int): StoreConnection!
    store(code: String!): Store
    
    users(timestamp: String, limit: Int, offset: Int, store_id: String): UserConnection!
    user(email: String!): User
    
    purchaseOrders(timestamp: String, limit: Int, offset: Int, store_id: String): PurchaseOrderConnection!
    purchaseOrder(purchase_order_id: String!): PurchaseOrder
    
    purchaseOrderItems(purchase_order_id: String): [PurchaseOrderItem!]!
    orderItems(order_id: String): [OrderItem!]!
    purchaseOrderItem(item_id: Int!): PurchaseOrderItem
    
    orders(timestamp: String, limit: Int, offset: Int, store_id: String): OrderConnection!
    order(order_id: String!): Order
    
    orderItem(item_id: Int!): OrderItem

    sync_info: SyncInfoResult!
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

  type DeliveryCenterConnection {
    deliveryCenters: [DeliveryCenter!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type StoreConnection {
    stores: [Store!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type UserConnection {
    users: [User!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type PurchaseOrderConnection {
    purchaseOrders: [PurchaseOrder!]!
    total: Int!
    limit: Int!
    offset: Int!
  }

  type OrderConnection {
    orders: [Order!]!
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
    deleteAllProducts: DeleteAllResult!
    toggleProductStatus(ean: String!): Product!
    generateRandomProducts(count: Int!, timestampOffset: String): GenerateProductsResult!
    
    createTax(input: TaxInput!): Tax!
    updateTax(code: String!, input: UpdateTaxInput!): Tax!
    deleteTax(code: String!): Boolean!
    deleteAllTaxes: DeleteAllResult!

    createDeliveryCenter(input: DeliveryCenterInput!): DeliveryCenter!
    updateDeliveryCenter(code: String!, input: UpdateDeliveryCenterInput!): DeliveryCenter!
    deleteDeliveryCenter(code: String!): Boolean!
    deleteAllDeliveryCenters: DeleteAllResult!
    toggleDeliveryCenterStatus(code: String!): DeliveryCenter!

    createStore(input: StoreInput!): Store!
    updateStore(code: String!, input: UpdateStoreInput!): Store!
    deleteStore(code: String!): Boolean!
    deleteAllStores: DeleteAllResult!
    toggleStoreStatus(code: String!): Store!

    createUser(input: UserInput!): User!
    updateUser(email: String!, input: UpdateUserInput!): User!
    deleteUser(email: String!): Boolean!
    deleteAllUsers: DeleteAllResult!
    toggleUserStatus(email: String!): User!
    loginUser(input: LoginInput!): User!

    createPurchaseOrder(input: PurchaseOrderInput!): PurchaseOrder!
    createPurchaseOrderWithSimulation(input: PurchaseOrderInput!, simulateOrder: Boolean!): PurchaseOrderSimulationResult!
    updatePurchaseOrder(purchase_order_id: String!, input: UpdatePurchaseOrderInput!): PurchaseOrder!
    deletePurchaseOrder(purchase_order_id: String!): Boolean!
    deleteAllPurchaseOrders: DeleteAllResult!

    createPurchaseOrderItem(input: PurchaseOrderItemInput!): PurchaseOrderItem!
    updatePurchaseOrderItem(item_id: Int!, input: UpdatePurchaseOrderItemInput!): PurchaseOrderItem!
    deletePurchaseOrderItem(item_id: Int!): Boolean!
    deleteAllPurchaseOrderItems: DeleteAllResult!

    createOrder(input: OrderInput!): Order!
    updateOrder(order_id: String!, input: UpdateOrderInput!): Order!
    deleteOrder(order_id: String!): Boolean!
    deleteAllOrders: DeleteAllResult!

    createOrderItem(input: OrderItemInput!): OrderItem!
    updateOrderItem(item_id: Int!, input: UpdateOrderItemInput!): OrderItem!
    deleteOrderItem(item_id: Int!): Boolean!
    deleteAllOrderItems: DeleteAllResult!
    
    # Entity generation
    generateTaxes(clearExisting: Boolean = false, timestampOffset: String): SingleEntityGenerationResult!
    generateDeliveryCenters(count: Int!, clearExisting: Boolean = false, timestampOffset: String): SingleEntityGenerationResult!
    generateStores(storesPerCenter: Int!, clearExisting: Boolean = false, timestampOffset: String): SingleEntityGenerationResult!
    generateUsers(usersPerStore: Int!, clearExisting: Boolean = false, timestampOffset: String): SingleEntityGenerationResult!
    generatePurchaseOrders(count: Int!, clearExisting: Boolean = false, timestampOffset: String): SingleEntityGenerationResult!
    generateOrders(count: Int!, clearExisting: Boolean = false, timestampOffset: String): SingleEntityGenerationResult!
    generateEntities(input: GenerateEntitiesInput!): GenerateEntitiesResult!
    
    # Delete all data
    deleteAllData: DeleteAllDataResult!
  }

  type DeleteAllResult {
    success: Boolean!
    deletedCount: Int!
    message: String!
  }

  type DeleteAllDataResult {
    success: Boolean!
    message: String!
  }

  type GenerateProductsResult {
    success: Boolean!
    createdCount: Int!
    products: [Product!]!
    message: String!
  }

  type EntitySyncInfo {
    entity_name: String!
    last_updated: DateTime
    total_records: Int!
  }

  type SyncInfoResult {
    entities: [EntitySyncInfo!]!
    generated_at: DateTime!
  }

  type PurchaseOrderSimulationResult {
    purchaseOrder: PurchaseOrder!
    simulatedOrder: Order
    message: String!
  }

  input GenerateEntitiesInput {
    deliveryCenters: Int
    storesPerCenter: Int
    usersPerStore: Int
    purchaseOrders: Int
    clearExisting: Boolean
  }

  type GenerateEntitiesResult {
    success: Boolean!
    summary: EntityGenerationSummary!
    message: String!
  }

  type EntityGenerationSummary {
    deliveryCenters: Int!
    stores: Int!
    users: Int!
    purchaseOrders: Int!
  }

  type SingleEntityGenerationResult {
    success: Boolean!
    entityType: String!
    createdCount: Int!
    message: String!
  }
`;
