# Sistema PIM de Productos de Supermercado


## Descripción General

Sistema completo de gestión de información de productos (PIM) para supermercados españoles, con API GraphQL headless, integración SFTP con sistemas legacy, gestión de órdenes de compra y pedidos procesados, autenticación de usuarios y sincronización de datos en tiempo real.

## Características Principales

- 🏪 **Gestión Multi-tienda**: Soporte para múltiples tiendas y centros de distribución
- 📦 **Gestión de Productos**: CRUD completo con URLs de etiquetas nutricionales específicas por EAN
- 🧾 **Órdenes de Compra y Pedidos**: Sistema dual de órdenes con seguimiento automático de estados
- 🔐 **Autenticación Segura**: Hash SHA3-256 con salt individual por email
- 📊 **API GraphQL**: API flexible y eficiente para consultas y mutaciones
- 🔄 **Sincronización**: Timestamps timezone-aware para sincronización de datos
- 📁 **Integración SFTP**: Intercambio automático de archivos CSV con sistemas legacy
- 🏷️ **Gestión de Impuestos**: Códigos IVA españoles integrados
- 📋 **Importación/Exportación**: Procesamiento inteligente de archivos CSV
- 🎯 **Generación de Datos**: Herramientas para generar datos de prueba coherentes

## Requisitos del Sistema

### Software Requerido

#### Base de Datos
- **PostgreSQL 14+** 
- Extensiones necesarias: ninguna adicional

#### Runtime
- **Node.js 18+** (se recomienda 20.x)
- **npm 9+** o **yarn 1.22+**

#### Herramientas de Desarrollo
- **Git** para control de versiones
- **VSCode** (recomendado) con extensiones:
  - GraphQL
  - PostgreSQL
  - TypeScript
  - Tailwind CSS IntelliSense

### Servicios Externos (Opcionales)

#### Servidor SFTP
- Servidor SFTP compatible con SSH2
- Credenciales de acceso configuradas
- Estructura de carpetas:
  ```
  /in/   - Para importación de archivos
  /out/  - Para exportación de archivos
  ```

## Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd grocery-pim-system
```

### 2. Configurar Base de Datos PostgreSQL

#### Opción A: Usando Neon PostgreSQL (Recomendado para desarrollo)

1. Crear cuenta en [Neon.tech](https://neon.tech)
2. Crear nueva base de datos
3. Copiar la cadena de conexión (DATABASE_URL)

#### Opción B: PostgreSQL Local

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (con Homebrew)
brew install postgresql
brew services start postgresql

# Crear base de datos
sudo -u postgres createdb grocery_pim

# Crear usuario
sudo -u postgres psql
CREATE USER grocery_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE grocery_pim TO grocery_user;
\q
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos (OBLIGATORIO)
DATABASE_URL="postgresql://usuario:password@localhost:5432/grocery_pim"

# Puerto de la aplicación (OPCIONAL)
PORT=3000

# Configuración SFTP (OPCIONAL - para integración con sistemas legacy)
SFTP_HOST="tu-servidor-sftp.com"
SFTP_PORT=22
SFTP_USERNAME="tu_usuario"
SFTP_PASSWORD="tu_password"
# O usando clave privada:
# SFTP_PRIVATE_KEY_PATH="/ruta/a/tu/clave/privada"

# Configuración de desarrollo (OPCIONAL)
NODE_ENV=development
```

### 5. Configurar Base de Datos

#### Aplicar Esquema Inicial

```bash
# Generar y aplicar migraciones
npx drizzle-kit generate
npx drizzle-kit push
```

#### Verificar Conexión

```bash
npx drizzle-kit studio
```

Esto abrirá Drizzle Studio en tu navegador para verificar que las tablas se crearon correctamente.

### 6. Poblar Datos Iniciales (Opcional)

El sistema incluye un generador de datos de prueba:

```bash
# Esto se puede hacer desde la interfaz web o programáticamente
node -e "
const { generateAndSaveAllEntities } = require('./server/entity-generator.ts');
generateAndSaveAllEntities({
  deliveryCenters: 5,
  stores: 15,
  users: 25,
  products: 100,
  taxes: 5,
  purchaseOrders: 20
});
"
```

### 7. Ejecutar la Aplicación

#### Modo Desarrollo

```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:3000` (mismo puerto)
- GraphQL Playground en `http://localhost:3000/graphql`

#### Modo Producción

```bash
npm run build
npm start
```

### 8. Verificar Instalación

1. **Frontend**: Navegar a `http://localhost:3000`
2. **GraphQL API**: Acceder a `http://localhost:3000/graphql`
3. **Probar consulta básica**:

```graphql
query {
  stores(limit: 5) {
    stores {
      code
      name
      is_active
    }
    total
  }
}
```

## Estructura del Proyecto

```
grocery-pim-system/
├── client/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── lib/           # Utilidades y configuración
│   │   └── App.tsx        # Componente principal
├── server/                # Backend Express + GraphQL
│   ├── graphql/          # Esquemas y resolvers GraphQL
│   ├── services/         # Servicios (SFTP, etc.)
│   ├── storage.ts        # Capa de acceso a datos
│   └── index.ts          # Servidor principal
├── shared/               # Código compartido
│   └── schema.ts         # Esquemas de base de datos (Drizzle)
├── package.json          # Dependencias y scripts
├── drizzle.config.ts     # Configuración Drizzle ORM
├── tsconfig.json         # Configuración TypeScript
└── vite.config.ts        # Configuración Vite
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev                    # Iniciar en modo desarrollo
npm run build                 # Construir para producción
npm start                    # Ejecutar versión de producción

# Base de Datos
npx drizzle-kit generate     # Generar migraciones
npx drizzle-kit push        # Aplicar cambios a BD
npx drizzle-kit push --force # Forzar cambios (¡cuidado en producción!)
npx drizzle-kit studio      # Abrir Drizzle Studio

# Utilidades
npm run check              # Verificar tipos TypeScript
```

## Configuración de Desarrollo

### Extensiones VSCode Recomendadas

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "graphql.vscode-graphql",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag"
  ]
}
```

### Configuración de ESLint y Prettier

El proyecto viene preconfigurado con:
- ESLint para análisis de código
- Prettier para formateo automático
- Configuración específica para React y TypeScript

## Funcionalidades Principales

### Gestión de Productos
- CRUD completo de productos
- Códigos EAN-13 con validación de checksums
- URLs de etiquetas nutricionales personalizadas
- Categorización y metadatos

### Órdenes de Compra y Pedidos
- **Órdenes de Compra**: `[CÓDIGO_TIENDA]-[AAMMDDHHMMSS]-[3_CARACTERES]`
- **Pedidos Procesados**: `[CÓDIGO_CENTRO]-[AAMMDDHHMMSS]-[4_ALFANUMÉRICOS]`
- Actualización automática de estados
- Seguimiento de timestamps de envío SFTP

### Integración SFTP
- Exportación automática de órdenes de compra
- Importación de datos maestros desde CSV
- Gestión de archivos en carpetas `/in/` y `/out/`
- Logs detallados de operaciones

### API GraphQL
- Consultas flexibles con paginación
- Mutaciones para CRUD operations
- Subscripciones para actualizaciones en tiempo real
- Playground integrado para testing

## Solución de Problemas Comunes

### Error de Conexión a Base de Datos

```bash
# Verificar que PostgreSQL esté ejecutándose
sudo systemctl status postgresql

# Verificar credenciales en .env
cat .env | grep DATABASE_URL

# Probar conexión manual
psql "postgresql://usuario:password@host:puerto/database"
```

### Puerto en Uso

```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Cambiar puerto en .env
echo "PORT=3001" >> .env
```

### Problemas con Dependencias

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versión de Node.js
node --version  # Debe ser 18+
```

### Errores de TypeScript

```bash
# Verificar configuración
npm run type-check

# Regenerar tipos de base de datos
npm run db:generate
```

## Contribución

### Flujo de Desarrollo

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Realizar cambios y commits descriptivos
3. Ejecutar tests: `npm test` (si están configurados)
4. Verificar tipos: `npm run type-check`
5. Crear Pull Request

### Convenciones de Código

- **TypeScript**: Tipado estricto obligatorio
- **Nomenclatura**: camelCase para variables, PascalCase para componentes
- **Commits**: Formato convencional (feat:, fix:, docs:, etc.)
- **Componentes**: Un componente por archivo, nombres descriptivos

## Licencia

[Especificar licencia del proyecto]

## Soporte

Para problemas y preguntas:
- Crear issue en el repositorio
- Consultar documentación de GraphQL en `/graphql`
- Revisar logs de la aplicación en la consola

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025
