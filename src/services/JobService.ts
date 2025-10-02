import {
  JobApplicationType,
  UpdateJobApplicationType,
} from "../schema/jobSchema";
import JobRepository from "../repository/JobRepository";
import logger from "../utils/logger";
import NotFoundError from "../errors/NotFoundError";
import {
  CreateJobDTO,
  GeneratedJobScoreDTO,
  JobFiltersDTO,
  JobQueryDTO,
  PaginatedJobsDTO,
  UpdateJobDTO,
} from "../dto/job.dto";
import { WithIdAndUser, WithUserId } from "../types/common";
import JobMapper from "../mapppers/job.mapper";
import UserRepository from "../repository/UserRepository";
import UserProfileRepostory from "../repository/UserProfileRepository";
import LLMService from "./LLMService";
import UserMapper from "../mapppers/user.mapper";
import JobMatchRepository from "../repository/JobMatchRepository";

class JobService {
  constructor(
    private jobRepo: JobRepository,
    private userProfileRepo: UserProfileRepostory,
    private llmService: LLMService,
    private jobMatchRepo: JobMatchRepository
  ) {}

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

    const userProfile = await this.userProfileRepo.findByUserId(data.userId, {
      education: true,
      experience: true,
      skills: true,
    });
    let jobData: any;
    if (normalizedData.description && userProfile) {
      const cleanProfile = UserMapper.toExtractedUserProfileDTO(userProfile);
      const generatedScore = await this.llmService.getJobMatchScore(
        JSON.stringify(cleanProfile),
        normalizedData.description
      );

      console.log(generatedScore);

      jobData = await this.jobRepo.createWithJobScore(userProfile.id, {
        ...normalizedData,
        jobEvaluation: generatedScore,
      });
    } else {
      jobData = await this.jobRepo.create(normalizedData);
    }

    console.log(jobData);
    logger.info("Job application created successfully", {
      jobId: jobData.id,
      userId: jobData.userId,
    });

    // return jobData;
    return JobMapper.toJobDTO(jobData);
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

    return JobMapper.toJobDTO(jobData);
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
      data: jobsData.data.map(JobMapper.toJobDTO),
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

  async createFitScore(id: string, userId: string) {
    logger.info("Creating Job Fit Score", { id, userId });

    const job = await this.jobRepo.findById(id, userId);
    if (!job) {
      logger.warn("Job Not Found", { id });
      throw new NotFoundError({
        message: "Job Not Found",
        property: "id",
      });
    }

    if (!job.description) {
      logger.warn("Job Not Found", { id });
      throw new NotFoundError({
        message: "Job Not Found",
        property: "id",
      });
    }

    const profile = await this.userProfileRepo.findByUserId(userId);
    if (!profile) {
      logger.warn("Profile Not Found", { userId });
      throw new NotFoundError({
        message: "Profile Not Found",
        property: "id",
      });
    }

    const cleanProfile = UserMapper.toExtractedUserProfileDTO(profile);
    const fitScore = await this.llmService.getJobMatchScore(
      JSON.stringify(cleanProfile),
      job.description
    );

    const savedScore = await this.jobMatchRepo.create(
      job.id,
      profile.id,
      fitScore
    );

    return savedScore;
  }
}

export default JobService;
