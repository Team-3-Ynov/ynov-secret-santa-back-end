import { type Mock, vi } from "vitest";
import { pool } from "../../src/config/database";
import { RefreshTokenModel } from "../../src/models/refresh_token.model";

vi.mock("../../src/config/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe("RefreshTokenModel", () => {
  const mockPool = pool as unknown as { query: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create should insert refresh token and return row", async () => {
    const tokenRow = {
      id: 1,
      user_id: 12,
      token: "refresh-token",
      expires_at: new Date(),
      created_at: new Date(),
      revoked: false,
    };
    mockPool.query.mockResolvedValueOnce({ rows: [tokenRow] });

    const result = await RefreshTokenModel.create(12, "refresh-token", tokenRow.expires_at);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO refresh_tokens"),
      [12, "refresh-token", tokenRow.expires_at]
    );
    expect(result).toEqual(tokenRow);
  });

  it("findByToken should return token row when found", async () => {
    const tokenRow = { id: 1, token: "t", user_id: 1 };
    mockPool.query.mockResolvedValueOnce({ rows: [tokenRow] });

    const result = await RefreshTokenModel.findByToken("t");

    expect(result).toEqual(tokenRow);
  });

  it("findByToken should return null when not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await RefreshTokenModel.findByToken("missing");

    expect(result).toBeNull();
  });

  it("revoke should update token as revoked", async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

    await RefreshTokenModel.revoke("tok");

    expect(mockPool.query).toHaveBeenCalledWith(
      "UPDATE refresh_tokens SET revoked = true WHERE token = $1",
      ["tok"]
    );
  });

  it("revokeAllForUser should revoke all user tokens", async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 3 });

    await RefreshTokenModel.revokeAllForUser(9);

    expect(mockPool.query).toHaveBeenCalledWith(
      "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1",
      [9]
    );
  });
});
