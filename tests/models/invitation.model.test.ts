import { invitationSchema } from "../../src/models/invitation.model";

describe("invitation.model schema", () => {
  it("should normalize valid email", () => {
    const result = invitationSchema.safeParse({ email: "USER@MAIL.COM" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@mail.com");
    }
  });

  it("should reject email with surrounding spaces", () => {
    const result = invitationSchema.safeParse({ email: "  USER@MAIL.COM  " });

    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = invitationSchema.safeParse({ email: "invalid-email" });

    expect(result.success).toBe(false);
  });
});
