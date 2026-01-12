# 🚀 Plan d'Implémentation CI/CD - Secret Santa

## 📋 Statut d'avancement

| Phase | Description | Statut |
|-------|-------------|--------|
| Phase 1 | Dockerisation | ✅ Terminé |
| Phase 2 | Docker Compose variable | ✅ Terminé |
| Phase 3 | Scripts de seeding | ✅ Terminé |
| Phase 4 | Pipeline GitHub Actions | ✅ Terminé |
| Phase 5 | Documentation OpenAPI | ✅ Terminé |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (port 80)                          │
├─────────────────────────────────────────────────────────────┤
│     /api/*  →  Backend Express (3000)                       │
│     /*      →  Frontend Next.js (3001)                      │
├─────────────────────────────────────────────────────────────┤
│                PostgreSQL (réseau interne)                  │
│                Non exposé publiquement                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Fichiers créés

### Docker

| Fichier | Description |
|---------|-------------|
| `docker/Dockerfile` | Image multistage Node 20 Alpine, user non-root, healthcheck |
| `docker/nginx/nginx.conf` | Reverse proxy avec routage API/Frontend |
| `.dockerignore` | Exclusions pour le build Docker |

### Docker Compose

| Fichier | Description |
|---------|-------------|
| `docker-compose.yml` | Configuration de base (nginx, backend, frontend, postgres) |
| `docker-compose.staging.yml` | Override staging : seeding complet, port DB exposé |
| `docker-compose.production.yml` | Override production : seeding minimal, aucun port exposé |

### CI/CD

| Fichier | Description |
|---------|-------------|
| `.github/workflows/ci-cd.yml` | Pipeline GitHub Actions complet |

### Seeding

| Fichier | Description |
|---------|-------------|
| `src/scripts/seed-staging.ts` | Admin + 10 users + 5 events |
| `src/scripts/seed-production.ts` | Vérification DB uniquement |

### Documentation OpenAPI

| Fichier | Description |
|---------|-------------|
| `src/docs/openapi.yaml` | Définitions principales (schemas, info, tags) |
| `src/docs/paths/health.yaml` | Endpoint /health |
| `src/docs/paths/auth.yaml` | Endpoints /api/auth/* |

### Configuration

| Fichier | Description |
|---------|-------------|
| `.env.example` | Template des variables d'environnement |

---

## 🔄 Pipeline GitHub Actions

```
┌─────────────────────────────────────────────────────────────┐
│ push develop  →  Tests  →  Build  →  Push ghcr.io  →  Deploy Staging    │
│ push main     →  Tests  →  Build  →  Push ghcr.io  →  Deploy Production │
│ pull_request  →  Tests only                                              │
└─────────────────────────────────────────────────────────────┘
```

### Jobs

1. **test** : PostgreSQL service, pnpm install, build, jest --coverage
2. **build** : Login ghcr.io, build Docker multistage, push avec tags
3. **deploy-staging** : Vérification secrets, simulation déploiement
4. **deploy-production** : Vérification secrets, simulation déploiement

### Tags Docker générés

| Branche | Tags |
|---------|------|
| `main` | `latest`, `production`, `main`, `<sha>` |
| `develop` | `staging`, `develop`, `<sha>` |

---

## 🔐 Secrets GitHub à configurer

Settings > Secrets and variables > Actions :

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Clé SSH pour déploiement |
| `SERVER_HOST` | IP/hostname du serveur |
| `SERVER_USER` | Utilisateur SSH |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Secret pour tokens JWT |

---

## 🔒 Sécurité implémentée

- ✅ Image Docker avec utilisateur non-root
- ✅ Base de données non exposée (réseau Docker interne)
- ✅ Variables requises avec validation (`DB_PASSWORD:?`, `JWT_SECRET:?`)
- ✅ CORS configuré (pas de `*`)
- ✅ Pas de `.env` dans les images Docker
- ✅ Healthchecks pour tous les services

---

## 🧪 Commandes

```bash
# Lancer en staging
pnpm docker:staging

# Lancer en production  
pnpm docker:production

# Arrêter
pnpm docker:down

# Build local
pnpm docker:build

# Seeding manuel
pnpm seed:staging
pnpm seed:production
```

---

## 👤 Comptes de test (Staging uniquement)

| Email | Password |
|-------|----------|
| admin@test.com | Admin123! |
| alice@test.com | Test123! |
| bob@test.com | Test123! |

---

## 📚 Lancement pour correction

### Prérequis
- Docker & Docker Compose
- Git

### Instructions

```bash
# 1. Cloner
git clone <repo-url>
cd ynov-secret-santa-back-end

# 2. Créer .env
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Lancer
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# 4. Accéder
# App: http://localhost
# Swagger: http://localhost/api-docs
# Health: http://localhost/health
```
