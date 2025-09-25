import { Prisma } from "../../generated/prisma";
import { ExtractedUserProfileDTO, UserProfileDTO } from "../dto/user.dto";
import { WithUserId } from "../types/common";
import BaseRepository from "./BaseRepository";

class UserProfileRepostory extends BaseRepository {
  async createProfile(data: WithUserId<ExtractedUserProfileDTO>) {
    try {
      const { userId, contact, education, experience, skills } = data;

      return await this.prisma.userProfile.create({
        data: {
          userId,
          contact: contact ?? Prisma.JsonNull,
          education: education ?? Prisma.JsonNull,
          experience: experience ?? Prisma.JsonNull,
          skills: skills ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to save User Profile");
    }
  }

  async findByIdAndUserId(id: string, userId: string) {
    try {
      return await this.prisma.userProfile.findFirst({
        where: {
          id,
          userId,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find user profile");
    }
  }
  async findByUserId(userId: string) {
    try {
      return await this.prisma.userProfile.findUnique({
        where: {
          userId,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find user profile");
    }
  }
}

export default UserProfileRepostory;
