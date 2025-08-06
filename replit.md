# Grocery PIM System

## Overview

This is a headless GraphQL microservice for managing grocery products and Spanish VAT taxes with timestamp-based synchronization. The system provides a complete CRUD API for grocery products and tax information via GraphQL, specifically designed to serve as a backend for frontend applications requiring product and tax data synchronization. The system uses PostgreSQL for persistence and includes timezone-aware timestamps for efficient data synchronization.

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
- **Foreign key relationships**: Products reference taxes through tax_code
- **Timestamps**: Automatic created_at and updated_at tracking for audit trails

### API Architecture
- **GraphQL schema** with queries for products and taxes, including timestamp-based filtering
- **Mutations** for complete CRUD operations on both products and taxes  
- **Timestamp synchronization** supporting UTC timestamps for data change tracking
- **Spanish VAT tax codes** including General (21%), Alimentación (4%), Reducido (10%), Superreducido (4%), and Exento (0%)
- **Type-safe resolvers** with database relation queries
- **Error handling** with formatted GraphQL errors and comprehensive logging

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