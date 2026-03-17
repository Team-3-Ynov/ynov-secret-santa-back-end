import { exclusionSchema } from "../../src/models/exclusion.model";

describe("exclusion.model schema", () => {
  it("should validate a correct exclusion payload", () => {
    const result = exclusionSchema.safeParse({
      id: 1,
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      giver_id: 10,
      receiver_id: 20,
      created_at: new Date(),
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid uuid", () => {
    const result = exclusionSchema.safeParse({
      id: 1,
      event_id: "bad-uuid",
      giver_id: 10,
      receiver_id: 20,
      created_at: new Date(),
    });

    expect(result.success).toBe(false);
  });
});
