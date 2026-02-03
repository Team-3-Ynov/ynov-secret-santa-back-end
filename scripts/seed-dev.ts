/**
 * ═══════════════════════════════════════════════════════════════
 * Script de Seeding - STAGING
 * ═══════════════════════════════════════════════════════════════
 * 
 * Ce script crée des données de test complètes pour l'environnement staging:
 * - Compte admin pour les tests
 * - Plusieurs utilisateurs avec différents profils
 * - Événements avec différents statuts
 * 
 * Usage: node dist/scripts/seed-staging.js
 * ═══════════════════════════════════════════════════════════════
 */

import { pool } from '../src/config/database';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

const SALT_ROUNDS = 10;

interface SeedUser {
  email: string;
  password: string;
  username: string;
}

interface SeedEvent {
  title: string;
  description: string;
  eventDate: Date;
  budget: number;
  ownerEmail: string;
}

// ═══════════════════════════════════════════════════════════════
// Données de test pour Staging
// ═══════════════════════════════════════════════════════════════

const stagingUsers: SeedUser[] = [
  // Compte Admin pour les tests
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    username: 'admin',
  },
  // Utilisateurs de test
  {
    email: 'alice@test.com',
    password: 'Test123!',
    username: 'alice',
  },
  {
    email: 'bob@test.com',
    password: 'Test123!',
    username: 'bob',
  },
  {
    email: 'charlie@test.com',
    password: 'Test123!',
    username: 'charlie',
  },
  {
    email: 'diana@test.com',
    password: 'Test123!',
    username: 'diana',
  },
  {
    email: 'eve@test.com',
    password: 'Test123!',
    username: 'eve',
  },
  {
    email: 'frank@test.com',
    password: 'Test123!',
    username: 'frank',
  },
  {
    email: 'grace@test.com',
    password: 'Test123!',
    username: 'grace',
  },
  {
    email: 'henry@test.com',
    password: 'Test123!',
    username: 'henry',
  },
  {
    email: 'iris@test.com',
    password: 'Test123!',
    username: 'iris',
  },
];

// Événements de test (dates dans le futur)
const getTestEvents = (): SeedEvent[] => {
  const now = new Date();
  const futureDate = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  return [
    {
      title: 'Secret Santa Noel 2025',
      description: 'Échange de cadeaux pour Noël avec toute la famille !',
      eventDate: futureDate(30),
      budget: 50,
      ownerEmail: 'admin@test.com',
    },
    {
      title: 'Secret Santa Bureau',
      description: 'Secret Santa entre collègues du département IT',
      eventDate: futureDate(14),
      budget: 25,
      ownerEmail: 'alice@test.com',
    },
    {
      title: 'Secret Santa Amis',
      description: 'Entre amis pour les fêtes',
      eventDate: futureDate(21),
      budget: 30,
      ownerEmail: 'bob@test.com',
    },
    {
      title: 'Échange Cadeaux Club Sport',
      description: 'Pour les membres du club',
      eventDate: futureDate(45),
      budget: 20,
      ownerEmail: 'charlie@test.com',
    },
    {
      title: 'Secret Santa Voisins',
      description: 'Échange entre voisins de l\'immeuble',
      eventDate: futureDate(60),
      budget: 15,
      ownerEmail: 'diana@test.com',
    },
  ];
};

// ═══════════════════════════════════════════════════════════════
// Fonctions de seeding
// ═══════════════════════════════════════════════════════════════

async function seedUsers(): Promise<void> {
  console.log('📝 Seeding users...');
  
  for (const user of stagingUsers) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );
      
      if (existing.rows.length > 0) {
        console.log(`  ⏭️  User ${user.email} already exists, skipping`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      await pool.query(
        'INSERT INTO users (email, password, username) VALUES ($1, $2, $3)',
        [user.email, hashedPassword, user.username]
      );
      
      console.log(`  ✅ Created user: ${user.email}`);
    } catch (error) {
      console.error(`  ❌ Error creating user ${user.email}:`, error);
    }
  }
}

async function seedEvents(): Promise<void> {
  console.log('📝 Seeding events...');
  
  const events = getTestEvents();
  
  for (const event of events) {
    try {
      // Vérifier si un événement similaire existe déjà
      const existing = await pool.query(
        'SELECT id FROM events WHERE title = $1 AND owner_email = $2',
        [event.title, event.ownerEmail]
      );
      
      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Event "${event.title}" already exists, skipping`);
        continue;
      }

      const id = randomUUID();
      
      await pool.query(
        `INSERT INTO events (id, title, description, event_date, budget, owner_email) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, event.title, event.description, event.eventDate.toISOString(), event.budget, event.ownerEmail]
      );
      
      console.log(`  ✅ Created event: ${event.title}`);
    } catch (error) {
      console.error(`  ❌ Error creating event "${event.title}":`, error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🌱 STAGING SEED - Starting...');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    await seedUsers();
    console.log('');
    await seedEvents();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ STAGING SEED - Completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('   Admin: admin@test.com / Admin123!');
    console.log('   User:  alice@test.com / Test123!');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ STAGING SEED - Failed!');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(error);
    process.exit(1);
  }
}

// Exécution si appelé directement
main().catch(console.error);
