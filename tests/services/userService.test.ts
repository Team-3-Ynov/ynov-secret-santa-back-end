import { type Mock, vi } from "vitest";
import { pool } from "../../src/config/database";
import { UserModel } from "../../src/models/user.model";
import {
  getPublicUserProfile,
  getPublicUserProfiles,
  getUserStats,
  updateUserPassword,
  updateUserProfile,
} from "../../src/services/user.service";

vi.mock("../../src/config/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("../../src/models/user.model", () => ({
  UserModel: {
    emailExistsForOtherUser: vi.fn(),
    usernameExistsForOtherUser: vi.fn(),
    update: vi.fn(),
    verifyPassword: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

describe("UserService", () => {
  const mockPool = pool as unknown as { query: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicUserProfile", () => {
    it("should return user profile if found", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        first_name: "Test",
        last_name: "User",
        created_at: new Date(),
      };
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await getPublicUserProfile(1);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, username, first_name, last_name, created_at FROM users WHERE id = $1"
        ),
        [1]
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("getPublicUserProfiles", () => {
    it("should return empty array when userIds is empty", async () => {
      const result = await getPublicUserProfiles([]);

      expect(result).toEqual([]);
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("should return public profiles for provided userIds", async () => {
      const rows = [
        { id: 1, username: "u1", created_at: new Date() },
        { id: 2, username: "u2", created_at: new Date() },
      ];
      mockPool.query.mockResolvedValueOnce({ rows });

      const result = await getPublicUserProfiles([1, 2]);

      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE id = ANY($1)"), [
        [1, 2],
      ]);
      expect(result).toEqual(rows);
    });
  });

  describe("getUserStats", () => {
    it("should return user statistics", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            events_created: "5",
            participations: "3",
            gifts_offered: "2",
          },
        ],
      });

      const result = await getUserStats(1);

      expect(result).toEqual({
        eventsCreated: 5,
        participations: 3,
        giftsOffered: 2,
      });
    });

    it("should handle user with zero statistics", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            events_created: "0",
            participations: "0",
            gifts_offered: "0",
          },
        ],
      });

      const result = await getUserStats(1);

      expect(result).toEqual({
        eventsCreated: 0,
        participations: 0,
        giftsOffered: 0,
      });
    });

    it("should return zeros when no statistics are found", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getUserStats(1);

      expect(result).toEqual({
        eventsCreated: 0,
        participations: 0,
        giftsOffered: 0,
      });
    });
  });

  describe("updateUserProfile", () => {
    it("should update profile successfully", async () => {
      (UserModel.emailExistsForOtherUser as Mock).mockResolvedValue(false);
      (UserModel.usernameExistsForOtherUser as Mock).mockResolvedValue(false);
      (UserModel.update as Mock).mockResolvedValue({
        id: 1,
        username: "newname",
        email: "new@test.com",
      });

      const result = await updateUserProfile(1, {
        username: "newname",
        email: "new@test.com",
      });

      expect(result.success).toBe(true);
      expect(result.user?.username).toBe("newname");
    });

    it("should fail if email taken", async () => {
      (UserModel.emailExistsForOtherUser as Mock).mockResolvedValue(true);

      const result = await updateUserProfile(1, { email: "taken@test.com" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("email");
    });

    it("should fail if username is already taken", async () => {
      (UserModel.emailExistsForOtherUser as Mock).mockResolvedValue(false);
      (UserModel.usernameExistsForOtherUser as Mock).mockResolvedValue(true);

      const result = await updateUserProfile(1, { username: "already-used" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("nom d'utilisateur");
    });

    it("should fail when user does not exist", async () => {
      (UserModel.emailExistsForOtherUser as Mock).mockResolvedValue(false);
      (UserModel.usernameExistsForOtherUser as Mock).mockResolvedValue(false);
      (UserModel.update as Mock).mockResolvedValue(null);

      const result = await updateUserProfile(999, { username: "ghost" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Utilisateur non trouvé");
    });
  });

  describe("updateUserPassword", () => {
    it("should update password successfully", async () => {
      (UserModel.verifyPassword as Mock).mockResolvedValue(true);
      (UserModel.updatePassword as Mock).mockResolvedValue(true);

      const result = await updateUserPassword(1, "old", "new");

      expect(result.success).toBe(true);
    });

    it("should fail if current password incorrect", async () => {
      (UserModel.verifyPassword as Mock).mockResolvedValue(false);

      const result = await updateUserPassword(1, "wrong", "new");

      expect(result.success).toBe(false);
      expect(result.error).toContain("incorrect");
    });

    it("should fail if password update does not persist", async () => {
      (UserModel.verifyPassword as Mock).mockResolvedValue(true);
      (UserModel.updatePassword as Mock).mockResolvedValue(false);

      const result = await updateUserPassword(1, "old", "new");

      expect(result.success).toBe(false);
      expect(result.error).toContain("mise à jour du mot de passe");
    });
  });
});
