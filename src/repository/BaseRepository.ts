import { Prisma, PrismaClient } from "../../generated/prisma";
import DatabaseError from "../errors/DatabaseError";
import prisma from "../prisma";
class BaseRepository {
  protected prisma: PrismaClient;
  constructor() {
    this.prisma = prisma;
  }
  protected handleError(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error, message);
    }
    throw new DatabaseError(error as Error, message);
  }
}

export default BaseRepository;
