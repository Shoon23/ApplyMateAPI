import DuplicateError from "../errors/DuplicateError";
import { toUserProfileDTO } from "../mapppers/user.mapper";
import UserProfileRepostory from "../repository/UserProfileRepository";
import UserRepository from "../repository/UserRepository";
import logger from "../utils/logger";
import LLMService from "./LLMService";

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
    const savedData = await this.userProfileRepo.createProfile({
      ...extractedData,
      userId,
    });
    logger.info("Profile saved", { userId, profileId: savedData.id });
    return savedData;
  }
}

export default UserService;
