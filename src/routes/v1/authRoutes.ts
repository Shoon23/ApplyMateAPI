import { Router } from "express";
import AuthController from "../../controllers/AuthController";
import AuthService from "../../services/AuthService";
import UserRepository from "../../repository/UserRepository";
import { validateReqBody } from "../../middlewares/validateReqBody";
import { LoginSchema, RegisterSchema } from "../../schema/authSchema";

const authRouter = Router();

const userRepo = new UserRepository();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

authRouter.post(
  "/login",
  validateReqBody(LoginSchema),
  authController.handleLogin
);
authRouter.post(
  "/register",
  validateReqBody(RegisterSchema),
  authController.handleRegister
);

export default authRouter;
