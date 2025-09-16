import { JobApplication } from "../../generated/prisma";
import { JobDTO } from "../dto/job.dto";

export const toJobDTO = (job: JobApplication): JobDTO => ({
  id: job.id,
  company: job.company,
  position: job.position,
  source: job.source,
  status: job.status,
  appliedDate: job.appliedDate,
  deadline: job.deadline,
  contactName: job.contactName,
  contactEmail: job.contactEmail,
  userId: job.userId,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});
export const toJobListDTO = (jobs: JobApplication[]): JobDTO[] =>
  jobs.map(toJobDTO);
