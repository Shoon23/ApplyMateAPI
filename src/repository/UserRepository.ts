import { Prisma } from "../../generated/prisma";
import { RegisterDTO } from "../dto/auth.dto";
import AuthError from "../errors/AuthError";
import DatabaseError from "../errors/DatabaseError";
import BaseRepository from "./BaseRepository";

class UserRepository extends BaseRepository {
  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find email");
    }
  }

  async create(userCredentials: RegisterDTO) {
    try {
      return await this.prisma.user.create({
        data: {
          name: userCredentials.name,
          email: userCredentials.email,
          password: userCredentials.password,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to create account");
    }
  }

  async findById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find User");
    }
  }
}

export default UserRepository;
