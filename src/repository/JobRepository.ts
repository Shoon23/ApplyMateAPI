import { Prisma, Status } from "../../generated/prisma";
import {
  CreateJobDTO,
  CreateJobWithScoreDTO,
  FindAllJobsDTO,
} from "../dto/job.dto";
import NotFoundError from "../errors/NotFoundError";
import {
  JobApplicationType,
  UpdateJobApplicationType,
} from "../schema/jobSchema";
import { WithUserId } from "../types/common";
import logger from "../utils/logger";
import BaseRepository from "./BaseRepository";

class JobRepository extends BaseRepository {
  async findAll(params: FindAllJobsDTO) {
    try {
      const { userId, filters, pagination } = params;
      const { limit, page, skip } = pagination;
      const where: any = {
        userId,
      };

      if (filters.search) {
        where.OR = [
          { company: { contains: filters.search, mode: "insensitive" } },
          { position: { contains: filters.search, mode: "insensitive" } },
          { source: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      let orderBy: any = {
        createdAt: filters.order === "asc" ? "asc" : "desc",
      };

      const isStatus = Object.values(Status).includes(filters.sortBy as Status);
      if (isStatus) {
        orderBy = { status: filters.order === "asc" ? "asc" : "desc" };
      }

      const [jobs, total] = await Promise.all([
        this.prisma.jobApplication.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            jobMatchScore: true,
          },
        }),
        this.prisma.jobApplication.count({ where }),
      ]);

      return {
        data: jobs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.handleError(error, "Failed to find jobs application");
    }
  }

  async findById(id: string, userId: string) {
    try {
      return await this.prisma.jobApplication.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          jobMatchScore: true,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to find job application");
    }
  }

  async create(data: WithUserId<CreateJobDTO>) {
    try {
      return await this.prisma.jobApplication.create({
        data: data,
      });
    } catch (error) {
      this.handleError(error, "Failed to create job application");
    }
  }
  async createWithJobScore(
    profileId: string,
    data: WithUserId<CreateJobWithScoreDTO>
  ) {
    try {
      const { jobEvaluation, ...other } = data;
      return await this.prisma.jobApplication.create({
        data: {
          ...other,
          jobMatchScore: {
            create: {
              explanation: jobEvaluation?.explanation ?? [],
              fitScore: jobEvaluation?.fitScore ?? 0,
              userProfileId: profileId,
            },
          },
        },
        include: {
          jobMatchScore: true,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to create job application");
    }
  }
  async update(
    data: UpdateJobApplicationType & { id: string; userId: string }
  ) {
    try {
      const { id, userId, ...job } = data;

      return await this.prisma.$transaction(async (tx) => {
        const existingJob = await tx.jobApplication.findFirst({
          where: { id, userId },
        });

        if (!existingJob) {
          logger.warn("Job Not Found", { id, userId });
          throw new NotFoundError({ message: `Job Not Found` });
        }

        return await tx.jobApplication.update({
          where: { id },
          data: job,
        });
      });
    } catch (error) {
      this.handleError(error, "Failed to Update Jobs");
    }
  }

  async delete(id: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const isExistingJob = await tx.jobApplication.findFirst({
          where: { id, userId },
        });

        if (!isExistingJob) {
          logger.warn("Job Not Found", {
            id,
            userId,
          });
          throw new NotFoundError({
            message: "Job Not Found",
            property: "id",
          });
        }

        return await tx.jobApplication.delete({
          where: { id },
        });
      });
    } catch (error) {
      this.handleError(error, "Failed to delete job");
    }
  }
}

export default JobRepository;
