import { extend } from "joi";
import AuthService from "../services/AuthService";
import { Request, Response } from "express";
import BaseController from "./BaseController";

class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  handleLogin = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    res.status(200).json(result);
  };

  handleRegister = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);

    res.status(201).json(result);
  };
}

export default AuthController;
