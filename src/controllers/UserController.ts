import { Request, Response } from "express";
import LLMService from "../services/LLMService";
import UserService from "../services/UserService";
import BaseController from "./BaseController";
import { AuthRequest } from "../types/auth";
import NotFoundError from "../errors/NotFoundError";
import pdf from "pdf-parse";
import logger from "../utils/logger";
import ValidationError from "../errors/ValidationError";
import { UpdateUserProfileDTO } from "../dto/user.dto";

class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }
  handleCreateProfile = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);
    const resumeFile = req.file?.buffer;
    logger.info("Create Profile request started", { userId: user.userId });

    if (!resumeFile) {
      logger.warn("No file uploaded", { userId: user.userId });
      throw new ValidationError([
        {
          message: "No File Upload",
          property: "file",
        },
      ]);
    }
    logger.debug("File uploaded", {
      userId: user.userId,
      fileSize: resumeFile.byteLength,
    });
    const resumeData = await pdf(resumeFile);

    if (!resumeData.text) {
      logger.warn("Uploaded file is blank", { userId: user.userId });

      throw new NotFoundError({
        message: "File is blank",
        property: "file",
      });
    }

    const result = await this.userService.createProfile(
      resumeData.text,
      user.userId
    );
    logger.info("Profile created successfully", { userId: user.userId });

    res.status(201).json(result);
  };

  handleGetProfile = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);
    logger.info("Get Profile request started", { userId: user.userId });

    const result = await this.userService.getProfile(user.userId);
    logger.info(`Profile Found`, {
      id: result.id,
      userId: result.userId,
    });

    res.status(200).json(result);
  };

  handleUpdateProfile = async (req: AuthRequest, res: Response) => {
    const user = this.requireAuth(req);
    const profileId = req.params.id;

    console.log(req.body);
    logger.info("Update Profile request started", { id: profileId });

    const result = await this.userService.updateProfile(
      profileId,
      user.userId,
      req.body as UpdateUserProfileDTO
    );
    logger.info("Profile Updated Succesfully", { id: profileId });

    res.status(200).json(result);
  };
}

export default UserController;
