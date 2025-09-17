import { extend } from "joi";
import AuthService from "../services/AuthService";
import { Request, Response } from "express";
import BaseController from "./BaseController";
import config from "../config";
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

  private setCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth/refresh",
    });
  }
}

export default AuthController;
