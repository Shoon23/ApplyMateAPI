import { JobApplicationType } from "../schema/jobSchema";
import JobRepository, { CreateJobType } from "../repository/JobRepository";

class JobService {
  constructor(private jobRepo: JobRepository) {}

  async create(data: CreateJobType) {
    const jobData = await this.jobRepo.createJob(data);
    return jobData;
  }
}

export default JobService;
