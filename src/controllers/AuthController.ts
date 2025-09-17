import { extend } from "joi";
import AuthService from "../services/AuthService";
import { Request, Response } from "express";
import BaseController from "./BaseController";
import config from "../config";
import AuthError from "../errors/AuthError";
import logger from "../utils/logger";
class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  handleLogin = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    const { refreshToken, ...rest } = result;
    this.setCookie(res, refreshToken);

    res.status(200).json(rest);
  };

  handleRegister = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    const { refreshToken, ...rest } = result;
    this.setCookie(res, refreshToken);
    res.status(201).json(rest);
  };
  handleRefresh = async (req: Request, res: Response) => {
    const refreshToken = await req.cookies.refreshToken;
    if (!refreshToken) {
      logger.warn("Refresh token missing from request cookies");
      throw new AuthError({
        property: "token",
        message: "Your session has expired. Please log in again.",
      });
    }
    logger.info("Received refresh token request");

    const result = await this.authService.refresh(refreshToken);
    const { refreshToken: newRefreshToken, ...rest } = result;

    this.setCookie(res, newRefreshToken);
    logger.info(`Issued new access/refresh token for userId=${rest.user.id}`);

    res.status(201).json(rest);
  };
  private setCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}

export default AuthController;
