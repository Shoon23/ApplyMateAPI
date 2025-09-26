import { Router } from "express";
import UserController from "../../controllers/UserController";
import LLMService from "../../services/LLMService";
import UserService from "../../services/UserService";
import uploadMiddleware from "../../middlewares/uploadMiddleware";
import config from "../../config";
import UserProfileRepostory from "../../repository/UserProfileRepository";
import { UpdateUserProfileSchema } from "../../schema/userSchema";
import { validateReqBody } from "../../middlewares/validateReqBody";

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
userRouter.get("/", userController.handleGetProfile);

userRouter.patch(
  "/",
  validateReqBody(UpdateUserProfileSchema),
  userController.handleUpdateProfile
);
export default userRouter;
