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
PORT=3001

# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secret_santa
DB_USER=postgres
DB_PASSWORD=postgres

# Configuration JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# SMTP / MailHog (développement)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:3000

# Mapping postgres port on docker
POSTGRES_PORT_MAPPING=5432:5432
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

### 5. Appliquer les migrations

```bash
pnpm migrate
```

### 6. Lancer le serveur backend

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
| `PORT` | Port du serveur | `3001` |
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_NAME` | Nom de la base | `secret_santa` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `JWT_SECRET` | Clé secrète JWT | - |
| `JWT_EXPIRES_IN` | Durée de validité du token | `7d` |
| `NODE_ENV` | Environnement | `development` |
| `SMTP_HOST` | Hôte SMTP | `localhost` |
| `SMTP_PORT` | Port SMTP | `1025` |
| `SMTP_USER` | Utilisateur SMTP | - |
| `SMTP_PASS` | Mot de passe SMTP | - |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` |

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

**<http://localhost:3001/api-docs>**

> 💡 MailHog (visualisation des emails) : **<http://localhost:8025>**

Vous pouvez également récupérer la spécification OpenAPI au format JSON :

**<http://localhost:3001/api-docs.json>**

## 🔗 Endpoints

### Health Check

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Vérifier la connexion à la base de données |

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter |
| `POST` | `/api/auth/refresh` | Rafraîchir le token JWT |
| `POST` | `/api/auth/logout` | Se déconnecter |

### Utilisateurs

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/users/me` | Récupérer son profil | ✅ |
| `PUT` | `/api/users/me` | Mettre à jour son profil | ✅ |
| `PUT` | `/api/users/me/password` | Changer son mot de passe | ✅ |
| `GET` | `/api/users/:id/public` | Profil public d'un utilisateur | ✅ |

### Événements

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `POST` | `/api/events` | Créer un événement | ✅ |
| `GET` | `/api/events` | Lister mes événements | ✅ |
| `GET` | `/api/events/:id` | Détails d'un événement | ✅ |
| `PUT` | `/api/events/:id` | Modifier un événement | ✅ |
| `DELETE` | `/api/events/:id` | Supprimer un événement | ✅ |
| `POST` | `/api/events/:id/invite` | Inviter un utilisateur | ✅ |
| `GET` | `/api/events/:id/invitations` | Lister les invitations | ✅ |
| `DELETE` | `/api/events/:id/invitations/:invitationId` | Annuler une invitation | ✅ |
| `POST` | `/api/events/:id/join` | Rejoindre un événement | ✅ |
| `GET` | `/api/events/:id/participants` | Lister les participants | ✅ |
| `PATCH` | `/api/events/:id/exclusions` | Ajouter une exclusion | ✅ |
| `GET` | `/api/events/:id/exclusions` | Lister les exclusions | ✅ |
| `DELETE` | `/api/events/:id/exclusions/:exclusionId` | Supprimer une exclusion | ✅ |
| `POST` | `/api/events/:id/draw` | Lancer le tirage au sort | ✅ |
| `GET` | `/api/events/:id/my-assignment` | Voir son assignation | ✅ |

### Notifications 🔔

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/notifications` | Lister mes notifications + `unreadCount` | ✅ |
| `GET` | `/api/notifications/unread-count` | Nombre de notifications non lues | ✅ |
| `PATCH` | `/api/notifications/read-all` | Tout marquer comme lu | ✅ |
| `PATCH` | `/api/notifications/:id/read` | Marquer une notification comme lue | ✅ |

> 💡 Après un tirage au sort, chaque participant reçoit automatiquement une notification en base de données **et** un email lui indiquant à qui il doit offrir un cadeau.

### Exemples de requêtes

#### Inscription

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MonMotDePasse123",
    "username": "johndoe"
  }'
```

#### Connexion

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MonMotDePasse123"
  }'
```

#### Récupérer ses notifications

```bash
curl -X GET http://localhost:3001/api/notifications \
  -H "Authorization: Bearer <token>"
```

#### Marquer toutes les notifications comme lues

```bash
curl -X PATCH http://localhost:3001/api/notifications/read-all \
  -H "Authorization: Bearer <token>"
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
| Controllers | ~95% |
| Services | ~80% |
| Middlewares | 100% |
| Models | 100% |
| Schemas | 100% |
| Utils | 100% |

## 📁 Structure du projet

```
src/
├── config/
│   ├── database.ts              # Configuration PostgreSQL
│   └── swagger.ts               # Configuration Swagger
├── controllers/
│   ├── auth.controller.ts       # Authentification
│   ├── event.controller.ts      # Événements
│   ├── notification.controller.ts # Notifications
│   └── user.controller.ts       # Utilisateurs
├── middlewares/
│   ├── auth.middleware.ts        # Vérification JWT
│   └── validation.middleware.ts  # Validation Zod
├── models/
│   ├── assignment.model.ts       # Assignations
│   ├── event.model.ts            # Événements
│   ├── exclusion.model.ts        # Exclusions
│   ├── invitation.model.ts       # Invitations
│   ├── notification.model.ts     # Notifications
│   ├── refresh_token.model.ts    # Refresh tokens
│   └── user.model.ts             # Utilisateurs
├── routes/
│   ├── auth.routes.ts            # Routes auth
│   ├── event.routes.ts           # Routes événements
│   ├── notification.routes.ts    # Routes notifications
│   └── user.routes.ts            # Routes utilisateurs
├── services/
│   ├── email.service.ts          # Envoi d'emails (invitation + résultat tirage)
│   ├── event.service.ts          # Logique métier événements
│   ├── notification.service.ts   # Logique métier notifications
│   └── user.service.ts           # Logique métier utilisateurs
├── schemas/
│   └── auth.schema.ts            # Schémas de validation
├── types/
│   └── user.types.ts             # Types TypeScript
├── utils/
│   └── jwt.utils.ts              # Utilitaires JWT
└── index.ts                      # Point d'entrée

database/
└── migrations/
    ├── 001_init_schema.sql           # Users, Events, Invitations, Assignments
    ├── 002_add_exclusions_table.sql  # Exclusions de tirage
    └── 003_add_notifications_table.sql # Notifications in-app
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
pnpm migrate
```

## 📧 Test des Emails

### Avec MailHog (Local)

Pour tester l'envoi d'emails sans utiliser de véritable adresse, ce projet utilise [MailHog](https://github.com/mailhog/MailHog).

1. Démarrer les services Docker (Postgres + MailHog) :

    ```bash
    docker compose --profile infra up -d
    ```

2. Accéder à l'interface MailHog : [http://localhost:8025](http://localhost:8025)
3. Vérifier que le fichier `.env` est configuré pour MailHog :

    ```env
    SMTP_HOST=localhost
    SMTP_PORT=1025
    SMTP_USER=test
    SMTP_PASS=test
    ```

### Envoyer un Email de Test

Un script utilitaire est disponible pour vérifier rapidement la configuration :

```bash
npx ts-node scripts/send-test-email.ts
```

L'email apparaîtra dans l'interface MailHog (si configuré) ou sera envoyé réellement (si configuration SMTP réelle).


