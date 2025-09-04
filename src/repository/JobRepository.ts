import { Prisma } from "../../generated/prisma";
import DatabaseError from "../errors/DatabaseError";
import { JobApplicationType } from "../schema/jobSchema";
import UserRepository from "./UserRepository";
export type CreateJobType = JobApplicationType & { userId: string };

class JobRepository extends UserRepository {
  async getJobs() {}

  async getJobById(id: string) {}

  async createJob(data: CreateJobType) {
    try {
      return await this.prisma.jobApplication.create({
        data: data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error);
      }
      throw new DatabaseError(error as Error);
    }
  }

  async updateJob(id: string, data: any) {}

  async deleteJob(id: string) {}
}

export default JobRepository;
