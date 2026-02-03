import 'dotenv/config';
import { pool } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('🔄 Exécution des migrations...');

  try {
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`▶️ Migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(sql);
      }
    }

    console.log('✅ Toutes les migrations ont été exécutées avec succès!');
  } catch (error) {
    console.error('❌ Erreur critique lors des migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

