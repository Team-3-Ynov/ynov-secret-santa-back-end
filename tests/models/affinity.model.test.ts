import { describe, expect, it } from "vitest";
import {
  AFFINITY_VALUES,
  affinitySchema,
  setAffinitySchema,
} from "../../src/models/affinity.model";

describe("Affinity Model", () => {
  describe("AFFINITY_VALUES", () => {
    it("should contain exactly avoid, neutral, favorable", () => {
      expect(AFFINITY_VALUES).toContain("avoid");
      expect(AFFINITY_VALUES).toContain("neutral");
      expect(AFFINITY_VALUES).toContain("favorable");
      expect(AFFINITY_VALUES).toHaveLength(3);
    });
  });

  describe("setAffinitySchema", () => {
    it("should accept 'avoid'", () => {
      const result = setAffinitySchema.safeParse({ affinity: "avoid" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.affinity).toBe("avoid");
    });

    it("should accept 'neutral'", () => {
      const result = setAffinitySchema.safeParse({ affinity: "neutral" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.affinity).toBe("neutral");
    });

    it("should accept 'favorable'", () => {
      const result = setAffinitySchema.safeParse({ affinity: "favorable" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.affinity).toBe("favorable");
    });

    it("should reject an unknown affinity value", () => {
      const result = setAffinitySchema.safeParse({ affinity: "hostile" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty string", () => {
      const result = setAffinitySchema.safeParse({ affinity: "" });
      expect(result.success).toBe(false);
    });

    it("should reject a missing affinity field", () => {
      const result = setAffinitySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject null", () => {
      const result = setAffinitySchema.safeParse({ affinity: null });
      expect(result.success).toBe(false);
    });

    it("should reject numeric values", () => {
      const result = setAffinitySchema.safeParse({ affinity: 1 });
      expect(result.success).toBe(false);
    });

    it("should be case-sensitive (reject uppercase variants)", () => {
      expect(setAffinitySchema.safeParse({ affinity: "AVOID" }).success).toBe(false);
      expect(setAffinitySchema.safeParse({ affinity: "Neutral" }).success).toBe(false);
      expect(setAffinitySchema.safeParse({ affinity: "FAVORABLE" }).success).toBe(false);
    });

    it("should strip unknown extra fields", () => {
      const result = setAffinitySchema.safeParse({ affinity: "avoid", extra: "field" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).extra).toBeUndefined();
      }
    });
  });

  describe("affinitySchema", () => {
    const validAffinity = {
      id: 1,
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      giver_id: 1,
      target_id: 2,
      affinity: "avoid" as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should validate a complete affinity record", () => {
      const result = affinitySchema.safeParse(validAffinity);
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID event_id", () => {
      const result = affinitySchema.safeParse({ ...validAffinity, event_id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("should reject a string giver_id", () => {
      const result = affinitySchema.safeParse({ ...validAffinity, giver_id: "one" });
      expect(result.success).toBe(false);
    });

    it("should reject an invalid affinity value in the full schema", () => {
      const result = affinitySchema.safeParse({ ...validAffinity, affinity: "dislike" });
      expect(result.success).toBe(false);
    });

    it("should reject missing created_at", () => {
      const { created_at: _, ...rest } = validAffinity;
      const result = affinitySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });
});
