/**
 * ═══════════════════════════════════════════════════════════════
 * Script de Seeding - PRODUCTION
 * ═══════════════════════════════════════════════════════════════
 * 
 * Ce script crée UNIQUEMENT les données minimales nécessaires en production:
 * - PAS de compte admin
 * - PAS de données de test
 * - Seulement les données système si nécessaire
 * 
 * Usage: node dist/scripts/seed-production.js
 * ═══════════════════════════════════════════════════════════════
 */

import { pool } from '../config/database';

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 PRODUCTION SEED - Starting...');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    // Vérification de la connexion à la base de données
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT 1');
    console.log('  ✅ Database connection OK');
    
    // Vérification que les tables existent
    console.log('');
    console.log('🔍 Checking tables...');
    
    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    console.log(`  ${usersTable.rows[0].exists ? '✅' : '❌'} Table 'users' exists`);
    
    const eventsTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'events'
      )
    `);
    console.log(`  ${eventsTable.rows[0].exists ? '✅' : '❌'} Table 'events' exists`);
    
    // En production, on ne crée PAS de données de test
    // Les utilisateurs doivent s'inscrire normalement
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ PRODUCTION SEED - Completed!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('ℹ️  No test data created in production environment.');
    console.log('ℹ️  Users must register through the application.');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ PRODUCTION SEED - Failed!');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(error);
    process.exit(1);
  }
}

// Exécution si appelé directement
main().catch(console.error);
