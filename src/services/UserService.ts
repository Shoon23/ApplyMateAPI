import { UpdateUserProfileDTO, UserProfileDTO } from "../dto/user.dto";
import DuplicateError from "../errors/DuplicateError";
import ForbiddenError from "../errors/ForbiddenError";
import NotFoundError from "../errors/NotFoundError";
import UserMapper from "../mapppers/user.mapper";
import UserProfileRepostory from "../repository/UserProfileRepository";
import UserRepository from "../repository/UserRepository";
import { WithIdAndUser } from "../types/common";
import logger from "../utils/logger";
import LLMService from "./LLMService";
import util from "util";

class UserService {
  constructor(
    private llmService: LLMService,
    private userProfileRepo: UserProfileRepostory
  ) {}
  async createProfile(resumeText: string, userId: string) {
    logger.info("Creating profile", { userId });
    const isExisting = await this.userProfileRepo.findByUserId(userId);
    if (isExisting) {
      logger.warn("Duplicate profile attempt", { userId });
      throw new DuplicateError({
        message:
          "A profile for this user already exists. Uploading a new resume is not allowed.",
        property: "file",
      });
    }
    const extractedData = await this.llmService.extractUserProfile(resumeText);
    const createData = UserMapper.toCreateProfileInput(userId, extractedData);

    const savedData = await this.userProfileRepo.createProfile(createData);
    logger.info("Profile saved", { userId, profileId: savedData.id });
    return UserMapper.toUserProfileDTO(savedData);
  }

  async getProfile(userId: string) {
    const profileData = await this.userProfileRepo.findByUserId(userId);

    if (!profileData) {
      logger.warn("Profile Not Found", { userId });
      throw new NotFoundError({
        message: "Profile Not Found",
        property: "id",
      });
    }
    return UserMapper.toUserProfileDTO(profileData);
  }

  async updateProfile(userId: string, data: UpdateUserProfileDTO) {
    const profile = await this.userProfileRepo.findByUserId(userId);

    if (!profile) {
      logger.warn("Profile Not Found", { userId });

      throw new NotFoundError({
        message: "User Profile Not Found",
        property: "id",
      });
    }

    const updateData = UserMapper.toUpateProfileInput(data);
    const updated = await this.userProfileRepo.update(profile.id, updateData);

    return UserMapper.toUserProfileDTO(updated);
  }
}

export default UserService;
