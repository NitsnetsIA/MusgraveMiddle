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
    app.all("/graphql", async (req, res) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Apollo-Require-Preflight': 'true',
        };
        
        // Add selected headers from the original request
        if (req.headers.authorization) {
          headers.authorization = req.headers.authorization;
        }
        
        const response = await fetch(graphqlUrl, {
          method: req.method,
          headers,
          body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
        });
        
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (error) {
        console.error('GraphQL proxy error:', error);
        res.status(500).json({ 
          errors: [{ message: 'GraphQL server unavailable' }] 
        });
      }
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