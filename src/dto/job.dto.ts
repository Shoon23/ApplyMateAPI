import { Status } from "../../generated/prisma";

export interface JobDTO extends CreateJobDTO {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  jobEvaluation?: GeneratedJobScoreDTO;
}
export interface CreateJobDTO {
  company: string;
  position: string;
  source?: string | null;
  status: Status;
  appliedDate?: Date | null;
  deadline?: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  description?: string | null;
  salary?: number | null;
}
export interface CreateJobWithScoreDTO {
  company: string;
  position: string;
  source?: string | null;
  status: Status;
  appliedDate?: Date | null;
  deadline?: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  description?: string | null;
  salary?: number | null;
  jobEvaluation?: GeneratedJobScoreDTO;
}
export interface GeneratedJobScoreDTO {
  fitScore: number;
  explanation: string[];
}

export type UpdateJobDTO = Partial<CreateJobDTO>;
// Query
export type JobQueryDTO = {
  userId: string;
  query: any;
  pagination: { limit: number; page: number; skip: number };
};
export type JobFiltersDTO = {
  search?: string;
  sortBy: string;
  order: "asc" | "desc";
};

export type PaginationDTO = {
  limit: number;
  page: number;
  skip: number;
};

export type FindAllJobsDTO = {
  userId: string;
  filters: JobFiltersDTO;
  pagination: PaginationDTO;
};
export type PaginatedJobsDTO = {
  data: JobDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
