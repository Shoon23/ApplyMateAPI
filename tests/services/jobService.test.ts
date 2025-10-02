import { create } from "domain";
import { JobApplication, Prisma, Status } from "../../generated/prisma";
import DatabaseError from "../../src/errors/DatabaseError";
import JobRepository from "../../src/repository/JobRepository";
import JobService from "../../src/services/JobService";
import NotFoundError from "../../src/errors/NotFoundError";
import LLMService from "../../src/services/LLMService";
import UserProfileRepostory from "../../src/repository/UserProfileRepository";
import JobMatchRepository from "../../src/repository/JobMatchRepository";
import { JobDTO } from "../../src/dto/job.dto";
describe("Job Service", () => {
  let jobMockRepo: jest.Mocked<JobRepository>;
  let jobService: JobService;

  let mockLLMService: jest.Mocked<LLMService>;
  let userProfileMockrepo: jest.Mocked<UserProfileRepostory>;

  let jobMatchMockRepo: jest.Mocked<JobMatchRepository>;

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
    description: "some description",
    notes: null,
    salary: 0,
    jobMatchScore: [
      {
        id: "score-123",
        jobId: "job-123",
        userProfileId: "profile-123",
        fitScore: 75,
        explanation: ["some explanation"],
      },
    ],
  };

  const mockUserProfile = {
    contact: {
      id: "some-id",
      profileId: "mock-id",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+63 912 345 6789",
      linkedin: "linkedin.com/in/janedoe",
    },
    skills: [
      {
        name: "Python",
        id: "some-id",
        profileId: "mock-id",
      },
      {
        name: "React",
        id: "some-id",
        profileId: "mock-id",
      },
      {
        name: "SQL",
        id: "some-id",
        profileId: "mock-id",
      },
    ],
    experience: [
      {
        id: "some-id",
        profileId: "mock-id",
        company: "ABC Corp",
        role: "Software Engineer",
        startDate: "2021-01",
        endDate: "2023-06",
        achievements: [
          "Developed REST APIs with Express.js",
          "Improved query performance by 30%",
        ],
      },
    ],
    education: [
      {
        id: "some-id",
        profileId: "mock-id",
        degree: "BSc Computer Science",
        institution: "XYZ University",
        year: "2020",
      },
    ],
    userId: mockJob.userId,
    resumeText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    id: "231",
  };
  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mocked instance of UserRepository
    jobMockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<JobRepository>;
    userProfileMockrepo = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<UserProfileRepostory>;
    jobMatchMockRepo = {
      create: jest.fn(),
    } as unknown as jest.Mocked<JobMatchRepository>;

    mockLLMService = {
      getJobMatchScore: jest.fn(),
    } as unknown as jest.Mocked<LLMService>;

    jobService = new JobService(
      jobMockRepo,
      userProfileMockrepo,
      mockLLMService,
      jobMatchMockRepo
    );
  });
  describe("Create Job Application", () => {
    it("should create a job successfully", async () => {
      jobMockRepo.create.mockResolvedValue(mockJob);
      userProfileMockrepo.findByUserId.mockResolvedValue(mockUserProfile);
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

      expect(jobMockRepo.create).toHaveBeenCalledTimes(1);
      expect(result.id).toEqual(mockJob.id);
    });

    it("should throw a DatabaseError if the repository fails", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Something went wrong in the database",
        { code: "P9999", clientVersion: "unknown" }
      );
      jobMockRepo.create.mockRejectedValue(
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
      jobMockRepo.findById.mockResolvedValue(mockJob);

      const result = await jobService.getJobById(mockJob.id, mockJob.userId);
      expect(jobMockRepo.findById).toHaveBeenCalledTimes(1);
      expect(result.id).toEqual(mockJob.id);
    });
    it("should throw NotFoundError if no job exists for the user", async () => {
      jobMockRepo.findById.mockResolvedValue(null);

      await expect(
        jobService.getJobById("non-existent-id", "user-123")
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(jobMockRepo.findById).toHaveBeenCalledWith(
        "non-existent-id",
        "user-123"
      );
    });
    it("should throw a DatabaseError if the repository fails", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Something went wrong in the database",
        { code: "P9999", clientVersion: "unknown" }
      );
      jobMockRepo.create.mockRejectedValue(
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
      jobMockRepo.create.mockResolvedValue(mockJob);

      const res = await jobService.createJobApplication({
        company: "OpenAI",
        position: "Backend Engineer",
        status: Status.APPLIED,
        userId: "user-123",
        contactName: "",
        contactEmail: "",
        source: "",
      } as any);
      const callArgs = jobMockRepo.create.mock.calls[0][0];
      expect(callArgs.contactName).toBeNull();
      expect(callArgs.contactEmail).toBeNull();
      expect(callArgs.source).toBeNull();
    });
    it("should include userId when creating job", async () => {
      jobMockRepo.create.mockResolvedValue(mockJob);

      await jobService.createJobApplication({
        company: "OpenAI",
        position: "Backend Engineer",
        status: Status.APPLIED,
        userId: "user-123",
      } as any);

      const callArgs = jobMockRepo.create.mock.calls[0][0];
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
      jobMockRepo.findAll.mockResolvedValue({
        data: mockJobs,
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await jobService.getJobs({
        userId: "user-123",
        query: { search: "", sortBy: "createdAt", order: "desc" },
        pagination: { page: 1, limit: 10, skip: 0 },
      });

      expect(jobMockRepo.findAll).toHaveBeenCalledTimes(1);
      expect(result.data.length).toBe(3);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it("should handle search filter", async () => {
      jobMockRepo.findAll.mockResolvedValue({
        data: [mockJobs[0]],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await jobService.getJobs({
        userId: "user-123",
        query: { search: "OpenAI", sortBy: "createdAt", order: "desc" },
        pagination: { page: 1, limit: 10, skip: 0 },
      });

      expect(jobMockRepo.findAll).toHaveBeenCalledWith({
        userId: "user-123",
        filters: { search: "OpenAI", sortBy: "createdAt", order: "desc" },
        pagination: { page: 1, limit: 10, skip: 0 },
      });
      expect(result.data[0].company).toBe("OpenAI");
    });

    it("should handle status sorting", async () => {
      jobMockRepo.findAll.mockResolvedValue({
        data: [mockJobs[1], mockJobs[0], mockJobs[2]],
        meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await jobService.getJobs({
        userId: "user-123",
        query: { search: "", sortBy: "status", order: "asc" },
        pagination: { page: 1, limit: 10, skip: 0 },
      });

      expect(jobMockRepo.findAll).toHaveBeenCalledWith({
        userId: "user-123",
        filters: { search: "", sortBy: "status", order: "asc" },
        pagination: { page: 1, limit: 10, skip: 0 },
      });
      expect(result.data.length).toBe(3);
    });

    it("should throw DatabaseError if repository fails", async () => {
      jobMockRepo.findAll.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error fetching jobs")
      );

      await expect(
        jobService.getJobs({
          userId: "user-123",
          query: { search: "", sortBy: "createdAt", order: "desc" },
          pagination: { page: 1, limit: 10, skip: 0 },
        })
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("Update Job Application", () => {
    it("Should return a updated company name", async () => {
      jobMockRepo.update.mockResolvedValue({
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
      jobMockRepo.update.mockResolvedValue(updatedJobData);

      const updatedJob = await jobService.updateJob(updatedJobData);

      expect(updatedJob).toMatchObject({
        id: "job-123",
        company: "Google LLC",
        position: "Backend Engineer",
      });
    });
    it("Should update company", async () => {
      jobMockRepo.update.mockResolvedValue({ ...mockJob, company: "Google" });

      const updatedJob = await jobService.updateJob({
        company: "Google",
        id: mockJob.id,
        userId: mockJob.userId,
      });

      expect(updatedJob.company).toBe("Google");
    });

    it("Should update position", async () => {
      jobMockRepo.update.mockResolvedValue({
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
      jobMockRepo.update.mockResolvedValue({ ...mockJob, source: "Indeed" });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        source: "Indeed",
      });

      expect(updatedJob.source).toBe("Indeed");
    });

    it("Should update status", async () => {
      jobMockRepo.update.mockResolvedValue({
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
      jobMockRepo.update.mockResolvedValue({
        ...mockJob,
        appliedDate: newDate,
      });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        appliedDate: newDate,
      });

      expect(updatedJob.appliedDate).toEqual(newDate);
    });

    it("Should update deadline", async () => {
      const newDeadline = new Date("2025-12-31");
      jobMockRepo.update.mockResolvedValue({
        ...mockJob,
        deadline: newDeadline,
      });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        deadline: newDeadline,
      });

      expect(updatedJob.deadline).toEqual(newDeadline);
    });

    it("Should update contactName", async () => {
      jobMockRepo.update.mockResolvedValue({ ...mockJob, contactName: "Bob" });

      const updatedJob = await jobService.updateJob({
        id: mockJob.id,
        userId: mockJob.userId,
        contactName: "Bob",
      });

      expect(updatedJob.contactName).toBe("Bob");
    });

    it("Should update contactEmail", async () => {
      jobMockRepo.update.mockResolvedValue({
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
      jobMockRepo.update.mockResolvedValue({ ...mockJob, userId: "user-456" });

      const updatedJob = await jobService.updateJob({
        id: "job-123",
        userId: "user-456",
      });

      expect(updatedJob.userId).toBe("user-456");
    });
    it("should throw DatabaseError if repository fails", async () => {
      jobMockRepo.findAll.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error fetching jobs")
      );

      await expect(
        jobService.getJobs({
          userId: "user-123",
          query: { search: "", sortBy: "createdAt", order: "desc" },
          pagination: { page: 1, limit: 10, skip: 0 },
        })
      ).rejects.toThrow(DatabaseError);
    });

    it("Should return NotFoundError instance if the job is not found", async () => {
      jobMockRepo.update.mockRejectedValue(
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
      jobMockRepo.update.mockResolvedValue(updatedJobData);

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
      jobMockRepo.delete.mockResolvedValue(mockJob);

      const result = await jobService.deleteJob(mockJob.id, mockJob.userId);

      expect(jobMockRepo.delete).toHaveBeenCalledWith(
        mockJob.id,
        mockJob.userId
      );
      expect(result).toEqual(mockJob);
    });

    it("should throw NotFoundError if job does not exist", async () => {
      // Arrange
      jobMockRepo.delete.mockRejectedValue(
        new NotFoundError({ message: "Job Not Found" })
      );

      // Act + Assert
      await expect(
        jobService.deleteJob("non-existent-id", "user-123")
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should throw DatabaseError if repository fails", async () => {
      // Arrange
      jobMockRepo.delete.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error deleting job")
      );

      // Act + Assert
      await expect(
        jobService.deleteJob(mockJob.id, mockJob.userId)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("Create Job Fit Score", () => {
    it("should create job fit score successfully", async () => {
      // Arrange: mock LLM response
      mockLLMService.getJobMatchScore.mockResolvedValue({
        fitScore: 75,
        explanation: ["some explanation"],
      });

      jobMockRepo.findById.mockResolvedValue(mockJob);

      userProfileMockrepo.findByUserId.mockResolvedValue(mockUserProfile);
      // Arrange: mock repo create response
      jobMatchMockRepo.create.mockResolvedValue({
        id: "score-123",
        jobId: mockJob.id,
        userProfileId: "profile-123",
        fitScore: 75,
        explanation: ["some explanation"],
      });

      // Act: call the service method
      const result = await jobService.createFitScore("job-123", "user-123");

      expect(mockLLMService.getJobMatchScore).toHaveBeenCalledTimes(1);

      expect(jobMatchMockRepo.create).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        id: "score-123",
        jobId: "job-123",
        userProfileId: "profile-123",
        fitScore: 75,
        explanation: ["some explanation"],
      });
    });

    it("should throw DatabaseError if JobMatchRepo.create fails", async () => {
      mockLLMService.getJobMatchScore.mockResolvedValue({
        fitScore: 80,
        explanation: ["good fit"],
      });
      jobMockRepo.findById.mockResolvedValue(mockJob);

      userProfileMockrepo.findByUserId.mockResolvedValue(mockUserProfile);
      jobMatchMockRepo.create.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Error creating fit score")
      );

      await expect(
        jobService.createFitScore("job-123", "user-123")
      ).rejects.toBeInstanceOf(DatabaseError);
    });

    it("should throw NotFoundError if job dont exists", async () => {
      jobMockRepo.findById.mockResolvedValue(null);

      await expect(
        jobService.getJobById("non-existent-id", "user-123")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
