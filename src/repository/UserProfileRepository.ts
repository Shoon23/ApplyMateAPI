import { Prisma } from "../../generated/prisma";
import {
  ExtractedUserProfileDTO,
  UpdateUserProfileDTO,
  UserProfileDTO,
} from "../dto/user.dto";
import { WithUserId } from "../types/common";
import BaseRepository from "./BaseRepository";

class UserProfileRepostory extends BaseRepository {
  async createProfile(data: Prisma.UserProfileCreateInput) {
    try {
      return this.prisma.userProfile.create({
        data,
        include: {
          contact: true,
          skills: true,
          experience: true,
          education: true,
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

  async findById(id: string) {
    try {
      return await this.prisma.userProfile.findFirst({
        where: {
          id,
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

  async update(id: string, data: Prisma.UserProfileUpdateInput) {
    return this.prisma.userProfile.update({
      where: { id },
      data,
      include: {
        contact: true,
        skills: true,
        experience: true,
        education: true,
      },
    });
  }
}

export default UserProfileRepostory;
