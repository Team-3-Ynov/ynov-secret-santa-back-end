import bcrypt from "bcrypt";
import { type Mock, vi } from "vitest";
import { pool } from "../../src/config/database";
import { UserModel } from "../../src/models/user.model";

// Mock de la connexion à la base de données
vi.mock("../../src/config/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock de bcrypt
vi.mock("bcrypt");

describe("UserModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should hash password and create a new user", async () => {
      const userData = {
        email: "test@example.com",
        password: "plainPassword123",
        username: "testuser",
        profile_image: "/avatars/avatar-1.svg",
      };

      const mockResult = {
        rows: [
          {
            id: 1,
            email: userData.email,
            username: userData.username,
            profile_image: userData.profile_image,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (bcrypt.hash as Mock).mockResolvedValue("hashed_password");
      (pool.query as Mock).mockResolvedValue(mockResult);

      const result = await UserModel.create(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"), [
        userData.email,
        "hashed_password",
        userData.username,
        null,
        null,
        userData.profile_image,
      ]);
      expect(result).toEqual(mockResult.rows[0]);
      expect(result).not.toHaveProperty("password");
    });

    it("should create a new user with first and last names", async () => {
      const userData = {
        email: "names@example.com",
        password: "plainPassword123",
        username: "namesuser",
        first_name: "John",
        last_name: "Doe",
        profile_image: "/avatars/avatar-2.svg",
      };

      const mockResult = {
        rows: [
          {
            id: 2,
            email: userData.email,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image: userData.profile_image,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      (bcrypt.hash as Mock).mockResolvedValue("hashed_password");
      (pool.query as Mock).mockResolvedValue(mockResult);

      const result = await UserModel.create(userData);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"), [
        userData.email,
        "hashed_password",
        userData.username,
        "John",
        "Doe",
        userData.profile_image,
      ]);
      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe("verifyCredentials", () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      password: "hashed_password",
      username: "testuser",
      profile_image: "/avatars/avatar-1.svg",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should return user without password when credentials are valid", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as Mock).mockResolvedValue(true);

      const result = await UserModel.verifyCredentials("test@example.com", "correctPassword");

      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM users WHERE email = $1", [
        "test@example.com",
      ]);
      expect(bcrypt.compare).toHaveBeenCalledWith("correctPassword", "hashed_password");
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        profile_image: mockUser.profile_image,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
      expect(result).not.toHaveProperty("password");
    });

    it("should return null when user not found", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.verifyCredentials("notfound@example.com", "password");

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return null when password is incorrect", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as Mock).mockResolvedValue(false);

      const result = await UserModel.verifyCredentials("test@example.com", "wrongPassword");

      expect(bcrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashed_password");
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return user without password when found", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        profile_image: "/avatars/avatar-1.svg",
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as Mock).mockResolvedValue({ rows: [mockUser] });

      const result = await UserModel.findById(1);

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT id, email, username, first_name, last_name, profile_image, created_at, updated_at FROM users WHERE id = $1",
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("emailExists", () => {
    it("should return true when email exists", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const result = await UserModel.emailExists("test@example.com");

      expect(pool.query).toHaveBeenCalledWith("SELECT 1 FROM users WHERE email = $1", [
        "test@example.com",
      ]);
      expect(result).toBe(true);
    });

    it("should return false when email does not exist", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.emailExists("notfound@example.com");

      expect(result).toBe(false);
    });
  });

  describe("usernameExists", () => {
    it("should return true when username exists", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const result = await UserModel.usernameExists("testuser");

      expect(pool.query).toHaveBeenCalledWith("SELECT 1 FROM users WHERE username = $1", [
        "testuser",
      ]);
      expect(result).toBe(true);
    });

    it("should return false when username does not exist", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.usernameExists("notfound");

      expect(result).toBe(false);
    });
  });

  describe("findByEmail", () => {
    it("should return full user when found", async () => {
      const fullUser = {
        id: 4,
        email: "full@example.com",
        username: "full",
        password: "hash",
      };
      (pool.query as Mock).mockResolvedValue({ rows: [fullUser] });

      const result = await UserModel.findByEmail("full@example.com");

      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM users WHERE email = $1", [
        "full@example.com",
      ]);
      expect(result).toEqual(fullUser);
    });

    it("should return null when not found", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.findByEmail("missing@example.com");

      expect(result).toBeNull();
    });
  });

  describe("emailExistsForOtherUser", () => {
    it("should return true when another user already uses this email", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const result = await UserModel.emailExistsForOtherUser("taken@example.com", 2);

      expect(pool.query).toHaveBeenCalledWith("SELECT 1 FROM users WHERE email = $1 AND id != $2", [
        "taken@example.com",
        2,
      ]);
      expect(result).toBe(true);
    });

    it("should return false when email is free for other users", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.emailExistsForOtherUser("free@example.com", 2);

      expect(result).toBe(false);
    });
  });

  describe("usernameExistsForOtherUser", () => {
    it("should return true when another user already uses this username", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const result = await UserModel.usernameExistsForOtherUser("taken_user", 2);

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT 1 FROM users WHERE username = $1 AND id != $2",
        ["taken_user", 2]
      );
      expect(result).toBe(true);
    });

    it("should return false when username is free for other users", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.usernameExistsForOtherUser("free_user", 2);

      expect(result).toBe(false);
    });
  });

  describe("update", () => {
    it("should return current user when no fields are provided", async () => {
      const spyFindById = vi.spyOn(UserModel, "findById").mockResolvedValue({
        id: 7,
        email: "same@example.com",
        username: "same",
        profile_image: "/avatars/avatar-1.svg",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await UserModel.update(7, {});

      expect(spyFindById).toHaveBeenCalledWith(7);
      expect(result?.id).toBe(7);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("should update provided fields and return updated user", async () => {
      const updated = {
        id: 1,
        email: "new@example.com",
        username: "new_user",
        first_name: "Neo",
        last_name: null,
        profile_image: "/avatars/avatar-3.svg",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (pool.query as Mock).mockResolvedValue({ rows: [updated] });

      const result = await UserModel.update(1, {
        email: "new@example.com",
        username: "new_user",
        first_name: "Neo",
        last_name: "",
        profile_image: "/avatars/avatar-3.svg",
      });

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), [
        "new@example.com",
        "new_user",
        "Neo",
        null,
        "/avatars/avatar-3.svg",
        1,
      ]);
      expect(result).toEqual(updated);
    });

    it("should return null when update affects no user", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.update(404, { username: "ghost" });

      expect(result).toBeNull();
    });
  });

  describe("updatePassword", () => {
    it("should hash and update password, returning true when row updated", async () => {
      (bcrypt.hash as Mock).mockResolvedValue("new_hash");
      (pool.query as Mock).mockResolvedValue({ rowCount: 1 });

      const result = await UserModel.updatePassword(1, "NewPass123");

      expect(bcrypt.hash).toHaveBeenCalledWith("NewPass123", 10);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), [
        "new_hash",
        1,
      ]);
      expect(result).toBe(true);
    });

    it("should return false when no row is updated", async () => {
      (bcrypt.hash as Mock).mockResolvedValue("new_hash");
      (pool.query as Mock).mockResolvedValue({ rowCount: 0 });

      const result = await UserModel.updatePassword(999, "NewPass123");

      expect(result).toBe(false);
    });
  });

  describe("verifyPassword", () => {
    it("should return false when user does not exist", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [] });

      const result = await UserModel.verifyPassword(404, "whatever");

      expect(result).toBe(false);
    });

    it("should compare password and return true when valid", async () => {
      (pool.query as Mock).mockResolvedValue({ rows: [{ password: "stored_hash" }] });
      (bcrypt.compare as Mock).mockResolvedValue(true);

      const result = await UserModel.verifyPassword(1, "PlainPass123");

      expect(bcrypt.compare).toHaveBeenCalledWith("PlainPass123", "stored_hash");
      expect(result).toBe(true);
    });
  });
});
