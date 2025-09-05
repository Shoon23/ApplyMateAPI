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
      console.log(res);
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
});
