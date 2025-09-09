import { create } from "domain";
import { Prisma, Status } from "../../generated/prisma";
import DatabaseError from "../../src/errors/DatabaseError";
import JobRepository from "../../src/repository/JobRepository";
import JobService from "../../src/services/JobService";
import NotFoundError from "../../src/errors/NotFoundError";
describe("Job Service", () => {
  let mockRepo: jest.Mocked<JobRepository>;
  let jobService: JobService;
  const mockJob = {
    id: "job-123",
    company: "OpenAI",
    position: "Backend Engineer",
    source: "LinkedIn",
    status: Status.APPLIED,
    appliedDate: new Date(),
    deadline: null,
    contactName: "Alice",
    contactEmail: "alice@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  };
  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mocked instance of UserRepository
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<JobRepository>;

    jobService = new JobService(mockRepo);
  });
  describe("Create Job Application", () => {
    it("should create a job successfully", async () => {
      mockRepo.create.mockResolvedValue(mockJob);

      const result = await jobService.createJobApplication({
        company: "OpenAI",
        position: "Backend Engineer",
        source: "LinkedIn",
        status: Status.APPLIED,
        appliedDate: new Date(),
        deadline: null,
        contactName: "Alice",
        contactEmail: "alice@example.com",
        userId: "user-123",
      });

      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockJob);
    });

    it("should throw a DatabaseError if the repository fails", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Something went wrong in the database",
        { code: "P9999", clientVersion: "unknown" }
      );
      mockRepo.create.mockRejectedValue(
        new DatabaseError(prismaError, "Something Went Wrong")
      );

      await expect(
        jobService.createJobApplication({
          company: "OpenAI",
          position: "Backend Engineer",
          status: "APPLIED",
          userId: "user-123",
        } as any)
      ).rejects.toBeInstanceOf(DatabaseError);
    });
  });
  describe("Get Singe Job Application", () => {
    it("should return a Job Application", async () => {
      mockRepo.findById.mockResolvedValue(mockJob);

      const result = await jobService.getJobById(mockJob.id, mockJob.userId);
      expect(mockRepo.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockJob);
    });
    it("should throw NotFoundError if no job exists for the user", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        jobService.getJobById("non-existent-id", "user-123")
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(mockRepo.findById).toHaveBeenCalledWith(
        "non-existent-id",
        "user-123"
      );
    });
    it("should throw a DatabaseError if the repository fails", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Something went wrong in the database",
        { code: "P9999", clientVersion: "unknown" }
      );
      mockRepo.create.mockRejectedValue(
        new DatabaseError(prismaError, "Something Went Wrong")
      );

      await expect(
        jobService.createJobApplication({
          company: "OpenAI",
          position: "Backend Engineer",
          status: Status.APPLIED,
          userId: "user-123",
        } as any)
      ).rejects.toBeInstanceOf(DatabaseError);
    });
    it("should normalize empty optional fields to null", async () => {
      mockRepo.create.mockResolvedValue(mockJob);

      const res = await jobService.createJobApplication({
        company: "OpenAI",
        position: "Backend Engineer",
        status: Status.APPLIED,
        userId: "user-123",
        contactName: "",
        contactEmail: "",
        source: "",
      } as any);
      const callArgs = mockRepo.create.mock.calls[0][0];
      expect(callArgs.contactName).toBeNull();
      expect(callArgs.contactEmail).toBeNull();
      expect(callArgs.source).toBeNull();
    });
    it("should include userId when creating job", async () => {
      mockRepo.create.mockResolvedValue(mockJob);

      await jobService.createJobApplication({
        company: "OpenAI",
        position: "Backend Engineer",
        status: Status.APPLIED,
        userId: "user-123",
      } as any);

      const callArgs = mockRepo.create.mock.calls[0][0];
      expect(callArgs.userId).toBe("user-123");
    });
  });
  describe("Get Jobs List", () => {
    const mockJobs = [
      { ...mockJob, id: "job-1", status: Status.APPLIED },
      { ...mockJob, id: "job-2", status: Status.INTERVIEW },
      { ...mockJob, id: "job-3", status: Status.WISHLIST },
    ];

    it("should return jobs with pagination metadata", async () => {
      mockRepo.findAll.mockResolvedValue({
        data: mockJobs,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await jobService.getJobs({
        userId: "user-123",
        filters: { search: "", sortBy: "createdAt", order: "desc" },
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
      expect(result.data.length).toBe(3);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it("should handle search filter", async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [mockJobs[0]],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await jobService.getJobs({
        userId: "user-123",
        filters: { search: "OpenAI", sortBy: "createdAt", order: "desc" },
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        userId: "user-123",
        filters: { search: "OpenAI", sortBy: "createdAt", order: "desc" },
        page: 1,
        limit: 10,
        skip: 0,
      });
      expect(result.data[0].company).toBe("OpenAI");
    });

    it("should handle status sorting", async () => {
      mockRepo.findAll.mockResolvedValue({
        data: [mockJobs[1], mockJobs[0], mockJobs[2]],
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await jobService.getJobs({
        userId: "user-123",
        filters: { search: "", sortBy: "status", order: "asc" },
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        userId: "user-123",
        filters: { search: "", sortBy: "status", order: "asc" },
        page: 1,
        limit: 10,
        skip: 0,
      });
      expect(result.data.length).toBe(3);
    });

    it("should throw DatabaseError if repository fails", async () => {
      mockRepo.findAll.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error fetching jobs")
      );

      await expect(
        jobService.getJobs({
          userId: "user-123",
          filters: { search: "", sortBy: "createdAt", order: "desc" },
          page: 1,
          limit: 10,
          skip: 0,
        })
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("Update Job Application", () => {
    it("Should return a updated company name", async () => {
      mockRepo.update.mockResolvedValue({
        ...mockJob,
        company: "google",
      });

      const updatedJob = await jobService.updateJob({
        company: "google",
        id: mockJob.id,
        userId: mockJob.userId,
      });

      expect(updatedJob.company).toBe("google");
    });
    it("Should update and return the full job object", async () => {
      const updatedJobData = { ...mockJob, company: "Google LLC" };
      mockRepo.update.mockResolvedValue(updatedJobData);

      const updatedJob = await jobService.updateJob(updatedJobData);

      expect(updatedJob).toMatchObject({
        id: "job-123",
        company: "Google LLC",
        position: "Backend Engineer",
      });
    });
    it("Should update company", async () => {
      mockRepo.update.mockResolvedValue({ ...mockJob, company: "Google" });

      const updatedJob = await jobService.updateJob({
        company: "Google",
        id: mockJob.id,
        userId: mockJob.userId,
      });

      expect(updatedJob.company).toBe("Google");
    });

    it("Should update position", async () => {
      mockRepo.update.mockResolvedValue({
        ...mockJob,
        position: "Frontend Engineer",
      });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        position: "Frontend Engineer",
      });

      expect(updatedJob.position).toBe("Frontend Engineer");
    });

    it("Should update source", async () => {
      mockRepo.update.mockResolvedValue({ ...mockJob, source: "Indeed" });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        source: "Indeed",
      });

      expect(updatedJob.source).toBe("Indeed");
    });

    it("Should update status", async () => {
      mockRepo.update.mockResolvedValue({
        ...mockJob,
        status: Status.INTERVIEW,
      });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        status: Status.INTERVIEW,
      });

      expect(updatedJob.status).toBe(Status.INTERVIEW);
    });

    it("Should update appliedDate", async () => {
      const newDate = new Date("2025-01-01");
      mockRepo.update.mockResolvedValue({ ...mockJob, appliedDate: newDate });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        appliedDate: newDate,
      });

      expect(updatedJob.appliedDate).toEqual(newDate);
    });

    it("Should update deadline", async () => {
      const newDeadline = new Date("2025-12-31");
      mockRepo.update.mockResolvedValue({ ...mockJob, deadline: newDeadline });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        deadline: newDeadline,
      });

      expect(updatedJob.deadline).toEqual(newDeadline);
    });

    it("Should update contactName", async () => {
      mockRepo.update.mockResolvedValue({ ...mockJob, contactName: "Bob" });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        contactName: "Bob",
      });

      expect(updatedJob.contactName).toBe("Bob");
    });

    it("Should update contactEmail", async () => {
      mockRepo.update.mockResolvedValue({
        ...mockJob,
        contactEmail: "bob@example.com",
      });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        contactEmail: "bob@example.com",
      });

      expect(updatedJob.contactEmail).toBe("bob@example.com");
    });

    it("Should update userId", async () => {
      mockRepo.update.mockResolvedValue({ ...mockJob, userId: "user-456" });

      const updatedJob = await jobService.updateJob({
        id: "job-123",
        userId: "user-456",
      });

      expect(updatedJob.userId).toBe("user-456");
    });
    it("should throw DatabaseError if repository fails", async () => {
      mockRepo.findAll.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error fetching jobs")
      );

      await expect(
        jobService.getJobs({
          userId: "user-123",
          filters: { search: "", sortBy: "createdAt", order: "desc" },
          page: 1,
          limit: 10,
          skip: 0,
        })
      ).rejects.toThrow(DatabaseError);
    });

    it("Should return NotFoundError instance if the job is not found", async () => {
      mockRepo.update.mockRejectedValue(
        new NotFoundError({
          message: "Job Not Found",
        })
      );

      await expect(
        jobService.updateJob({
          id: mockJob.id,
          userId: mockJob.userId,
          company: "Meta",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
    it("Should only update the selected field and leave others unchanged", async () => {
      const originalJob = { ...mockJob };

      // Simulate updating only the company field
      const updatedJobData = { ...originalJob, company: "Amazon" };
      mockRepo.update.mockResolvedValue(updatedJobData);

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        company: "Amazon",
      });

      // Ensure company updated
      expect(updatedJob.company).toBe("Amazon");

      // Ensure other fields remain unchanged
      expect(updatedJob.position).toBe(originalJob.position);
      expect(updatedJob.status).toBe(originalJob.status);
      expect(updatedJob.userId).toBe(originalJob.userId);
      expect(updatedJob.appliedDate).toEqual(originalJob.appliedDate);
      expect(updatedJob.deadline).toEqual(originalJob.deadline);
      expect(updatedJob.contactName).toBe(originalJob.contactName);
      expect(updatedJob.contactEmail).toBe(originalJob.contactEmail);
    });
  });
  describe("Delete Job Application", () => {
    it("should delete a job application successfully", async () => {
      mockRepo.delete.mockResolvedValue(mockJob);

      const result = await jobService.deleteJob(mockJob.id, mockJob.userId);

      expect(mockRepo.delete).toHaveBeenCalledWith(mockJob.id, mockJob.userId);
      expect(result).toEqual(mockJob);
    });

    it("should throw NotFoundError if job does not exist", async () => {
      // Arrange
      mockRepo.delete.mockRejectedValue(
        new NotFoundError({ message: "Job Not Found" })
      );

      // Act + Assert
      await expect(
        jobService.deleteJob("non-existent-id", "user-123")
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw DatabaseError if repository fails", async () => {
      // Arrange
      mockRepo.delete.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error deleting job")
      );

      // Act + Assert
      await expect(
        jobService.deleteJob(mockJob.id, mockJob.userId)
      ).rejects.toThrow(DatabaseError);
    });
  });
});
