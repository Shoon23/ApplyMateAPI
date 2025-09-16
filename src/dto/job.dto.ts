import { Status } from "../../generated/prisma";

export type JobDTO = {
  id: string;
  company: string;
  position: string;
  source: string | null;
  status: Status;
  appliedDate: Date | null;
  deadline: Date | null;
  contactName: string | null;
  contactEmail: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
export type CreateJobDTO = {
  company: string;
  position: string;
  source?: string | null;
  status: Status;
  appliedDate?: Date | null;
  deadline?: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
};

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
