import 'dotenv/config';
import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('🔄 Exécution des migrations...');
  
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../../database/migrations/001_create_users_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration
    await pool.query(sql);
    
    console.log('✅ Migrations exécutées avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

