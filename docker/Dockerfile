# ═══════════════════════════════════════════════════════════════
# Stage 1: Builder - Installation des dépendances et compilation
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Installation de pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation des dépendances (incluant devDependencies pour le build)
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY tsconfig.json ./
COPY src ./src
COPY database ./database

# Compilation TypeScript
RUN pnpm build

# Suppression des devDependencies pour l'image de production
RUN pnpm prune --prod

# ═══════════════════════════════════════════════════════════════
# Stage 2: Production - Image légère et sécurisée
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS production

WORKDIR /app

# Installation de wget pour le healthcheck
RUN apk add --no-cache wget

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/database ./database

# Passage à l'utilisateur non-root
USER nodejs

# Exposition du port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck - vérifie que l'API répond
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Démarrage de l'application
CMD ["node", "dist/index.js"]
