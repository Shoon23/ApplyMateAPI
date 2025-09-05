import { Prisma } from "../../generated/prisma";
import AuthError from "../errors/AuthError";
import DatabaseError from "../errors/DatabaseError";
import { RegisterSchemaType } from "../schema/authSchema";
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
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find email");
    }
  }

  async create(userCredentials: RegisterSchemaType) {
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
}

export default UserRepository;
