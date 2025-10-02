import { JobApplication, Prisma } from "../../generated/prisma";
import { CreateJobDTO, GeneratedJobScoreDTO, JobDTO } from "../dto/job.dto";
const jobWithScores = Prisma.validator<Prisma.JobApplicationDefaultArgs>()({
  include: { jobMatchScore: true },
});

export type JobWithScores = Prisma.JobApplicationGetPayload<
  typeof jobWithScores
>;
export default class JobMapper {
  static toJobDTO = (job: JobWithScores): JobDTO => ({
    id: job.id,
    company: job.company,
    position: job.position,
    source: job.source,
    status: job.status,
    appliedDate: job.appliedDate,
    deadline: job.deadline,
    contactName: job.contactName,
    contactEmail: job.contactEmail,
    description: job.description,
    salary: job.salary,
    userId: job.userId,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    jobEvaluation: job.jobMatchScore?.length
      ? {
          fitScore: job.jobMatchScore[0].fitScore,
          explanation: Array.isArray(job.jobMatchScore[0].explanation)
            ? job.jobMatchScore[0].explanation.map(String)
            : [JSON.stringify(job.jobMatchScore[0].explanation)],
        }
      : undefined,
  });
  static toJobListDTO = (jobs: JobWithScores[]): JobDTO[] =>
    jobs.map(this.toJobDTO);

  static toGeneratedJobScore(data: any) {
    return {
      fitScore: data.fitScore,
      explanation: data.explanation,
    };
  }

  static toCreateJobInput(
    userId: string,
    profileId: string | undefined,
    dto: CreateJobDTO & GeneratedJobScoreDTO
  ) {
    const input: Prisma.JobApplicationCreateInput = {
      user: { connect: { id: userId } },
      company: dto.company,
      position: dto.position,
      description: dto.description ?? null,
      contactName: dto.contactName ?? null,
      contactEmail: dto.contactEmail ?? null,
      deadline: dto.deadline ?? null,
      appliedDate: dto.appliedDate ?? null,
      salary: dto.salary ?? 0,
      status: dto.status,
      source: dto.source,
      jobMatchScore: dto.fitScore
        ? {
            create: [
              {
                fitScore: dto.fitScore,
                explanation: dto.explanation ?? {},
                userProfile: { connect: { id: profileId } },
              },
            ],
          }
        : undefined,
    };

    return input;
  }
}
