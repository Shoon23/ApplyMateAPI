import { JobApplicationType } from "../schema/jobSchema";
import JobRepository, { CreateJobType } from "../repository/JobRepository";
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
    logger.info(`finding job with id: ${id}`);
    const jobData = await this.jobRepo.findById(id, userId);

    if (!jobData) {
      throw new NotFoundError({
        message: "Job not Found",
        property: "id",
      });
    }
    return jobData;
  }
}

export default JobService;
