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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error);
      }
      throw new DatabaseError(error as Error);
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error);
      }
      throw new DatabaseError(error as Error);
    }
  }
}

export default UserRepository;
