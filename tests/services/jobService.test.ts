import { Prisma, Status } from "../../generated/prisma";
import DatabaseError from "../../src/errors/DatabaseError";
import JobRepository from "../../src/repository/JobRepository";
import JobService from "../../src/services/JobService";
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
      getJobs: jest.fn(),
      getJobById: jest.fn(),
      createJob: jest.fn(),
      updateJob: jest.fn(),
      deleteJob: jest.fn(),
    } as unknown as jest.Mocked<JobRepository>;

    jobService = new JobService(mockRepo);
  });
  describe("Create Job Application", () => {
    it("should create a job successfully", async () => {
      mockRepo.createJob.mockResolvedValue(mockJob);

      const result = await jobService.create({
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

      expect(mockRepo.createJob).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockJob);
    });

    it("should throw a DatabaseError if the repository fails", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Something went wrong in the database",
        { code: "P9999", clientVersion: "unknown" }
      );
      mockRepo.createJob.mockRejectedValue(new DatabaseError(prismaError));

      await expect(
        jobService.create({
          company: "OpenAI",
          position: "Backend Engineer",
          status: "APPLIED",
          userId: "user-123",
        } as any)
      ).rejects.toBeInstanceOf(DatabaseError);
    });
  });
});
