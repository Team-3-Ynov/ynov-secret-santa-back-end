import "dotenv/config";
import * as Sentry from "@sentry/node";
import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { pool } from "./config/database";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";

const app: Express = express();

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    success: false,
    message: "Trop de requêtes, réessayez plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting strict pour l'authentification (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives max
  message: {
    success: false,
    message: "Trop de tentatives de connexion, réessayez dans 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Sécurité : headers HTTP
app.use(helmet());

app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" })); // Limite la taille des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Appliquer le rate limiting global (sauf en test)
if (process.env.NODE_ENV !== "test") {
  app.use(globalLimiter);
}

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Secret Santa API - Documentation",
  })
);

app.get("/api-docs.json", (_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/health", async (_, res) => {
  try {
    // Vérifie la connexion à la base de données
    await pool.query("SELECT 1");
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (_error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      environment: process.env.NODE_ENV || "development",
    });
  }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Route 404 - doit être après toutes les autres routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} non trouvée`,
  });
});

Sentry.setupExpressErrorHandler(app);

// Gestionnaire d'erreurs global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Erreur non gérée:", err);
  // Capture Sentry
  Sentry.captureException(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Erreur serveur interne" : err.message,
  });
});

export default app;
