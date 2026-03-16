import type { NextFunction, Request, Response } from "express";
import { type Mock, vi } from "vitest";
import { authenticate } from "../../src/middlewares/auth.middleware";
import * as jwtUtils from "../../src/utils/jwt.utils";

vi.mock("../../src/utils/jwt.utils");

describe("auth.middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = {
      headers: {
        authorization: "Bearer token",
      },
    };
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  it("should return 401 when token is missing", () => {
    (jwtUtils.extractTokenFromHeader as Mock).mockReturnValue(null);

    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", () => {
    (jwtUtils.extractTokenFromHeader as Mock).mockReturnValue("token");
    (jwtUtils.verifyAccessToken as Mock).mockReturnValue(null);

    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should set req.user and call next when token is valid", () => {
    (jwtUtils.extractTokenFromHeader as Mock).mockReturnValue("token");
    (jwtUtils.verifyAccessToken as Mock).mockReturnValue({
      userId: 5,
      email: "valid@example.com",
    });

    authenticate(req as Request, res as Response, next);

    expect((req as Request & { user: { id: number; email: string } }).user).toEqual({
      id: 5,
      email: "valid@example.com",
    });
    expect(next).toHaveBeenCalled();
  });

  it("should return 500 when unexpected error occurs", () => {
    (jwtUtils.extractTokenFromHeader as Mock).mockImplementation(() => {
      throw new Error("unexpected");
    });

    authenticate(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
