import { ALLOWED_PROFILE_IMAGES } from "../../src/constants/profile-image";
import { updatePasswordSchema, updateProfileSchema } from "../../src/schemas/user.schema";

describe("user.schema", () => {
  describe("updateProfileSchema", () => {
    it("should validate with one valid field", () => {
      const result = updateProfileSchema.safeParse({ username: "valid_name_123" });
      expect(result.success).toBe(true);
    });

    it("should reject empty payload", () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = updateProfileSchema.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid username characters", () => {
      const result = updateProfileSchema.safeParse({ username: "bad-name!" });
      expect(result.success).toBe(false);
    });

    it("should accept each allowed profile_image value", () => {
      for (const profileImage of ALLOWED_PROFILE_IMAGES) {
        const result = updateProfileSchema.safeParse({ profile_image: profileImage });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid profile_image", () => {
      const result = updateProfileSchema.safeParse({ profile_image: "../avatar.svg" });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should validate correct password update payload", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject too short new password", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "Sh0rt",
      });
      expect(result.success).toBe(false);
    });

    it("should reject new password without uppercase", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "lowercase123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject new password without number", () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NoNumberPass",
      });
      expect(result.success).toBe(false);
    });
  });
});
