# 🎅 Secret Santa API

API Backend pour Secret Santa.

## 📋 Table des matières

- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Commandes disponibles](#-commandes-disponibles)
- [Documentation API](#-documentation-api)
- [Endpoints](#-endpoints)
- [Tests](#-tests)
- [Structure du projet](#-structure-du-projet)

## 🛠 Technologies

| Technologie | Version | Description |
|-------------|---------|-------------|
| Node.js | 20+ | Runtime JavaScript |
| TypeScript | 5.x | Typage statique |
| Express | 5.x | Framework web |
| PostgreSQL | 16 | Base de données |
| JWT | - | Authentification |
| Zod | 4.x | Validation des données |
| Jest | 30.x | Tests unitaires |
| Swagger | - | Documentation API |

## 📦 Prérequis

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) (gestionnaire de paquets)
- [Docker](https://www.docker.com/) (pour PostgreSQL)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd ynov-secret-santa-back-end
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Env
NODE_ENV=development

# Configuration du serveur
PORT=3000

# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secret_santa
DB_USER=postgres
DB_PASSWORD=postgres

# Configuration JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 4. Démarrer les services de développement (PostgreSQL + MailHog)

```bash
# Pour le développement (PostgreSQL + MailHog uniquement)
docker compose --profile infra up -d
```

Cela démarre :

- **PostgreSQL** sur le port `5432` (base de données)
- **MailHog** sur le port `1025` (SMTP) et `8025` (interface web)

> **Note** : Le profil `infra` est conçu pour être utilisé avec `pnpm dev` (serveur Node.js local).

> 💡 Accédez à <http://localhost:8025> pour voir les emails envoyés en développement.

### 5. Lancer le serveur backend

```bash
pnpm dev
```

Le serveur démarre sur <http://localhost:3001>

### Commandes Docker utiles

```bash
# Démarrer uniquement l'infrastructure (DB + MailHog)
docker compose --profile infra up -d

# Démarrer tout la stack (Infra + Backend + Nginx)
docker compose --profile all up -d

# Arrêter tous les services
docker compose --profile all down

# Voir les logs
docker compose logs -f

# Redémarrer un service spécifique
docker compose restart postgres
```

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `PORT` | Port du serveur | `3000` |
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom de la base | `secret_santa` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `JWT_SECRET` | Clé secrète JWT | - |
| `JWT_EXPIRES_IN` | Durée de validité du token | `7d` |
| `NODE_ENV` | Environnement | `development` |

## 📜 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Démarrer en mode développement (hot reload) |
| `pnpm build` | Compiler TypeScript vers JavaScript |
| `pnpm start` | Démarrer en production |
| `pnpm test` | Lancer les tests |
| `pnpm test:watch` | Lancer les tests en mode watch |
| `pnpm test:coverage` | Lancer les tests avec couverture de code |
| `pnpm migrate` | Exécuter les migrations de base de données |

## 📚 Documentation API

La documentation Swagger est disponible à l'adresse :

**<http://localhost:3000/api-docs>**

Vous pouvez également récupérer la spécification OpenAPI au format JSON :

**<http://localhost:3000/api-docs.json>**

## 🔗 Endpoints

### Health Check

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/` | Page d'accueil |
| `GET` | `/health` | Vérifier la connexion à la base de données |

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter |

### Exemples de requêtes

#### Inscription

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MonMotDePasse123",
    "username": "johndoe"
  }'
```

#### Connexion

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MonMotDePasse123"
  }'
```

### Règles de validation

#### Mot de passe

- Minimum **8 caractères**
- Au moins **1 majuscule** (A-Z)
- Au moins **1 minuscule** (a-z)
- Au moins **1 chiffre** (0-9)

#### Nom d'utilisateur

- Entre **3 et 50 caractères**
- Uniquement lettres, chiffres et underscores

## 🧪 Tests

Le projet utilise Jest pour les tests unitaires.

```bash
# Lancer tous les tests
pnpm test

# Lancer les tests en mode watch
pnpm test:watch

# Lancer les tests avec couverture
pnpm test:coverage
```

### Couverture de code

| Module | Couverture |
|--------|------------|
| Controllers | ~96% |
| Middlewares | 100% |
| Models | 100% |
| Schemas | 100% |
| Utils | 100% |

## 📁 Structure du projet

```
src/
├── config/
│   ├── database.ts         # Configuration PostgreSQL
│   └── swagger.ts          # Configuration Swagger
├── controllers/
│   └── auth.controller.ts  # Logique d'authentification
├── middlewares/
│   └── validation.middleware.ts  # Validation Zod
├── models/
│   └── user.model.ts       # Requêtes SQL utilisateurs
├── routes/
│   └── auth.routes.ts      # Routes d'authentification
├── schemas/
│   └── auth.schema.ts      # Schémas de validation
├── types/
│   └── user.types.ts       # Types TypeScript
├── utils/
│   └── jwt.utils.ts        # Utilitaires JWT
└── index.ts                # Point d'entrée

database/
└── migrations/
    └── 001_create_users_table.sql
```

## 🐳 Docker

### Démarrer PostgreSQL

```bash
# Infrastructure uniquement
docker compose --profile infra up -d

# Full Stack (avec Backend et Nginx)
docker compose --profile all up -d
```

### Arrêter PostgreSQL

```bash
docker-compose down
```

### Réinitialiser la base de données

```bash
docker-compose down -v
docker-compose up -d
```

## 📧 Test des Emails

### Avec MailHog (Local)

Pour tester l'envoi d'emails sans utiliser de véritable adresse, ce projet utilise [MailHog](https://github.com/mailhog/MailHog).

1. Démarrer les services Docker (Postgres + MailHog) :

    ```bash
    docker-compose up -d
    ```

2. Accéder à l'interface MailHog : [http://localhost:8025](http://localhost:8025)
3. Vérifier que le fichier `.env` est configuré pour MailHog (par défaut) :

    ```env
    SMTP_HOST=localhost
    SMTP_PORT=1025
    SMTP_USER=test
    SMTP_PASS=test
    ```

### Envoyer un Email de Test

Un script utilitaire est disponible pour vérifier rapidement la configuration :

```bash
# Envoyer un email de test à une adresse spécifiée
npx ts-node scripts/send-test-email.ts
```

L'email apparaîtra dans l'interface MailHog (si configuré) ou sera envoyé réellement (si configuration SMTP réelle).
