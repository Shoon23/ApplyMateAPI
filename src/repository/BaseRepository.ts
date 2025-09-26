import { Prisma, PrismaClient } from "../../generated/prisma";
import CustomError from "../errors/CustomError";
import DatabaseError from "../errors/DatabaseError";
import DuplicateError from "../errors/DuplicateError";
import NotFoundError from "../errors/NotFoundError";
import prisma from "../prisma";
import logger from "../utils/logger";
class BaseRepository {
  protected prisma: PrismaClient;
  constructor() {
    this.prisma = prisma;
  }
  protected handleError(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2025":
          throw new NotFoundError({ message: "Data Not Found" });
        case "P2002":
          throw new DuplicateError({ message: "Duplicate resource found" });
        default:
          throw new DatabaseError(error, message);
      }
    }

    if (error instanceof CustomError) {
      throw error;
    }

    // fallback for unknown errors
    throw new DatabaseError(error as Error, message);
  }
}

export default BaseRepository;
