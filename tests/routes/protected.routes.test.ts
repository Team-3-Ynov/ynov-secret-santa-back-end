import request from "supertest";
import app from "../../src/app";

describe("protected routes without token", () => {
  it("GET /api/auth/me returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("GET /api/users/me returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
