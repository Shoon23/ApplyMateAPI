import UserService from "../../src/services/UserService";
import LLMService from "../../src/services/LLMService";
import UserProfileRepostory from "../../src/repository/UserProfileRepository";
import DatabaseError from "../../src/errors/DatabaseError";
import LLMExtractionError from "../../src/errors/LLMExtractionError";
import DuplicateError from "../../src/errors/DuplicateError";
import NotFoundError from "../../src/errors/NotFoundError";

describe("UserService", () => {
  let userService: UserService;
  let mockLLMService: jest.Mocked<LLMService>;
  let mockUserRepository: jest.Mocked<UserProfileRepostory>;
  const mockUserId = "some-id-123";
  const resumeText = "Jane Doe Resume ... Worked at ABC Corp";

  const mockUserProfile = {
    contact: {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+63 912 345 6789",
      linkedin: "linkedin.com/in/janedoe",
    },
    skills: ["Python", "React", "SQL", "Project Management"],
    experience: [
      {
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
        degree: "BSc Computer Science",
        institution: "XYZ University",
        year: "2020",
      },
    ],

    resumeText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockUserId,
    id: "231",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLLMService = {
      extractUserProfile: jest.fn(),
      getProfile: jest.fn(),
    } as any;

    mockUserRepository = {
      createProfile: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findByUserId: jest.fn(),
    } as any;

    userService = new UserService(mockLLMService, mockUserRepository);
  });

  describe("Extract User Info From Resume", () => {
    it("should extract profile from resume text and save it", async () => {
      mockLLMService.extractUserProfile.mockResolvedValue(mockUserProfile);
      mockUserRepository.createProfile.mockResolvedValue({
        ...mockUserProfile,
        userId: mockUserId,
      });

      const result = await userService.createProfile(resumeText, mockUserId);

      expect(mockLLMService.extractUserProfile).toHaveBeenCalledWith(
        resumeText
      );
      expect(mockUserRepository.createProfile).toHaveBeenCalledWith(
        mockUserProfile
      );
      expect(result).toEqual(mockUserProfile);
    });
    it("should throw a DuplicateError if user profile already exists", async () => {
      mockUserRepository.findByUserId.mockResolvedValue({
        id: "profile-1",
        userId: mockUserId,
      } as any);

      await expect(
        userService.createProfile(resumeText, mockUserId)
      ).rejects.toBeInstanceOf(DuplicateError);

      expect(mockUserRepository.createProfile).not.toHaveBeenCalled();
      expect(mockLLMService.extractUserProfile).not.toHaveBeenCalled();
    });
    it("should throw an error if LLM extraction fails", async () => {
      const resumeText = "some text";

      mockLLMService.extractUserProfile.mockRejectedValue(
        new LLMExtractionError("Failed To Extract Infomation")
      );

      await expect(
        userService.createProfile(resumeText, mockUserId)
      ).rejects.toBeInstanceOf(LLMExtractionError);
    });

    it("should throw an error if saving fails", async () => {
      const resumeText = "Jane Doe Resume text";

      mockLLMService.extractUserProfile.mockResolvedValue(mockUserProfile);
      mockUserRepository.createProfile.mockRejectedValue(
        new DatabaseError(new Error("DB failed"), "Failed To fetch jobs")
      );

      await expect(
        userService.createProfile(resumeText, mockUserId)
      ).rejects.toBeInstanceOf(DatabaseError);
    });
    it("should throw DatabaseError if findByUserId fails", async () => {
      mockUserRepository.findByUserId.mockRejectedValue(
        new DatabaseError(
          new Error("DB find error"),
          "Failed to check duplicates"
        )
      );

      await expect(
        userService.createProfile(resumeText, mockUserId)
      ).rejects.toBeInstanceOf(DatabaseError);
    });
    it("should save profile even with partial fields from LLM", async () => {
      const partialProfile = {
        contact: { name: null, email: null, phone: null, linkedin: null },
        skills: ["JavaScript"],
        experience: [],
        education: [],
        resumeText: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
        id: "xyz",
      };

      mockLLMService.extractUserProfile.mockResolvedValue(partialProfile);
      mockUserRepository.createProfile.mockResolvedValue(partialProfile);

      const result = await userService.createProfile(
        "Partial resume",
        mockUserId
      );

      expect(result.skills).toEqual(["JavaScript"]);
    });
  });

  describe("Get User Profile", () => {
    it("it should return user profile", async () => {
      mockUserRepository.findByIdAndUserId.mockResolvedValue(mockUserProfile);

      const result = await userService.getProfile(
        mockUserProfile.id,
        mockUserId
      );

      expect(mockUserRepository.findByIdAndUserId).toHaveBeenCalledWith(
        mockUserProfile.id,
        mockUserId
      );

      expect(result).toEqual(mockUserProfile);
    });

    it("should return NotFoundError if profile is not found", async () => {
      mockUserRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        userService.getProfile("non-existent-id", "user-123")
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(mockUserRepository.findByIdAndUserId).toHaveBeenCalledWith(
        "non-existent-id",
        "user-123"
      );
    });

    it("should throw DatabaseError if findByIdAndUserId fails", async () => {
      mockUserRepository.findByIdAndUserId.mockRejectedValue(
        new DatabaseError(new Error("DB find error"), "Something Went wrong")
      );

      await expect(
        userService.getProfile(mockUserProfile.id, mockUserId)
      ).rejects.toBeInstanceOf(DatabaseError);
    });
    it("should throw NotFoundError if profile exists but belongs to another user", async () => {
      mockUserRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        userService.getProfile(mockUserProfile.id, "wrong-user-id")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
