import { Prisma } from "../../generated/prisma";
import DatabaseError from "../errors/DatabaseError";
import { JobApplicationType } from "../schema/jobSchema";
import BaseRepository from "./BaseRepository";
import UserRepository from "./UserRepository";
export type CreateJobType = JobApplicationType & { userId: string };

class JobRepository extends BaseRepository {
  async findAll() {}

  async findById(id: string, userId: string) {
    try {
      return await this.prisma.jobApplication.findFirst({
        where: {
          id,
          userId,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find job application");
    }
  }

  async create(data: CreateJobType) {
    try {
      return await this.prisma.jobApplication.create({
        data: data,
      });
    } catch (error) {
      this.handleError(error, "Failed to create job application");
    }
  }

  async update(id: string, data: any) {}

  async deleteJob(id: string) {}
}

export default JobRepository;
