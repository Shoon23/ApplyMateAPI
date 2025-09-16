import {
  JobApplicationType,
  UpdateJobApplicationType,
} from "../schema/jobSchema";
import JobRepository, { CreateJobType } from "../repository/JobRepository";
import logger from "../utils/logger";
import NotFoundError from "../errors/NotFoundError";
import {
  CreateJobDTO,
  JobFiltersDTO,
  JobQueryDTO,
  PaginatedJobsDTO,
  UpdateJobDTO,
} from "../dto/job.dto";
import { WithIdAndUser, WithUserId } from "../types/common";
import { toJobDTO } from "../mapppers/job.mapper";

class JobService {
  constructor(private jobRepo: JobRepository) {}

  async createJobApplication(data: WithUserId<CreateJobDTO>) {
    logger.info("Creating job application", {
      company: data.company,
      position: data.position,
      userId: data.userId,
    });
    const normalizedData = {
      ...data,
      contactName: data.contactName?.trim() === "" ? null : data.contactName,
      contactEmail: data.contactEmail?.trim() === "" ? null : data.contactEmail,
      source: data.source?.trim() === "" ? null : data.source,
    };
    const jobData = await this.jobRepo.create(normalizedData);
    logger.info("Job application created successfully", {
      jobId: jobData.id,
      userId: jobData.userId,
    });
    return toJobDTO(jobData);
  }
  async getJobById(id: string, userId: string) {
    logger.info("Fetching job application", { jobId: id, userId });
    const jobData = await this.jobRepo.findById(id, userId);

    if (!jobData) {
      logger.warn("Job application not found", { jobId: id, userId });

      throw new NotFoundError({
        message: "Job not Found",
        property: "id",
      });
    }

    logger.info(`Job Found`, {
      id: jobData.id,
      userId: jobData.userId,
    });

    return toJobDTO(jobData);
  }

  async getJobs(data: JobQueryDTO): Promise<PaginatedJobsDTO> {
    const filters: JobFiltersDTO = {
      search: (data.query.search as string) ?? "",
      sortBy: (data.query.sortBy as string) ?? "APPLIED",
      order: data.query.order ?? "desc",
    };
    logger.info("Fetching jobs list", {
      userId: data.userId,
      ...filters,
      page: data.pagination,
      limit: data.pagination,
    });

    const jobsData = await this.jobRepo.findAll({
      userId: data.userId,
      pagination: data.pagination,
      filters,
    });
    logger.info("Jobs fetched successfully", {
      total: jobsData.meta.total,
      page: jobsData.meta.page,
      limit: jobsData.meta.limit,
      totalPages: jobsData.meta.totalPages,
    });

    return {
      data: jobsData.data.map(toJobDTO), // ✅ Normalize each job
      meta: jobsData.meta,
    };
  }

  async updateJob(data: WithIdAndUser<UpdateJobDTO>) {
    logger.info("Updating job application", {
      jobId: data.id,
      userId: data.userId,
    });

    const updatedJob = await this.jobRepo.update(data);
    logger.info("Job Updated successfully", {
      jobId: data.id,
      userId: data.userId,
    });
    return updatedJob;
  }
  async deleteJob(id: string, userId: string) {
    logger.info("Deleting job application", {
      jobId: id,
      userId: userId,
    });

    const deletedJob = await this.jobRepo.delete(id, userId);
    logger.info("Job application deleted Successfully", {
      jobId: id,
      userId: userId,
    });
    return deletedJob;
  }
}

export default JobService;
