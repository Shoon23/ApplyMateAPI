import { Prisma, Status } from "../../generated/prisma";
import DatabaseError from "../errors/DatabaseError";
import { JobApplicationType } from "../schema/jobSchema";
import BaseRepository from "./BaseRepository";
import UserRepository from "./UserRepository";
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

  async update(id: string, data: any) {}

  async deleteJob(id: string) {}
}

export default JobRepository;
