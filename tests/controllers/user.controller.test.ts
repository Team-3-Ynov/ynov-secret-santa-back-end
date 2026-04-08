import type { Request, Response } from "express";
import { type Mock, vi } from "vitest";
import {
  getMeHandler,
  getPublicProfileHandler,
  updatePasswordHandler,
  updateProfileHandler,
} from "../../src/controllers/user.controller";
import { UserModel } from "../../src/models/user.model";
import * as userService from "../../src/services/user.service";

vi.mock("../../src/models/user.model");
vi.mock("../../src/services/user.service");

describe("user.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      params: { id: "1" },
      body: {},
      user: { id: 1, email: "john@example.com" },
    } as unknown as Request;
    res = { status: statusMock, json: jsonMock } as unknown as Response;
    vi.clearAllMocks();
  });

  it("getPublicProfileHandler should return 400 for invalid id", async () => {
    req.params = { id: "abc" };

    await getPublicProfileHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it("getPublicProfileHandler should return 404 when user not found", async () => {
    (userService.getPublicUserProfile as Mock).mockResolvedValue(null);

    await getPublicProfileHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it("getPublicProfileHandler should return profile", async () => {
    const profile = { id: 1, username: "john", created_at: new Date() };
    (userService.getPublicUserProfile as Mock).mockResolvedValue(profile);

    await getPublicProfileHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: profile });
  });

  it("getMeHandler should return 404 when me not found", async () => {
    (UserModel.findById as Mock).mockResolvedValue(null);

    await getMeHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it("getMeHandler should return user", async () => {
    const user = {
      id: 1,
      email: "john@example.com",
      username: "john",
      profile_image: "/avatars/avatar-2.svg",
    };
    (UserModel.findById as Mock).mockResolvedValue(user);

    await getMeHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: { user } });
  });

  it("updateProfileHandler should return 400 on service failure", async () => {
    (userService.updateUserProfile as Mock).mockResolvedValue({
      success: false,
      error: "Cet email est deja utilise",
    });

    await updateProfileHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it("updateProfileHandler should return 200 on success", async () => {
    const updated = { id: 1, username: "neo", profile_image: "/avatars/avatar-4.svg" };
    req.body = { username: "neo", profile_image: "/avatars/avatar-4.svg" };
    (userService.updateUserProfile as Mock).mockResolvedValue({ success: true, user: updated });

    await updateProfileHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Profil mis à jour avec succès",
      data: { user: updated },
    });
  });

  it("updatePasswordHandler should return 400 on invalid current password", async () => {
    req.body = { currentPassword: "wrong", newPassword: "Password123" };
    (userService.updateUserPassword as Mock).mockResolvedValue({
      success: false,
      error: "Mot de passe actuel incorrect",
    });

    await updatePasswordHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it("updatePasswordHandler should return 200 on success", async () => {
    req.body = { currentPassword: "Old12345", newPassword: "Password123" };
    (userService.updateUserPassword as Mock).mockResolvedValue({ success: true });

    await updatePasswordHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  });
});
