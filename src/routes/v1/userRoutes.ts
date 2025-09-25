import { Router } from "express";
import UserController from "../../controllers/UserController";
import LLMService from "../../services/LLMService";
import UserService from "../../services/UserService";
import UserRepository from "../../repository/UserRepository";
import uploadMiddleware from "../../middlewares/uploadMiddleware";
import config from "../../config";
import UserProfileRepostory from "../../repository/UserProfileRepository";
import { validateReqParam } from "../../middlewares/validateReqParam";
import { UserProfileIDSchema } from "../../schema/userSchema";
const userProfileRepo = new UserProfileRepostory();
const llmService = new LLMService(config.GEMINI_API_KEY as string);
const userService = new UserService(llmService, userProfileRepo);
const userController = new UserController(userService);

const userRouter = Router();

userRouter.post(
  "/",
  uploadMiddleware.single("file"),
  userController.handleCreateProfile
);
userRouter.get(
  "/:id",
  validateReqParam(UserProfileIDSchema),
  userController.handleGetProfile
);
export default userRouter;
