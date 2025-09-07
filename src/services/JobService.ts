import { JobApplicationType } from "../schema/jobSchema";
import JobRepository, {
  CreateJobType,
  JobFilters,
} from "../repository/JobRepository";
import logger from "../utils/logger";
import NotFoundError from "../errors/NotFoundError";

class JobService {
  constructor(private jobRepo: JobRepository) {}

  async createJobApplication(data: CreateJobType) {
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
    return jobData;
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

    return jobData;
  }

  async getJobs(data: JobFilters) {
    logger.info("Fetching jobs list", {
      userId: data.userId,
      search: data.filters.search || null,
      sortBy: data.filters.sortBy || "createdAt",
      order: data.filters.order || "desc",
      page: data.page,
      limit: data.limit,
    });
    const jobsData = await this.jobRepo.findAll(data);
    logger.info("Jobs fetched successfully", {
      total: jobsData.meta.total,
      page: jobsData.meta.page,
      limit: jobsData.meta.limit,
      totalPages: jobsData.meta.totalPages,
    });

    return jobsData;
  }
}

export default JobService;
