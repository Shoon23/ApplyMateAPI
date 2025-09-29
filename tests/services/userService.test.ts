import UserService from "../../src/services/UserService";
import LLMService from "../../src/services/LLMService";
import UserProfileRepostory from "../../src/repository/UserProfileRepository";
import DatabaseError from "../../src/errors/DatabaseError";
import LLMExtractionError from "../../src/errors/LLMExtractionError";
import DuplicateError from "../../src/errors/DuplicateError";
import NotFoundError from "../../src/errors/NotFoundError";
import ForbiddenError from "../../src/errors/ForbiddenError";

import {
  ExtractedUserProfileDTO,
  UpdateUserProfileDTO,
  UserProfileDTO,
} from "../../src/dto/user.dto";

describe("UserService", () => {
  let userService: UserService;
  let mockLLMService: jest.Mocked<LLMService>;
  let mockUserRepository: jest.Mocked<UserProfileRepostory>;
  const mockUserId = "some-id-123";
  const resumeText = "Jane Doe Resume ... Worked at ABC Corp";
  const mockCreatedUserProfile = {
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
    userId: mockUserId,
    resumeText: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    id: "231",
  };
  beforeEach(() => {
    jest.clearAllMocks();

    mockLLMService = {
      extractUserProfile: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    } as any;

    mockUserRepository = {
      createProfile: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    userService = new UserService(mockLLMService, mockUserRepository);
  });

  describe("Extract User Info From Resume", () => {
    const mockExtractedUserProfile = {
      contact: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+63 912 345 6789",
        linkedin: "linkedin.com/in/janedoe",
      },
      skills: [
        {
          name: "Python",
        },
        {
          name: "React",
        },
        {
          name: "SQL",
        },
      ],
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
    };

    it("should extract profile from resume text and save it", async () => {
      mockLLMService.extractUserProfile.mockResolvedValue(
        mockExtractedUserProfile
      );
      mockUserRepository.createProfile.mockResolvedValue(
        mockCreatedUserProfile
      );

      const result = await userService.createProfile(resumeText, mockUserId);

      expect(mockLLMService.extractUserProfile).toHaveBeenCalledWith(
        resumeText
      );
      expect(mockUserRepository.createProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { connect: { id: mockUserId } },
          contact: { create: mockExtractedUserProfile.contact },
          skills: { create: mockExtractedUserProfile.skills },
          experience: { create: mockExtractedUserProfile.experience },
          education: { create: mockExtractedUserProfile.education },
        })
      );
      expect(result).toEqual(expect.objectContaining({ userId: mockUserId }));
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

      mockLLMService.extractUserProfile.mockResolvedValue(
        mockExtractedUserProfile
      );
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
      const partialExtractedProfile: ExtractedUserProfileDTO = {
        contact: {
          name: undefined,
          email: undefined,
          phone: undefined,
          linkedin: undefined,
        },
        skills: [{ name: "JavaScript" }],
        experience: [],
        education: [],
      };
      const partialProfile = {
        contact: {
          id: "some-id",
          profileId: "mock-id",
          name: "John Doe",
          email: null,
          linkedin: null,
          phone: null,
        },
        skills: [{ name: "JavaScript", id: "some-id", profileId: "mock-id" }],
        experience: [],
        education: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
        id: "xyz",
        resumeText: null,
      };

      mockLLMService.extractUserProfile.mockResolvedValue(
        partialExtractedProfile
      );
      mockUserRepository.createProfile.mockResolvedValue(partialProfile);

      const result = await userService.createProfile(
        "Partial resume",
        mockUserId
      );

      expect(result.skills).toEqual([
        { name: "JavaScript", id: "some-id", profileId: "mock-id" },
      ]);
    });
  });

  describe("Get User Profile", () => {
    it("it should return user profile", async () => {
      mockUserRepository.findByUserId.mockResolvedValue(mockCreatedUserProfile);

      const result = await userService.getProfile(mockUserId);

      expect(mockUserRepository.findByUserId).toHaveBeenCalledWith(mockUserId);

      expect(result).toEqual(mockCreatedUserProfile);
    });

    it("should return NotFoundError if profile is not found", async () => {
      mockUserRepository.findByUserId.mockResolvedValue(null);

      await expect(userService.getProfile("user-123")).rejects.toBeInstanceOf(
        NotFoundError
      );

      expect(mockUserRepository.findByUserId).toHaveBeenCalledWith("user-123");
    });

    it("should throw DatabaseError if findByIdAndUserId fails", async () => {
      mockUserRepository.findByUserId.mockRejectedValue(
        new DatabaseError(new Error("DB find error"), "Something Went wrong")
      );

      await expect(userService.getProfile(mockUserId)).rejects.toBeInstanceOf(
        DatabaseError
      );
    });
  });

  describe("Update User Profile", () => {
    it("should update contact successfully", async () => {
      const updateData: UpdateUserProfileDTO = {
        contact: { name: "New Name" },
      };

      const updatedProfile = {
        ...mockCreatedUserProfile,
        contact: { ...mockCreatedUserProfile.contact, name: "New Name" },
      };

      mockUserRepository.findByUserId.mockResolvedValue(mockCreatedUserProfile);
      mockUserRepository.update.mockResolvedValue(updatedProfile);

      const result = await userService.updateProfile(mockUserId, updateData);

      expect(mockUserRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockCreatedUserProfile.id,
        expect.objectContaining({
          contact: {
            upsert: {
              create: { name: "New Name" },
              update: { name: "New Name" },
            },
          },
        })
      );
      expect(result.contact?.name).toEqual("New Name");
    });

    it("should update skills successfully", async () => {
      const updateData = {
        skills: { add: [{ name: "TypeScript" }, { name: "Node.js" }] },
      };

      const updatedProfile = {
        ...mockCreatedUserProfile,
        skills: [
          ...mockCreatedUserProfile.skills,
          { name: "TypeScript", id: "some-id", profileId: "mock-id" },
          { name: "Node.js", id: "some-id", profileId: "mock-id" },
        ],
      };

      mockUserRepository.findByUserId.mockResolvedValue(mockCreatedUserProfile);
      mockUserRepository.update.mockResolvedValue(updatedProfile);

      const result = await userService.updateProfile(mockUserId, updateData);

      expect(mockUserRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockCreatedUserProfile.id,
        expect.objectContaining({
          skills: { create: updateData.skills.add },
        })
      );
      expect(result.skills).toEqual(updatedProfile.skills);
    });

    it("should update experience successfully", async () => {
      const updateData = {
        experience: {
          add: [
            {
              company: "OpenAI",
              role: "Engineer",
              startDate: "2022-01",
              endDate: "2023-01",
              achievements: ["Built stuff"],
            },
          ],
        },
      };
      const updatedProfile = {
        ...mockCreatedUserProfile,
        experience: [
          {
            id: "some-id",
            profileId: "mock-id",
            company: "OpenAI",
            role: "Engineer",
            startDate: "2022-01-01",
            endDate: "2023-01-01",
            achievements: ["Built stuff"],
          },
        ],
      };

      mockUserRepository.findByUserId.mockResolvedValue(mockCreatedUserProfile);
      mockUserRepository.update.mockResolvedValue(updatedProfile);

      const result = await userService.updateProfile(mockUserId, updateData);

      expect(mockUserRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockCreatedUserProfile.id,
        expect.objectContaining({
          experience: { create: updateData.experience.add },
        })
      );
      expect(result.experience).toEqual(updatedProfile.experience);
    });

    it("should update education successfully", async () => {
      const updateData = {
        education: {
          add: [
            {
              degree: "BS Computer Science",
              institution: "XYZ University",
              year: "2020",
            },
          ],
        },
      };

      const updatedProfile = {
        ...mockCreatedUserProfile,
        education: [
          ...mockCreatedUserProfile.education,
          {
            degree: "BS Computer Science",
            institution: "XYZ University",
            year: "2020",
            id: "some-id",
            profileId: "mock-id",
          },
        ],
      };

      mockUserRepository.findByUserId.mockResolvedValue(mockCreatedUserProfile);
      mockUserRepository.update.mockResolvedValue(updatedProfile);

      const result = await userService.updateProfile(mockUserId, updateData);

      expect(mockUserRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockCreatedUserProfile.id,
        expect.objectContaining({
          education: { create: updateData.education.add },
        })
      );
      expect(result.education).toEqual(updatedProfile.education);
    });

    it("should throw NotFoundError if profile does not exist", async () => {
      mockUserRepository.findByUserId.mockResolvedValue(null);

      await expect(
        userService.updateProfile(mockUserId, { contact: { name: "New" } })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
