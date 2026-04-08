import type { Request, Response } from "express";
import { type Mock, vi } from "vitest";
import { AuthController } from "../../src/controllers/auth.controller";
import { RefreshTokenModel } from "../../src/models/refresh_token.model";
import { UserModel } from "../../src/models/user.model";
import { getUserStats } from "../../src/services/user.service";
import * as jwtUtils from "../../src/utils/jwt.utils";

// Mock des dépendances
vi.mock("../../src/models/user.model");
vi.mock("../../src/models/refresh_token.model");
vi.mock("../../src/utils/jwt.utils");
vi.mock("../../src/services/user.service");

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    vi.clearAllMocks();
  });

  describe("register", () => {
    const validRegistrationData = {
      email: "test@example.com",
      password: "Password123",
      username: "testuser",
    };

    it("should create a new user successfully", async () => {
      const mockUser = {
        id: 1,
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        profile_image: "/avatars/avatar-1.svg",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = validRegistrationData;

      (UserModel.emailExists as Mock).mockResolvedValue(false);
      (UserModel.usernameExists as Mock).mockResolvedValue(false);
      (UserModel.create as Mock).mockResolvedValue(mockUser);
      (RefreshTokenModel.create as Mock).mockResolvedValue({
        token: "mock-refresh-token",
      });
      (jwtUtils.signAccessToken as Mock).mockReturnValue("mock-jwt-token");
      (jwtUtils.signRefreshToken as Mock).mockReturnValue("mock-refresh-token");

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(UserModel.emailExists).toHaveBeenCalledWith(validRegistrationData.email);
      expect(UserModel.usernameExists).toHaveBeenCalledWith(validRegistrationData.username);
      expect(UserModel.create).toHaveBeenCalledWith({
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        username: validRegistrationData.username,
        profile_image: "/avatars/avatar-1.svg",
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Compte créé avec succès",
        data: {
          user: mockUser,
          accessToken: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
        },
      });
    });

    it("should return 409 if email already exists", async () => {
      mockRequest.body = validRegistrationData;

      (UserModel.emailExists as Mock).mockResolvedValue(true);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Cet email est déjà utilisé",
      });
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should return 409 if username already exists", async () => {
      mockRequest.body = validRegistrationData;

      (UserModel.emailExists as Mock).mockResolvedValue(false);
      (UserModel.usernameExists as Mock).mockResolvedValue(true);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Ce nom d'utilisateur est déjà pris",
      });
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      mockRequest.body = validRegistrationData;

      (UserModel.emailExists as Mock).mockRejectedValue(new Error("DB Error"));

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur lors de l'inscription",
      });
    });

    it("should pass explicit profile_image to UserModel.create", async () => {
      const mockUser = {
        id: 2,
        email: validRegistrationData.email,
        username: validRegistrationData.username,
        profile_image: "/avatars/avatar-5.svg",
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockRequest.body = {
        ...validRegistrationData,
        profile_image: "/avatars/avatar-5.svg",
      };

      (UserModel.emailExists as Mock).mockResolvedValue(false);
      (UserModel.usernameExists as Mock).mockResolvedValue(false);
      (UserModel.create as Mock).mockResolvedValue(mockUser);
      (RefreshTokenModel.create as Mock).mockResolvedValue({ token: "mock-refresh-token" });
      (jwtUtils.signAccessToken as Mock).mockReturnValue("mock-jwt-token");
      (jwtUtils.signRefreshToken as Mock).mockReturnValue("mock-refresh-token");

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(UserModel.create).toHaveBeenCalledWith({
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        username: validRegistrationData.username,
        profile_image: "/avatars/avatar-5.svg",
      });
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe("login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "Password123",
    };

    const mockUserWithoutPassword = {
      id: 1,
      email: "test@example.com",
      username: "testuser",
      first_name: "John",
      last_name: "Doe",
      profile_image: "/avatars/avatar-2.svg",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should login successfully with valid credentials", async () => {
      mockRequest.body = validLoginData;

      (UserModel.verifyCredentials as Mock).mockResolvedValue(mockUserWithoutPassword);
      (RefreshTokenModel.create as Mock).mockResolvedValue({
        token: "mock-refresh-token",
      });
      (jwtUtils.signAccessToken as Mock).mockReturnValue("mock-jwt-token");
      (jwtUtils.signRefreshToken as Mock).mockReturnValue("mock-refresh-token");

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(UserModel.verifyCredentials).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Connexion réussie",
        data: {
          user: mockUserWithoutPassword,
          accessToken: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
        },
      });
    });

    it("should return 401 if credentials are invalid", async () => {
      mockRequest.body = validLoginData;

      (UserModel.verifyCredentials as Mock).mockResolvedValue(null);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    });

    it("should return 500 on database error", async () => {
      mockRequest.body = validLoginData;

      (UserModel.verifyCredentials as Mock).mockRejectedValue(new Error("DB Error"));

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Erreur serveur lors de la connexion",
      });
    });

    it("should not return password in response", async () => {
      mockRequest.body = validLoginData;

      (UserModel.verifyCredentials as Mock).mockResolvedValue(mockUserWithoutPassword);
      (RefreshTokenModel.create as Mock).mockResolvedValue({
        token: "mock-refresh-token",
      });
      (jwtUtils.signAccessToken as Mock).mockReturnValue("mock-jwt-token");
      (jwtUtils.signRefreshToken as Mock).mockReturnValue("mock-refresh-token");

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      const responseData = jsonMock.mock.calls[0][0];
      expect(responseData.data.user.password).toBeUndefined();
      expect(responseData.data.accessToken).toBeDefined();
      expect(responseData.data.refreshToken).toBeDefined();
    });
  });

  describe("getMe", () => {
    it("should return user profile with stats when authenticated", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        profile_image: "/avatars/avatar-3.svg",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockStats = {
        eventsCreated: 2,
        participations: 3,
        giftsOffered: 1,
      };

      mockRequest = {
        ...mockRequest,
        user: { id: 1, email: "test@example.com" },
      } as any;
      (UserModel.findById as Mock).mockResolvedValue(mockUser);

      (getUserStats as Mock).mockResolvedValue(mockStats);

      await AuthController.getMe(mockRequest as Request, mockResponse as Response);

      expect(UserModel.findById).toHaveBeenCalledWith(1);
      expect(getUserStats).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { user: { ...mockUser, stats: mockStats } },
      });
    });

    it("should return 404 if user not found", async () => {
      mockRequest = {
        ...mockRequest,
        user: { id: 999, email: "test@example.com" },
      } as any;
      (UserModel.findById as Mock).mockResolvedValue(null);

      await AuthController.getMe(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Utilisateur non trouvé",
      });
    });

    it("should return 500 when getMe throws unexpectedly", async () => {
      mockRequest = {
        ...mockRequest,
        user: { id: 1, email: "test@example.com" },
      } as any;
      (UserModel.findById as Mock).mockRejectedValue(new Error("DB Error"));

      await AuthController.getMe(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Erreur serveur" });
    });
  });

  describe("refresh", () => {
    it("should return 400 when refresh token is missing", async () => {
      mockRequest.body = {};

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 401 when refresh token signature is invalid", async () => {
      mockRequest.body = { refreshToken: "bad-token" };
      (jwtUtils.verifyRefreshToken as Mock).mockReturnValue(null);

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Refresh token invalide" });
    });

    it("should return 401 when refresh token is not found in DB", async () => {
      mockRequest.body = { refreshToken: "token" };
      (jwtUtils.verifyRefreshToken as Mock).mockReturnValue({ userId: 1, type: "refresh" });
      (RefreshTokenModel.findByToken as Mock).mockResolvedValue(null);

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Refresh token invalide ou révoqué",
      });
    });

    it("should revoke all tokens when reused revoked token is detected", async () => {
      mockRequest.body = { refreshToken: "revoked-token" };
      (jwtUtils.verifyRefreshToken as Mock).mockReturnValue({ userId: 3, type: "refresh" });
      (RefreshTokenModel.findByToken as Mock).mockResolvedValue({
        token: "revoked-token",
        user_id: 3,
        revoked: true,
        expires_at: new Date(Date.now() + 60_000),
      });

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(RefreshTokenModel.revokeAllForUser).toHaveBeenCalledWith(3);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("should return 401 when token is expired", async () => {
      mockRequest.body = { refreshToken: "expired-token" };
      (jwtUtils.verifyRefreshToken as Mock).mockReturnValue({ userId: 1, type: "refresh" });
      (RefreshTokenModel.findByToken as Mock).mockResolvedValue({
        token: "expired-token",
        user_id: 1,
        revoked: false,
        expires_at: new Date(Date.now() - 1_000),
      });

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Refresh token expiré" });
    });

    it("should return 404 when user from refresh token no longer exists", async () => {
      mockRequest.body = { refreshToken: "valid-token" };
      (jwtUtils.verifyRefreshToken as Mock).mockReturnValue({ userId: 99, type: "refresh" });
      (RefreshTokenModel.findByToken as Mock).mockResolvedValue({
        token: "valid-token",
        user_id: 99,
        revoked: false,
        expires_at: new Date(Date.now() + 60_000),
      });
      (UserModel.findById as Mock).mockResolvedValue(null);

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("should rotate tokens and return 200 when refresh is valid", async () => {
      mockRequest.body = { refreshToken: "valid-token" };
      const user = { id: 1, email: "ok@example.com", username: "ok" };

      (jwtUtils.verifyRefreshToken as Mock).mockReturnValue({ userId: 1, type: "refresh" });
      (RefreshTokenModel.findByToken as Mock).mockResolvedValue({
        token: "valid-token",
        user_id: 1,
        revoked: false,
        expires_at: new Date(Date.now() + 60_000),
      });
      (UserModel.findById as Mock).mockResolvedValue(user);
      (jwtUtils.signAccessToken as Mock).mockReturnValue("new-access");
      (jwtUtils.signRefreshToken as Mock).mockReturnValue("new-refresh");
      (RefreshTokenModel.revoke as Mock).mockResolvedValue(undefined);
      (RefreshTokenModel.create as Mock).mockResolvedValue({ token: "new-refresh" });

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(RefreshTokenModel.revoke).toHaveBeenCalledWith("valid-token");
      expect(RefreshTokenModel.create).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: "new-access",
          refreshToken: "new-refresh",
        },
      });
    });

    it("should return 500 when refresh throws unexpectedly", async () => {
      mockRequest.body = { refreshToken: "token" };
      (jwtUtils.verifyRefreshToken as Mock).mockImplementation(() => {
        throw new Error("unexpected");
      });

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("logout", () => {
    it("should return 200 even without refresh token", async () => {
      mockRequest.body = {};

      await AuthController.logout(mockRequest as Request, mockResponse as Response);

      expect(RefreshTokenModel.revoke).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should revoke token and return 200 when refresh token is provided", async () => {
      mockRequest.body = { refreshToken: "to-revoke" };
      (RefreshTokenModel.revoke as Mock).mockResolvedValue(undefined);

      await AuthController.logout(mockRequest as Request, mockResponse as Response);

      expect(RefreshTokenModel.revoke).toHaveBeenCalledWith("to-revoke");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should return 500 when logout throws unexpectedly", async () => {
      mockRequest.body = { refreshToken: "to-revoke" };
      (RefreshTokenModel.revoke as Mock).mockRejectedValue(new Error("boom"));

      await AuthController.logout(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
