import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { seedDatabase } from "./seed.js";

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

    // Create Apollo Server instance
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
    });

    // Start the GraphQL server on a separate port with error handling
    let graphqlUrl = "http://localhost:4000/";
    try {
      const { url } = await startStandaloneServer(apolloServer, {
        listen: { port: 4000 },
        context: async ({ req }) => {
          return {
            // Add any context you need here
          };
        },
      });
      graphqlUrl = url;
      console.log(`🚀 GraphQL Server ready at ${url}`);
    } catch (graphqlError) {
      console.error("Failed to start GraphQL server:", graphqlError);
      console.log("Continuing with REST endpoints only...");
    }

    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: "ok", 
        service: "grocery-pim-graphql",
        graphql_endpoint: graphqlUrl,
        timestamp: new Date().toISOString()
      });
    });

    // Proxy GraphQL requests to the standalone server
    app.post("/graphql", async (req, res) => {
      try {
        console.log('Proxying GraphQL request:', req.body);
        
        const response = await fetch('http://localhost:4000/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Apollo-Require-Preflight': 'true',
          },
          body: JSON.stringify(req.body),
        });
        
        if (!response.ok) {
          throw new Error(`GraphQL server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('GraphQL response:', data);
        res.json(data);
      } catch (error) {
        console.error('GraphQL proxy error:', error);
        res.status(500).json({ 
          errors: [{ message: 'GraphQL server unavailable', details: error instanceof Error ? error.message : 'Unknown error' }] 
        });
      }
    });

    // Handle GET requests to GraphQL endpoint (for GraphQL Playground, introspection, etc.)
    app.get("/graphql", (req, res) => {
      res.json({
        message: "GraphQL endpoint is available. Send POST requests with GraphQL queries.",
        endpoint: "/graphql",
        example: {
          query: "{ products(limit: 5) { products { ean title } } }"
        }
      });
    });

    console.log("Server routes registered successfully");
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