import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Seed database on startup
  await seedDatabase();

  // Create a separate Apollo Server instance for GraphQL
  const server = new ApolloServer({
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
  });

  // Start the GraphQL server on a separate port temporarily
  // In production, you might want to use the same port with proper middleware
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      return {
        // Add any context you need here
      };
    },
  });

  console.log(`🚀 GraphQL Server ready at ${url}`);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      service: "grocery-pim-graphql",
      graphql_endpoint: url,
      timestamp: new Date().toISOString()
    });
  });

  // Proxy GraphQL requests to the standalone server
  app.use("/graphql", (req, res) => {
    res.redirect(`http://localhost:4000/`);
  });

  return httpServer;
}