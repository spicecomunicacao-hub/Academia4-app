import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configuração de CORS para aceitar requisições do Netlify
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',    // Desenvolvimento local
    'http://localhost:5000',    // Servidor local alternativo
    'https://localhost:5173',   // HTTPS local (se usado)
    /^https:\/\/.*\.netlify\.app$/,  // Qualquer subdomínio do Netlify
    /^https:\/\/.*\.replit\.dev$/,   // Qualquer subdomínio do Replit (se necessário)
  ];

  // Debug: Log da origem recebida
  console.log('🌐 Origin recebida:', origin);

  // Verificar se a origem está permitida
  const isAllowedOrigin = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    if (allowed instanceof RegExp) {
      return origin && allowed.test(origin);
    }
    return false;
  });

  console.log('✅ Origem permitida:', isAllowedOrigin);

  // Sempre definir o cabeçalho CORS
  if (isAllowedOrigin && origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // Para origens não permitidas, ainda definimos alguns cabeçalhos básicos
    res.header('Access-Control-Allow-Origin', 'null');
    res.header('Access-Control-Allow-Credentials', 'false');
  }

  // Sempre definir estes cabeçalhos
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight por 24 horas
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('📋 Requisição OPTIONS (preflight) recebida');
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
