import { PrismaClient } from "../../generated/prisma";
import prisma from "../prisma";
class BaseRepository {
  protected prisma: PrismaClient;
  constructor() {
    this.prisma = prisma;
  }
}

export default BaseRepository;
