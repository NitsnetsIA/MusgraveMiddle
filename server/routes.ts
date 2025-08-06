import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { seedDatabase } from "./seed.js";
// Note: GraphQL Playground will use custom implementation due to ES module compatibility

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  console.log("Starting server initialization...");

  try {
    // Seed database on startup with retry logic
    let seedAttempts = 0;
    const maxSeedAttempts = 3;
    
    while (seedAttempts < maxSeedAttempts) {
      try {
        await seedDatabase();
        break;
      } catch (seedError) {
        seedAttempts++;
        console.log(`Database seed attempt ${seedAttempts} failed:`, seedError);
        
        if (seedAttempts === maxSeedAttempts) {
          console.error("Failed to seed database after maximum attempts. Continuing without seeding...");
        } else {
          console.log(`Retrying database seed in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Create Apollo Server instance with introspection enabled
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      formatError: (formattedError) => {
        console.error('GraphQL Error:', formattedError);
        return {
          message: formattedError.message,
          code: formattedError.extensions?.code,
          path: formattedError.path,
        };
      },
      csrfPrevention: false,
      introspection: true, // Enable introspection for schema exploration
    });

    // Start the standalone Apollo Server with GraphQL Playground enabled
    let graphqlUrl = "http://localhost:4000/";
    try {
      const { url } = await startStandaloneServer(apolloServer, {
        listen: { port: 4000, host: "127.0.0.1" },
        context: async ({ req }) => {
          return {};
        },
      });
      graphqlUrl = url;
      console.log(`🚀 GraphQL Server ready at ${url} (internal only)`);
    } catch (graphqlError) {
      console.error("Failed to start GraphQL server:", graphqlError);
    }
    
    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: "ok", 
        service: "grocery-pim-graphql",
        graphql_endpoint: "/graphql",
        timestamp: new Date().toISOString()
      });
    });

    // Direct GraphQL endpoint using Apollo server resolvers (no proxy)
    app.all("/graphql", async (req, res) => {
      console.log(`${req.method} request to /graphql received from ${req.get('host')} - User-Agent: ${req.get('User-Agent')}`);
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apollo-Require-Preflight');
        return res.status(200).end();
      }
      try {
        console.log('Direct GraphQL request to internal Apollo:', JSON.stringify(req.body));
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apollo-Require-Preflight');
        
        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Apollo-Require-Preflight': 'true',
          },
          body: JSON.stringify(req.body),
        });
        
        if (!response.ok) {
          throw new Error(`GraphQL server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('GraphQL response success');
        res.json(data);
      } catch (error) {
        console.error('GraphQL endpoint error:', error);
        res.status(500).json({ 
          errors: [{ message: 'Internal GraphQL error', details: error instanceof Error ? error.message : 'Unknown error' }] 
        });
      }
    });

    // OPTIONS preflight for CORS
    app.options("/graphql", (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Apollo-Require-Preflight');
      res.status(200).end();
    });

    console.log(`🚀 Headless GraphQL API ready at /graphql`);

    // Ensure our routes are registered with high priority
    app._router.stack.unshift(...app._router.stack.splice(-10));

    console.log("Server routes registered successfully");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Routes registered:");
    app._router.stack.forEach((layer: any, index: number) => {
      if (layer.route) {
        console.log(`  [${index}] ${Object.keys(layer.route.methods)} ${layer.route.path}`);
      } else if (layer.name) {
        console.log(`  [${index}] middleware: ${layer.name}`);
      }
    });
    return httpServer;
    
  } catch (error) {
    console.error("Error during server initialization:", error);
    
    // Still return the HTTP server even if GraphQL setup fails
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: "degraded", 
        service: "grocery-pim-graphql",
        error: "GraphQL server failed to start",
        timestamp: new Date().toISOString()
      });
    });
    
    return httpServer;
  }
}