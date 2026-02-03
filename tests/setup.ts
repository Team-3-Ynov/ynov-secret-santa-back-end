// Configuration globale pour les tests
import 'dotenv/config';

// Mock des variables d'environnement pour les tests
process.env.JWT_SECRET ??= 'test-secret-key';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5432';
process.env.DB_NAME ??= 'secret_santa_test';
process.env.DB_USER ??= 'postgres';
process.env.DB_PASSWORD ??= 'postgres';

