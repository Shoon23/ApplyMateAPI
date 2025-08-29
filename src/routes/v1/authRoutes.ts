import { Router } from "express";
import AuthController from "../../controllers/AuthController";
import AuthService from "../../services/AuthService";
import UserRepository from "../../repository/UserRepository";
import { validate } from "../../middlewares/validate";
import { LoginSchema, RegisterSchema } from "../../schema/authSchema";

const authRouter = Router();

const userRepo = new UserRepository();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

authRouter.post(
  "/auth/login",
  validate(LoginSchema),
  authController.handleLogin
);
authRouter.post(
  "/auth/register",
  validate(RegisterSchema),
  authController.handleRegister
);

export default authRouter;
