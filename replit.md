# Grocery PIM System

## Overview

This is a headless GraphQL microservice for managing grocery products and Spanish VAT taxes with timestamp-based synchronization. The system provides a complete CRUD API for grocery products and tax information via GraphQL, specifically designed to serve as a backend for frontend applications requiring product and tax data synchronization. The system uses PostgreSQL for persistence and includes timezone-aware timestamps for efficient data synchronization.

**Recent Updates (January 2025):**
- Added automatic product image generation using Placehold.co service
- Implemented GraphQL proxy for production deployment compatibility  
- Fixed public endpoint accessibility for Replit deployments
- Products now include category-appropriate placeholder images with EAN codes
- Simplified to headless-only GraphQL API for production (removed web interfaces)
- GraphQL Playground available only in development environment via Apollo Server
- **Created individual entity generation methods with dependency validation**
- **Added Spanish-contextualized entity generation with coherent relationships**
- **Implemented granular control for generating specific entity types**
- **Added eye button functionality for viewing order details in both purchase orders and processed orders**
- **Implemented SHA3 password hashing with individual email as salt for enhanced security**
- **Enforced default user Luis Romero Pérez (luis@esgranvia.es) with store ES001 and password 'password123'**
- **Guaranteed ES001 store creation as first store for default user assignment**

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern React features
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for client-side routing instead of React Router for a lighter footprint
- **TanStack Query** for server state management and API caching
- **shadcn/ui** component library built on Radix UI primitives for accessible UI components
- **Tailwind CSS** for utility-first styling with CSS variables for theming
- **React Hook Form** with Zod resolvers for form validation

### Backend Architecture
- **Express.js** server with TypeScript serving as application host
- **Apollo Server v5** providing standalone GraphQL API on port 4000
- **Drizzle ORM** for type-safe database operations and schema management
- **PostgreSQL** as the primary database with timezone-aware timestamps
- **Headless architecture** designed for consumption by frontend applications

### Database Design
- **Products table**: Stores grocery items with EAN codes, pricing, descriptions, and tax associations
- **Taxes table**: Manages Spanish VAT tax rates (General, Reducido, Superreducido, Alimentación, Exento)
- **Delivery Centers table**: Manages distribution centers for order fulfillment
- **Stores table**: Individual store locations linked to delivery centers, ES001 guaranteed as first store
- **Users table**: Store personnel with SHA3 authentication using email as salt, Luis Romero Pérez as default user
- **Purchase Orders table**: Customer orders before processing and confirmation
- **Purchase Order Items table**: Individual line items within purchase orders
- **Orders table**: Final processed orders derived from purchase orders
- **Order Items table**: Line items for final processed orders
- **Foreign key relationships**: Complete referential integrity across all entities
- **Timestamps**: Automatic created_at and updated_at tracking for all entities
- **Security**: SHA3-256 password hashing with individual email salt for each user

### API Architecture
- **GraphQL schema** with queries for products and taxes, including timestamp-based filtering
- **Mutations** for complete CRUD operations on both products and taxes  
- **Timestamp synchronization** supporting UTC timestamps for data change tracking
- **Spanish VAT tax codes** including General (21%), Reducido (10%), Superreducido (4% for food), and Exento (0%)
- **Pagination support** with configurable limits (default 100) for handling large datasets
- **Type-safe resolvers** with database relation queries
- **Error handling** with formatted GraphQL errors and comprehensive logging
- **Sync info endpoint** (`sync_info`) providing last updated timestamps for client synchronization across users, products, stores, delivery_centers, purchase_orders, and taxes entities
- **Individual entity generation methods** with dependency validation for granular control
- **Entity generation with Spanish context** using authentic Spanish names, cities, and business structures
- **Dependency validation** preventing creation of child entities without required parent entities

### Development Environment
- **Replit integration** with custom plugins for development banner and cartographer
- **Hot reload** through Vite's development server
- **Database migrations** managed through Drizzle Kit
- **TypeScript compilation** with strict mode enabled

### State Management
- **Server state**: Managed by TanStack Query with automatic caching and background updates
- **Form state**: Handled by React Hook Form with Zod schema validation
- **UI state**: Local React state and context for modals, toasts, and component interactions

## External Dependencies

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database client and migration tool

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with customizable design system

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds

### API & Data Fetching
- **Apollo Server**: GraphQL server implementation
- **TanStack Query**: Powerful data synchronization for React applications
- **GraphQL**: Query language for APIs providing flexible data fetching

### Form Handling
- **React Hook Form**: Performant forms with easy validation
- **Hookform Resolvers**: Integration between React Hook Form and validation libraries
- **Zod**: TypeScript-first schema validation

### Utilities
- **date-fns**: Modern JavaScript date utility library
- **clsx & class-variance-authority**: Utility functions for conditional CSS classes
- **nanoid**: URL-safe unique string ID generator