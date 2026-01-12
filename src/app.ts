import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { pool } from './config/database';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';

const app: Express = express();

// ═══════════════════════════════════════════════════════════════
// Configuration CORS - Règles propres (pas de *)
// ═══════════════════════════════════════════════════════════════
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Secret Santa API - Documentation',
}));

// Route pour récupérer le JSON OpenAPI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ═══════════════════════════════════════════════════════════════
// Healthcheck - Vérifie la connexion DB (doc dans src/docs/paths/health.yaml)
// ═══════════════════════════════════════════════════════════════
app.get('/health', async (req, res) => {
  try {
    // Vérifie la connexion à la base de données
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

export default app;
