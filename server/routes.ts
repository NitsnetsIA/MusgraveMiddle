import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { seedDatabase } from "./seed.js";
import expressPlayground from "graphql-playground-middleware-express";

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

    // Start the standalone Apollo Server on port 4000 (for internal communication)
    let graphqlUrl = "http://localhost:4000/";
    try {
      const { url } = await startStandaloneServer(apolloServer, {
        listen: { port: 4000, host: "127.0.0.1" }, // Only bind to localhost
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

    console.log(`🚀 Public GraphQL endpoint ready at /graphql`);

    // GraphQL Playground - disponible en desarrollo y producción
    app.get('/playground', expressPlayground({ 
      endpoint: '/graphql',
      settings: {
        'editor.theme': 'dark',
        'editor.cursorShape': 'line',
        'editor.reuseHeaders': true,
        'tracing.hideTracingResponse': true,
        'request.credentials': 'include',
      }
    }));

    // También crear una página simple de info con links
    app.get('/graphql-info', (req, res) => {
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>GraphQL API - Grocery PIM</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .endpoint { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .button { display: inline-block; background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px; }
            .example { background: #e8f4ff; padding: 15px; border-left: 4px solid #007cba; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>🛒 Grocery PIM - GraphQL API</h1>
          
          <div class="endpoint">
            <h3>🚀 Endpoints Disponibles:</h3>
            <p><strong>GraphQL API:</strong> <code>${baseUrl}/graphql</code></p>
            <p><strong>GraphQL Playground:</strong> <code>${baseUrl}/playground</code></p>
            <p><strong>Health Check:</strong> <code>${baseUrl}/api/health</code></p>
          </div>

          <a href="/playground" class="button">🎮 Abrir GraphQL Playground</a>
          <a href="/api/health" class="button">❤️ Health Check</a>

          <div class="example">
            <h3>📝 Ejemplo de consulta:</h3>
            <pre>query GetProducts {
  products(limit: 5) {
    products {
      ean
      title
      base_price
      image_url
      tax {
        name
        tax_rate
      }
    }
    total
  }
}</pre>
          </div>

          <div class="example">
            <h3>🔄 Generar productos de ejemplo:</h3>
            <pre>mutation GenerateProducts {
  generateRandomProducts(count: 10) {
    success
    createdCount
    message
  }
}</pre>
          </div>

        </body>
        </html>
      `);
    });

    console.log(`🎮 GraphQL Playground disponible en /playground`);
    console.log(`📋 Información de la API en /graphql-info`);

    console.log("Server routes registered successfully");
    console.log("Routes registered:");
    app._router.stack.forEach((layer: any) => {
      if (layer.route) {
        console.log(`  ${Object.keys(layer.route.methods)} ${layer.route.path}`);
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