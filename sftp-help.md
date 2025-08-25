# 📁 Sistema SFTP Musgrave - Documentación Completa

## 🌐 Información de Conexión

### **Protocolo**
- **Tipo:** SFTP (SSH File Transfer Protocol)
- **Autenticación:** Usuario/Contraseña
- **Conexión:** SSH sobre puerto 22

---

## 📂 Estructura de Carpetas del Servidor SFTP

### **📥 `/in/` - Carpeta de Entrada (Incoming)**
Carpeta donde se reciben archivos CSV para ser procesados por el sistema.

#### **`/in/purchase_orders/`**
- **Propósito:** Almacena órdenes de compra pendientes de procesar
- **Formato:** Archivos CSV con órdenes de compra
- **Procesamiento:** Se procesan para generar pedidos automáticamente
- **Estado:** Los archivos se mueven a `/processed/` después del procesamiento

### **📤 `/out/` - Carpeta de Salida (Outgoing)**
Carpeta donde se generan y almacenan archivos CSV para ser descargados por otros sistemas.

#### **`/out/deliveryCenters/`**
- **Archivo:** `deliveryCenters_YYYYMMDDHHMMSS.csv`
- **Contenido:** Centros de distribución exportados
- **Formato:** CSV con campos: `code`, `name`, `is_active`

#### **`/out/stores/`**
- **Archivo:** `stores_YYYYMMDDHHMMSS.csv`
- **Contenido:** Tiendas exportadas
- **Formato:** CSV con campos: `code`, `name`, `delivery_center_code`, `responsible_email`, `is_active`

#### **`/out/users/`**
- **Archivo:** `users_YYYYMMDDHHMMSS.csv`
- **Contenido:** Usuarios exportados
- **Formato:** CSV con campos: `email`, `name`, `store_id`, `is_active`

#### **`/out/products/`**
- **Archivo:** `products_YYYYMMDDHHMMSS.csv`
- **Contenido:** Productos exportados
- **Formato:** CSV con campos: `ean`, `ref`, `title`, `description`, `base_price`, `tax_code`, `unit_of_measure`, `quantity_measure`, `image_url`, `nutrition_label_url`, `is_active`

#### **`/out/taxes/`**
- **Archivo:** `taxes_YYYYMMDDHHMMSS.csv`
- **Contenido:** Impuestos IVA exportados
- **Formato:** CSV con campos: `code`, `name`, `tax_rate`

#### **`/out/orders/`**
- **Archivo:** `orders_YYYYMMDDHHMMSS.csv`
- **Contenido:** Pedidos generados desde órdenes de compra
- **Formato:** CSV con campos: `order_id`, `source_purchase_order_id`, `user_email`, `store_id`, `observations`, `subtotal`, `tax_total`, `final_total`

### **🔄 `/processed/` - Carpetas de Archivos Procesados**
Carpetas donde se almacenan archivos que ya han sido procesados por el sistema.

#### **`/processed/purchase_orders/`**
- **Propósito:** Almacena órdenes de compra ya procesadas
- **Origen:** Archivos movidos desde `/in/purchase_orders/`
- **Estado:** Procesados y convertidos en pedidos

---

## 📊 Estructura de Archivos CSV

### **🔄 Archivos de Importación (Entrada)**

#### **1. Órdenes de Compra (`purchase_orders.csv`)**
```csv
purchase_order_id,user_email,store_id,status,subtotal,tax_total,final_total,server_sent_at,created_at,updated_at,item_ean,item_ref,item_title,quantity,base_price_at_order,tax_rate_at_order
PO_001,user@example.com,STORE_001,pending,100.00,21.00,121.00,2024-01-15T10:00:00Z,2024-01-15T09:00:00Z,2024-01-15T09:00:00Z,1234567890123,REF001,Producto A,2,50.00,0.21
PO_001,user@example.com,STORE_001,pending,100.00,21.00,121.00,2024-01-15T10:00:00Z,2024-01-15T09:00:00Z,2024-01-15T09:00:00Z,9876543210987,REF002,Producto B,1,100.00,0.21
```

**Campos:**
- `purchase_order_id`: Identificador único de la orden de compra
- `user_email`: Email del usuario que realiza la orden
- `store_id`: Identificador de la tienda
- `status`: Estado de la orden (pending, processing, completed)
- `subtotal`: Subtotal sin impuestos
- `tax_total`: Total de impuestos
- `final_total`: Total final con impuestos
- `server_sent_at`: Timestamp de envío al servidor
- `created_at`: Timestamp de creación
- `updated_at`: Timestamp de última actualización
- `item_ean`: Código EAN del producto
- `item_ref`: Referencia del producto
- `item_title`: Título del producto
- `quantity`: Cantidad solicitada
- `base_price_at_order`: Precio base en el momento de la orden
- `tax_rate_at_order`: Tasa de impuesto en el momento de la orden

### **📤 Archivos de Exportación (Salida)**

#### **1. Centros de Distribución (`deliveryCenters_YYYYMMDDHHMMSS.csv`)**
```csv
code,name,is_active
DC_001,Centro Norte,true
DC_002,Centro Sur,true
DC_003,Centro Este,false
```

**Campos:**
- `code`: Código único del centro de distribución
- `name`: Nombre del centro de distribución
- `is_active`: Estado activo/inactivo

#### **2. Tiendas (`stores_YYYYMMDDHHMMSS.csv`)**
```csv
code,name,delivery_center_code,responsible_email,is_active
STORE_001,Tienda Centro,DC_001,manager1@example.com,true
STORE_002,Tienda Norte,DC_001,manager2@example.com,true
STORE_003,Tienda Sur,DC_002,manager3@example.com,false
```

**Campos:**
- `code`: Código único de la tienda
- `name`: Nombre de la tienda
- `delivery_center_code`: Código del centro de distribución asociado
- `responsible_email`: Email del responsable de la tienda
- `is_active`: Estado activo/inactivo

#### **3. Usuarios (`users_YYYYMMDDHHMMSS.csv`)**
```csv
email,name,store_id,is_active
user1@example.com,Usuario 1,STORE_001,true
user2@example.com,Usuario 2,STORE_001,true
user3@example.com,Usuario 3,STORE_002,false
```

**Campos:**
- `email`: Email único del usuario
- `name`: Nombre completo del usuario
- `store_id`: Identificador de la tienda asociada
- `is_active`: Estado activo/inactivo

#### **4. Productos (`products_YYYYMMDDHHMMSS.csv`)**
```csv
ean,ref,title,description,base_price,tax_code,unit_of_measure,quantity_measure,image_url,nutrition_label_url,is_active
1234567890123,REF001,Producto A,Descripción del producto A,50.00,IVA_GEN,unidad,1,https://example.com/image1.jpg,https://example.com/nutrition1.jpg,true
9876543210987,REF002,Producto B,Descripción del producto B,100.00,IVA_RED,kg,0.5,https://example.com/image2.jpg,https://example.com/nutrition2.jpg,true
```

**Campos:**
- `ean`: Código EAN-13 del producto
- `ref`: Referencia interna del producto
- `title`: Título del producto
- `description`: Descripción detallada
- `base_price`: Precio base sin impuestos
- `tax_code`: Código del impuesto aplicable
- `unit_of_measure`: Unidad de medida (unidad, kg, litros, etc.)
- `quantity_measure`: Cantidad en la unidad especificada
- `image_url`: URL de la imagen del producto
- `nutrition_label_url`: URL de la etiqueta nutricional
- `is_active`: Estado activo/inactivo

#### **5. Impuestos (`taxes_YYYYMMDDHHMMSS.csv`)**
```csv
code,name,tax_rate
IVA_GEN,IVA General,0.21
IVA_RED,IVA Reducido,0.10
IVA_SUP,IVA Superreducido,0.04
IVA_EXE,IVA Exento,0.00
```

**Campos:**
- `code`: Código único del impuesto
- `name`: Nombre del impuesto
- `tax_rate`: Tasa del impuesto (decimal, ej: 0.21 = 21%)

#### **6. Pedidos (`orders_YYYYMMDDHHMMSS.csv`)**
```csv
order_id,source_purchase_order_id,user_email,store_id,observations,subtotal,tax_total,final_total
ORD_001,PO_001,user@example.com,STORE_001,Observaciones del pedido,100.00,21.00,121.00
ORD_002,PO_002,user2@example.com,STORE_002,Sin observaciones,150.00,31.50,181.50
```

**Campos:**
- `order_id`: Identificador único del pedido
- `source_purchase_order_id`: ID de la orden de compra origen
- `user_email`: Email del usuario que realizó el pedido
- `store_id`: Identificador de la tienda
- `observations`: Observaciones adicionales del pedido
- `subtotal`: Subtotal sin impuestos
- `tax_total`: Total de impuestos
- `final_total`: Total final con impuestos

