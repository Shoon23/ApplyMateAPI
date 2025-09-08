import { Prisma, PrismaClient } from "../../generated/prisma";
import CustomError from "../errors/CustomError";
import DatabaseError from "../errors/DatabaseError";
import NotFoundError from "../errors/NotFoundError";
import prisma from "../prisma";
class BaseRepository {
  protected prisma: PrismaClient;
  constructor() {
    this.prisma = prisma;
  }
  protected handleError(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError({
          message: "Data Not Found",
        });
      }
      throw new DatabaseError(error, message);
    }

    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseError(error as Error, message);
  }
}

export default BaseRepository;
