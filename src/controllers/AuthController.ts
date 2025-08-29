import AuthService from "../services/AuthService";
import { Request, Response } from "express";

class AuthController {
  constructor(private authService: AuthService) {}

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
