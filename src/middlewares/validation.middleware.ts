import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

/**
 * Middleware de validation des données avec Zod
 */
export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors,
      });
      return;
    }

    next();
  };
};
