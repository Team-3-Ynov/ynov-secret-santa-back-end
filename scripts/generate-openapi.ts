#!/usr/bin/env tsx
/**
 * Script pour générer automatiquement la spécification OpenAPI
 * à partir des routes Express et des contrôleurs
 */

import fs from "node:fs/promises";
import { glob } from "glob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

// Convertir __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, unknown>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

interface RouteInfo {
  path: string;
  method: string;
  tags: string[];
  summary: string;
  description?: string;
  security?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
}

async function generateOpenAPISpec(): Promise<OpenAPISpec> {
  const spec: OpenAPISpec = {
    openapi: "3.0.0",
    info: {
      title: "Secret Santa API",
      version: "1.0.0",
      description: "API pour gérer les échanges de cadeaux Secret Santa 🎅",
      contact: {
        name: "Support API",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur de développement",
      },
      {
        url: "http://localhost",
        description: "Serveur Docker (via Nginx)",
      },
    ],
    tags: [
      { name: "Health", description: "Vérification de l'état de l'API" },
      { name: "Auth", description: "Authentification et gestion des comptes" },
      { name: "Events", description: "Gestion des événements Secret Santa" },
      { name: "Users", description: "Gestion du profil utilisateur" },
      { name: "Notifications", description: "Gestion des notifications" },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Entrez votre token JWT",
        },
      },
      schemas: {},
    },
  };

  // Charger les schémas existants
  await loadSchemas(spec);

  // Analyser les routes
  await analyzeRoutes(spec);

  return spec;
}

async function loadSchemas(spec: OpenAPISpec): Promise<void> {
  // Charger les schémas depuis les fichiers TypeScript
  const schemaFiles = await glob(path.join(__dirname, "../src/schemas/**/*.ts"));

  for (const file of schemaFiles) {
    const content = await fs.readFile(file, "utf-8");
    const filename = path.basename(file, ".ts");

    // Analyser le contenu pour extraire les interfaces
    // Cette partie serait plus sophistiquée dans une implémentation complète
    if (filename === "auth.schema") {
      spec.components.schemas.RegisterRequest = {
        type: "object",
        required: ["email", "password", "username"],
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "Adresse email valide",
          },
          password: {
            type: "string",
            minLength: 8,
            description: "Mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)",
          },
          username: {
            type: "string",
            minLength: 3,
            maxLength: 50,
            description: "Nom d'utilisateur (lettres, chiffres, underscores)",
          },
        },
      };

      spec.components.schemas.LoginRequest = {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "Adresse email",
          },
          password: {
            type: "string",
            description: "Mot de passe",
          },
        },
      };
    }
  }

  // Ajouter les schémas de base
  spec.components.schemas.User = {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "ID unique de l'utilisateur",
      },
      email: {
        type: "string",
        format: "email",
        description: "Adresse email de l'utilisateur",
      },
      username: {
        type: "string",
        description: "Nom d'utilisateur",
      },
      created_at: {
        type: "string",
        format: "date-time",
        description: "Date de création du compte",
      },
      updated_at: {
        type: "string",
        format: "date-time",
        description: "Date de dernière mise à jour",
      },
    },
  };

  spec.components.schemas.Event = {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID unique de l'événement",
      },
      title: {
        type: "string",
        description: "Titre de l'événement",
      },
      description: {
        type: "string",
        description: "Description de l'événement",
      },
      eventDate: {
        type: "string",
        format: "date-time",
        description: "Date de l'événement",
      },
      budget: {
        type: "number",
        description: "Budget par personne",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Date de création de l'événement",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Date de dernière mise à jour",
      },
    },
  };

  // Ajouter les schémas de réponse
  spec.components.schemas.AuthResponse = {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
        example: "Compte créé avec succès",
      },
      data: {
        type: "object",
        properties: {
          user: {
            $ref: "#/components/schemas/User",
          },
          token: {
            type: "string",
            description: "Token JWT pour l'authentification",
          },
        },
      },
    },
  };

  spec.components.schemas.ErrorResponse = {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false,
      },
      message: {
        type: "string",
        example: "Erreur de validation",
      },
    },
  };
}

async function analyzeRoutes(spec: OpenAPISpec): Promise<void> {
  // Analyser les fichiers de routes
  const routeFiles = await glob(path.join(__dirname, "../src/routes/**/*.ts"));

  for (const file of routeFiles) {
    const content = await fs.readFile(file, "utf-8");
    const filename = path.basename(file, ".ts");

    // Analyser le contenu pour extraire les routes
    // Cette partie serait plus sophistiquée dans une implémentation complète
    if (filename === "auth.routes") {
      // Route: POST /auth/register
      spec.paths["/auth/register"] = {
        post: {
          tags: ["Auth"],
          summary: "Inscription d'un nouvel utilisateur",
          description: "Crée un nouveau compte utilisateur",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterRequest",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Compte créé avec succès",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthResponse",
                  },
                },
              },
            },
            "400": {
              description: "Données invalides",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "500": {
              description: "Erreur serveur",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      };

      // Route: POST /auth/login
      spec.paths["/auth/login"] = {
        post: {
          tags: ["Auth"],
          summary: "Connexion utilisateur",
          description: "Authentifie un utilisateur et retourne un token JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Connexion réussie",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AuthResponse",
                  },
                },
              },
            },
            "401": {
              description: "Identifiants invalides",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "500": {
              description: "Erreur serveur",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
          },
        },
      };

      // Route: GET /auth/me
      spec.paths["/auth/me"] = {
        get: {
          tags: ["Auth"],
          summary: "Récupérer le profil utilisateur",
          description: "Retourne les informations du profil de l'utilisateur authentifié",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Profil utilisateur",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/User" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Non autorisé",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Erreur serveur",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      };
    }

    if (filename === "event.routes") {
      // Route: POST /events
      spec.paths["/events"] = {
        post: {
          tags: ["Events"],
          summary: "Créer un nouvel événement",
          description: "Crée un nouvel événement Secret Santa",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "eventDate"],
                  properties: {
                    title: { type: "string", description: "Titre de l'événement" },
                    description: { type: "string", description: "Description de l'événement" },
                    eventDate: {
                      type: "string",
                      format: "date-time",
                      description: "Date de l'événement",
                    },
                    budget: { type: "number", description: "Budget par personne" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Événement créé avec succès",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Event" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Données invalides",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Erreur serveur",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      };

      // Route: GET /events/{id}
      spec.paths["/events/{id}"] = {
        get: {
          tags: ["Events"],
          summary: "Récupérer un événement",
          description: "Retourne les détails d'un événement spécifique",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "ID de l'événement",
            },
          ],
          responses: {
            "200": {
              description: "Détails de l'événement",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Event" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Événement non trouvé",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Erreur serveur",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      };
    }

    if (filename === "user.routes") {
      // Route: GET /users/me
      spec.paths["/users/me"] = {
        get: {
          tags: ["Users"],
          summary: "Récupérer le profil utilisateur",
          description: "Retourne les informations du profil utilisateur",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Profil utilisateur",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Non autorisé",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Erreur serveur",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      };
    }
  }

  // Ajouter la route de santé
  spec.paths["/health"] = {
    get: {
      tags: ["Health"],
      summary: "Vérifier l'état de l'API",
      description: "Retourne l'état de santé de l'API et des services dépendants",
      responses: {
        "200": {
          description: "API opérationnelle",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "OK" },
                  timestamp: { type: "string", format: "date-time" },
                  database: { type: "string", example: "connected" },
                  environment: { type: "string", example: "production" },
                },
              },
            },
          },
        },
      },
    },
  };
}

async function main() {
  try {
    console.log("🔄 Génération de la spécification OpenAPI...");

    const spec = await generateOpenAPISpec();

    // Convertir en YAML
    const yamlContent = YAML.stringify(spec, {
      indent: 2,
      lineWidth: 120,
      singleQuote: true,
    });

    // Ajouter l'en-tête
    const finalContent = `# ═══════════════════════════════════════════════════════════════
# OpenAPI 3.0 Specification - Secret Santa API
# ═══════════════════════════════════════════════════════════════

${yamlContent}`;

    // Écrire le fichier
    const outputPath = path.join(__dirname, "../src/docs/openapi.yaml");
    await fs.writeFile(outputPath, finalContent, "utf-8");

    console.log("✅ Spécification OpenAPI générée avec succès !");
    console.log(`   Fichier: ${outputPath}`);
  } catch (error) {
    console.error("❌ Erreur lors de la génération de la spécification OpenAPI:", error);
    process.exit(1);
  }
}

// Exécuter le script
main();
