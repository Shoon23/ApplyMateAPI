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
    logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError({
          message: "Data Not Found",
        });
      }
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[])?.join(", ") ?? "field";
        throw new DuplicateError({
          message: "Duplicate resource found",
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
