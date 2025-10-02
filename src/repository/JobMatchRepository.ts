import { GeneratedJobScoreDTO } from "../dto/job.dto";
import BaseRepository from "./BaseRepository";

class JobMatchRepository extends BaseRepository {
  async create(jobId: string, profileId: string, data: GeneratedJobScoreDTO) {
    try {
      return await this.prisma.jobMatchScore.create({
        data: {
          ...data,
          jobId,
          userProfileId: profileId,
        },
      });
    } catch (error) {
      this.handleError(error, "Failed to create Job Fit Score");
    }
  }
}

export default JobMatchRepository;
