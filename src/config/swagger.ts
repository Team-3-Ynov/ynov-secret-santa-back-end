import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

// ═══════════════════════════════════════════════════════════════
// Configuration Swagger - Chargement des fichiers YAML
// ═══════════════════════════════════════════════════════════════

const docsPath = path.join(__dirname, "../docs");

/**
 * Charge et parse un fichier YAML
 */
function loadYaml(filePath: string): Record<string, unknown> {
  const content = fs.readFileSync(filePath, "utf8");
  return yaml.load(content) as Record<string, unknown>;
}

/**
 * Charge tous les fichiers de paths depuis le dossier paths/
 */
function loadPaths(): Record<string, unknown> {
  const pathsDir = path.join(docsPath, "paths");
  const paths: Record<string, unknown> = {};

  if (fs.existsSync(pathsDir)) {
    const files = fs.readdirSync(pathsDir).filter((f) => f.endsWith(".yaml"));

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
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveRefs(item, baseSpec));
  }

  const record = obj as Record<string, unknown>;

  if ("$ref" in record && typeof record.$ref === "string") {
    const ref = record.$ref;

    // Résout les références vers openapi.yaml#/components/...
    if (ref.includes("openapi.yaml#/components/")) {
      const componentPath = ref.split("#/components/")[1];
      const parts = componentPath.split("/");

      let resolved: unknown = baseSpec.components;
      for (const part of parts) {
        if (resolved && typeof resolved === "object") {
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

/**
 * Construit la spécification OpenAPI complète
 */
function buildSwaggerSpec(): Record<string, unknown> {
  // Charge le fichier principal
  const mainSpec = loadYaml(path.join(docsPath, "openapi.yaml"));

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
