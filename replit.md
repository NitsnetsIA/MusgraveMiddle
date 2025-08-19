# Grocery PIM System

## Overview
This project provides a headless GraphQL microservice for managing grocery products and Spanish VAT taxes. It serves as a backend for frontend applications, offering a complete CRUD API for product and tax data synchronization. The system utilizes PostgreSQL for persistence, features timezone-aware timestamps for efficient data synchronization, and includes functionality for automatic order simulation and SFTP integration with legacy systems. The business vision is to provide a robust, scalable backend solution for grocery product information management, enabling seamless data flow between various client applications and legacy systems.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend utilizes **React 18** with **TypeScript**, built with **Vite**. **shadcn/ui** components, based on **Radix UI** primitives, provide accessible UI elements, styled with **Tailwind CSS** for a utility-first approach and theming. **Wouter** is used for client-side routing.

### Technical Implementations
The backend is an **Express.js** server hosting an **Apollo Server v5** GraphQL API. **Drizzle ORM** manages type-safe database operations with **PostgreSQL**. The architecture is headless, designed for consumption by frontend applications. Key features include:
- Timestamp-based synchronization for all entities.
- SHA3 password hashing with email as salt for user authentication. Default password is "password123" for all users. CSV import supports both direct hash import and password-based hashing.
- Atomic purchase order creation with line items via `createPurchaseOrderWithItems` mutation.
- Automatic order simulation upon purchase order creation from frontend apps.
- SFTP integration for legacy system communication (Musgrave SFTP), including CSV export of purchase orders and comprehensive CSV import for master data (taxes, delivery centers, stores, users, products).
- Intelligent CSV import optimization with smart data comparison to update records only when data actually differs.
- Robust EAN-13 generation with proper checksums and uniqueness guarantees.
- Client synchronization support via `server_sent_at` field in purchase orders, allowing frontend-controlled timestamps for `created_at`, `updated_at`, and `server_sent_at`.
- Real-time progress feedback for CSV generation processes in the frontend.

### Feature Specifications
The system supports:
- CRUD operations for products, taxes, delivery centers, stores, users, purchase orders, and processed orders.
- Spanish VAT tax codes (General, Reducido, Superreducido, Alimentación, Exento).
- Pagination support for large datasets.
- Sync info endpoint (`sync_info`) providing last updated timestamps for all key entities to facilitate client synchronization.
- Granular control and Spanish-contextualized entity generation with dependency validation.
- Export of comprehensive entity data to SFTP `/out/` folders in consolidated CSV files, including enriched data not directly stored in the database.

### System Design Choices
- **Headless architecture**: Decoupled backend for flexible frontend development.
- **GraphQL API**: Provides a flexible and efficient way to query and manipulate data.
- **PostgreSQL with Drizzle ORM**: For robust, type-safe, and scalable data persistence.
- **Timezone-aware timestamps**: For accurate global data synchronization.
- **Security**: SHA3-256 hashing with individual email salt for user passwords.
- **Automated workflows**: Order simulation and SFTP data exchange are automated.

## External Dependencies

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting.
- **Drizzle ORM**: Type-safe database client and migration tool.

### UI & Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **shadcn/ui**: Pre-built component library.

### Development Tools
- **Vite**: Fast build tool and development server.
- **TypeScript**: Static type checking.

### API & Data Fetching
- **Apollo Server**: GraphQL server implementation.
- **TanStack Query**: Data synchronization for React applications.
- **GraphQL**: Query language for APIs.

### Form Handling
- **React Hook Form**: Performant forms with validation.
- **Zod**: TypeScript-first schema validation.

### Utilities
- **date-fns**: JavaScript date utility library.
- **nanoid**: URL-safe unique string ID generator.