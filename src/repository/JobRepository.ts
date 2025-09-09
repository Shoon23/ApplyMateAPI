import { Prisma, Status } from "../../generated/prisma";
import DatabaseError from "../errors/DatabaseError";
import NotFoundError from "../errors/NotFoundError";
import {
  JobApplicationType,
  UpdateJobApplicationType,
} from "../schema/jobSchema";
import logger from "../utils/logger";
import BaseRepository from "./BaseRepository";
export type CreateJobType = JobApplicationType & { userId: string };

export type JobFilters = {
  userId: string;
  page: number;
  limit: number;
  skip: number;
  filters: {
    search: string;
    sortBy: string;
    order: string;
  };
};

class JobRepository extends BaseRepository {
  async findAll(params: JobFilters) {
    try {
      const { userId, filters, limit, page, skip } = params;

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
      this.handleError(error, "Failed to finding jobs application");
    }
  }

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
