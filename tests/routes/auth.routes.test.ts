import request from "supertest";
import { type Mock, vi } from "vitest";
import app from "../../src/app";
import { RefreshTokenModel } from "../../src/models/refresh_token.model";
import { UserModel } from "../../src/models/user.model";
import { getUserStats } from "../../src/services/user.service";
import * as jwtUtils from "../../src/utils/jwt.utils";

vi.mock("../../src/models/user.model");
vi.mock("../../src/models/refresh_token.model");
vi.mock("../../src/services/user.service");
vi.mock("../../src/utils/jwt.utils", () => ({
  signAccessToken: vi.fn(() => "mock-access-token"),
  signRefreshToken: vi.fn(() => "mock-refresh-token"),
  verifyRefreshToken: vi.fn(),
  verifyAccessToken: vi.fn(),
  extractTokenFromHeader: vi.fn((header?: string) => {
    if (!header?.startsWith("Bearer ")) return null;
    return header.slice(7);
  }),
}));

describe("auth routes profile_image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OPTIONS /api/auth/register returns CORS headers for localhost:3000", async () => {
    const response = await request(app)
      .options("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,authorization");

    expect([200, 204]).toContain(response.status);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
    expect(response.headers["access-control-allow-methods"]).toContain("OPTIONS");
    expect(response.headers["access-control-allow-headers"]).toContain("Content-Type");
    expect(response.headers["access-control-allow-headers"]).toContain("Authorization");
  });

  it("POST /api/auth/register persists an allowed profile_image", async () => {
    (UserModel.emailExists as Mock).mockResolvedValue(false);
    (UserModel.usernameExists as Mock).mockResolvedValue(false);
    (UserModel.create as Mock).mockResolvedValue({
      id: 1,
      email: "new@example.com",
      username: "new_user",
      first_name: "Jean",
      last_name: "Dupont",
      profile_image: "/avatars/avatar-2.svg",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });
    (RefreshTokenModel.create as Mock).mockResolvedValue({ token: "mock-refresh-token" });

    const response = await request(app).post("/api/auth/register").send({
      email: "new@example.com",
      password: "Password123",
      username: "new_user",
      first_name: "Jean",
      last_name: "Dupont",
      profile_image: "/avatars/avatar-2.svg",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.profile_image).toBe("/avatars/avatar-2.svg");
    expect(UserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ profile_image: "/avatars/avatar-2.svg" })
    );
  });

  it("POST /api/auth/register rejects disallowed profile_image", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "new@example.com",
      password: "Password123",
      username: "new_user",
      profile_image: "https://evil.com/avatar.png",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "profile_image" })])
    );
  });

  it("GET /api/auth/me returns profile_image in user payload", async () => {
    (jwtUtils.verifyAccessToken as Mock).mockReturnValue({
      userId: 1,
      email: "user@example.com",
      type: "access",
    });
    (UserModel.findById as Mock).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      username: "user1",
      first_name: "Jean",
      last_name: "Dupont",
      profile_image: "/avatars/avatar-1.svg",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });
    (getUserStats as Mock).mockResolvedValue({
      eventsCreated: 1,
      participations: 2,
      giftsOffered: 3,
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.profile_image).toBe("/avatars/avatar-1.svg");
  });

  it("GET /api/auth/me returns 401 without bearer token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
