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

    // GraphQL Playground simple - funciona tanto en desarrollo como producción
      app.get('/playground', (req, res) => {
        const host = req.get('host');
        const protocol = req.get('x-forwarded-proto') || 'http';
        const baseUrl = `${protocol}://${host}`;
        
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>GraphQL Playground - Grocery PIM</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
            <style>
              body { margin: 0; font-family: Arial, sans-serif; }
              .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; max-width: 800px; margin: 0 auto; }
              .query-box { width: 100%; height: 200px; font-family: monospace; padding: 10px; border: 1px solid #ccc; }
              .button { background: #3b82f6; color: white; padding: 10px 20px; border: none; cursor: pointer; margin: 10px 5px; }
              .result { background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin-top: 20px; }
              .examples { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
              .example { background: #f8f9fa; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🛒 GraphQL Playground - Grocery PIM</h1>
              <p>Endpoint: ${baseUrl}/graphql</p>
            </div>
            
            <div class="content">
              <div>
                <textarea id="query" class="query-box" placeholder="Escribe tu consulta GraphQL aquí...">query GetProducts {
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
}</textarea>
                <br>
                <button class="button" onclick="executeQuery()">🚀 Ejecutar Consulta</button>
                <button class="button" onclick="loadExample('products')">📦 Ejemplo: Productos</button>
                <button class="button" onclick="loadExample('generate')">🔄 Ejemplo: Generar Productos</button>
              </div>
              
              <div id="result" class="result" style="display: none;">
                <h3>Resultado:</h3>
                <pre id="resultContent"></pre>
              </div>

              <div class="examples">
                <div class="example">
                  <h4>📋 Consultas Disponibles:</h4>
                  <ul>
                    <li>products - Obtener productos</li>
                    <li>taxes - Obtener impuestos</li>
                    <li>productsByDateRange - Productos por fecha</li>
                  </ul>
                </div>
                <div class="example">
                  <h4>🔄 Mutaciones Disponibles:</h4>
                  <ul>
                    <li>generateRandomProducts - Generar productos</li>
                    <li>deleteAllProducts - Eliminar todos los productos</li>
                  </ul>
                </div>
              </div>
            </div>

            <script>
              function loadExample(type) {
                const query = document.getElementById('query');
                if (type === 'products') {
                  query.value = \`query GetProducts {
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
}\`;
                } else if (type === 'generate') {
                  query.value = \`mutation GenerateProducts {
  generateRandomProducts(count: 10) {
    success
    createdCount
    message
    products {
      ean
      title
      base_price
    }
  }
}\`;
                }
              }

              async function executeQuery() {
                const query = document.getElementById('query').value;
                const resultDiv = document.getElementById('result');
                const resultContent = document.getElementById('resultContent');
                
                try {
                  const response = await fetch('${baseUrl}/graphql', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Apollo-Require-Preflight': 'true'
                    },
                    body: JSON.stringify({ query })
                  });
                  
                  const result = await response.json();
                  resultDiv.style.display = 'block';
                  resultContent.textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                  resultDiv.style.display = 'block';
                  resultContent.textContent = 'Error: ' + error.message;
                }
              }
            </script>
          </body>
          </html>
        `);
      });
      console.log('🎮 GraphQL Playground simple disponible en /playground');

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

    console.log(`📋 Información de la API en /graphql-info`);

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