import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ═══════════════════════════════════════════════════════════════
// Configuration Swagger - Chargement des fichiers YAML
// ═══════════════════════════════════════════════════════════════

const docsPath = path.join(__dirname, '../docs');

/**
 * Charge et parse un fichier YAML
 */
function loadYaml(filePath: string): Record<string, unknown> {
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content) as Record<string, unknown>;
}

/**
 * Charge tous les fichiers de paths depuis le dossier paths/
 */
function loadPaths(): Record<string, unknown> {
  const pathsDir = path.join(docsPath, 'paths');
  const paths: Record<string, unknown> = {};

  if (fs.existsSync(pathsDir)) {
    const files = fs.readdirSync(pathsDir).filter(f => f.endsWith('.yaml'));

    for (const file of files) {
      const filePath = path.join(pathsDir, file);
      const content = loadYaml(filePath);
      Object.assign(paths, content);
    }
  }

  return paths;
}

/**
 * Résout les références $ref dans les paths
 */
function resolveRefs(obj: unknown, baseSpec: Record<string, unknown>): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => resolveRefs(item, baseSpec));
  }

  const record = obj as Record<string, unknown>;

  if ('$ref' in record && typeof record.$ref === 'string') {
    const ref = record.$ref;

    // Résout les références vers openapi.yaml#/components/...
    if (ref.includes('openapi.yaml#/components/')) {
      const componentPath = ref.split('#/components/')[1];
      const parts = componentPath.split('/');

      let resolved: unknown = baseSpec.components;
      for (const part of parts) {
        if (resolved && typeof resolved === 'object') {
          resolved = (resolved as Record<string, unknown>)[part];
        }
      }

      return { $ref: `#/components/${componentPath}` };
    }

    return record;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = resolveRefs(value, baseSpec);
  }

  return result;
}
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secret Santa API',
      version: '1.0.0',
      description: 'API pour gérer les échanges de cadeaux Secret Santa 🎅',
      contact: {
        name: 'Support API',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur',
              example: 'user@example.com',
            },
            username: {
              type: 'string',
              description: 'Nom d\'utilisateur',
              example: 'johndoe',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière mise à jour',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email valide',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)',
              example: 'MonMotDePasse123',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              description: 'Nom d\'utilisateur (lettres, chiffres, underscores)',
              example: 'johndoe',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: 'Mot de passe',
              example: 'MonMotDePasse123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Compte créé avec succès',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  description: 'Token JWT pour l\'authentification',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Erreur de validation',
            },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Données invalides',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'password',
                  },
                  message: {
                    type: 'string',
                    example: 'Le mot de passe doit contenir au moins 8 caractères',
                  },
                },
              },
            },
          },
        },
        UpdateEventInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            eventDate: { type: 'string', format: 'date-time' },
            budget: { type: 'number' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Vérification de l\'état de l\'API',
      },
      {
        name: 'Auth',
        description: 'Authentification et gestion des comptes',
      },
      {
        name: 'Events',
        description: 'Gestion des événements Secret Santa',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

/**
 * Construit la spécification OpenAPI complète
 */
function buildSwaggerSpec(): Record<string, unknown> {
  // Charge le fichier principal
  const mainSpec = loadYaml(path.join(docsPath, 'openapi.yaml'));

  // Charge tous les paths
  const paths = loadPaths();

  // Résout les références
  const resolvedPaths = resolveRefs(paths, mainSpec);

  // Combine tout
  return {
    ...mainSpec,
    paths: resolvedPaths,
  };
}

// Export de la spécification
export const swaggerSpec = buildSwaggerSpec();
