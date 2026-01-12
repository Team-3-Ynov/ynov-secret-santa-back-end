import 'dotenv/config';
import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import { createEventHandler } from './controllers/eventController';

const app: Express = express();

// Middleware
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

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Secret Santa! 🎅' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Route legacy
app.post('/events', createEventHandler);

export default app;
