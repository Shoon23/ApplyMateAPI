import AuthError from "../../src/errors/AuthError";
import UserRepository from "../../src/repository/UserRepository";
import AuthService from "../../src/services/AuthService";
import { comparePassword, hashPassword } from "../../src/utils/hashPassword";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../src/utils/generateJwt";
import DatabaseError from "../../src/errors/DatabaseError";
import { Prisma } from "../../generated/prisma";
// Mock bcrypt.compare and hash
jest.mock("../../src/utils/hashPassword", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashedPassword123"),
  comparePassword: jest.fn(),
}));

// Mock JWT token generators
jest.mock("../../src/utils/generateJwt", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
}));

const user = {
  id: "1a2b3c4d",
  email: "alice@example.com",
  name: "Alice Johnson",
  password: "hashedPassword123",
  createdAt: new Date(),
};

describe("Auth Service", () => {
  let mockRepo: jest.Mocked<UserRepository>;
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mocked instance of UserRepository
    mockRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    authService = new AuthService(mockRepo);
  });

  describe("Login User", () => {
    it("should throw if user is not found", async () => {
      mockRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: user.email, password: user.password })
      ).rejects.toBeInstanceOf(AuthError);
    });

    it("should throw if password does not match", async () => {
      mockRepo.findByEmail.mockResolvedValue(user);
      (
        comparePassword as jest.MockedFunction<typeof comparePassword>
      ).mockResolvedValue(false);

      await expect(
        authService.login({ email: user.email, password: "wrongPassword" })
      ).rejects.toThrow(AuthError);
    });

    it("should throw if JWT signing fails for access token", async () => {
      mockRepo.findByEmail.mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      (generateAccessToken as jest.Mock).mockImplementation(() => {
        throw new AuthError({
          message: "Failed to generate access token",
          property: "token",
        });
      });

      await expect(
        authService.login({ email: user.email, password: "correctPassword" })
      ).rejects.toBeInstanceOf(AuthError);
    });

    it("should throw if JWT signing fails for refresh token", async () => {
      mockRepo.findByEmail.mockResolvedValue(user);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      (generateRefreshToken as jest.Mock).mockImplementation(() => {
        throw new AuthError({
          message: "Failed to generate refresh token",
          property: "token",
        });
      });

      await expect(
        authService.login({ email: user.email, password: "correctPassword" })
      ).rejects.toBeInstanceOf(AuthError);
    });
    it("should throw a DatabaseError if the repository fails", async () => {
      // Create a generic Prisma error instance
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Something went wrong in the database",
        { code: "P9999", clientVersion: "unknown" }
      );

      mockRepo.findByEmail.mockRejectedValue(
        new DatabaseError(prismaError, "Something Went Wrong")
      );

      await expect(
        authService.login({ email: user.email, password: "correctPassword" })
      ).rejects.toBeInstanceOf(DatabaseError);
    });

    it("should login successfully with valid credentials", async () => {
      const loggedInUser = {
        ...user,
        email: "test@example.com",
        name: "John Doe",
      };
      mockRepo.findByEmail.mockResolvedValue(loggedInUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);

      (generateAccessToken as jest.Mock).mockReturnValueOnce(
        "fake-access-token"
      );
      (generateRefreshToken as jest.Mock).mockReturnValueOnce(
        "fake-refresh-token"
      );

      const result = await authService.login({
        email: user.email,
        password: user.password,
      });
      const { password: _, ...userWithoutPassword } = loggedInUser;
      expect(result.user).toStrictEqual(userWithoutPassword);
      expect(result.accessToken).toBe("fake-access-token");
      expect(result.refreshToken).toBe("fake-refresh-token");
    });
  });
  describe("Register User", () => {
    it("should hash password before saving user", async () => {
      (hashPassword as jest.Mock).mockResolvedValue("secureHash");
      (generateAccessToken as jest.Mock).mockReturnValue("fake-jwt");
      (generateRefreshToken as jest.Mock).mockReturnValue("fake-jwt");

      mockRepo.create.mockResolvedValue({
        createdAt: new Date(),
        email: user.email,
        name: user.name,
        id: user.id,
        password: "password",
      });

      const result = await authService.register({
        email: user.email,
        name: user.name,
        password: "plain",
      });

      expect(hashPassword).toHaveBeenCalledWith("plain");

      expect(mockRepo.create).toHaveBeenCalledWith({
        email: user.email,
        name: user.name,
        password: "secureHash",
      });

      expect(result).not.toHaveProperty("password");
    });

    it("should throw AuthError if email is already taken", async () => {
      mockRepo.findByEmail.mockResolvedValue(user);

      await expect(
        authService.register({
          email: user.email,
          name: user.name,
          password: "plain",
        })
      ).rejects.toBeInstanceOf(AuthError);
    });

    it("should throw AuthError if hashing fails", async () => {
      (hashPassword as jest.Mock).mockRejectedValue(
        new AuthError({
          message: "Failed to hash password",
          property: "password",
        })
      );

      await expect(
        authService.register({
          email: user.email,
          name: user.name,
          password: "plain",
        })
      ).rejects.toBeInstanceOf(AuthError);
    });

    it("should throw AuthError if repository create fails", async () => {
      (hashPassword as jest.Mock).mockResolvedValue("secureHash");
      mockRepo.create.mockRejectedValue(
        new DatabaseError(
          {
            message: "Something Went Wrong",
            name: "DATABASE_ERROR",
          },
          "Something Went Wrong"
        )
      );

      await expect(
        authService.register({
          email: user.email,
          name: user.name,
          password: "plain",
        })
      ).rejects.toBeInstanceOf(DatabaseError);
    });
    it("should register a new user successfully", async () => {
      (hashPassword as jest.Mock).mockResolvedValue("secureHash");
      (generateAccessToken as jest.Mock).mockReturnValue("fake-access-token");
      (generateRefreshToken as jest.Mock).mockReturnValue("fake-refresh-token");

      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        password: "secureHash",
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: user.email,
        name: user.name,
        password: "plain",
      });

      expect(hashPassword).toHaveBeenCalledWith("plain");
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: user.email,
        name: user.name,
        password: "secureHash",
      });

      // should return tokens
      expect(generateAccessToken).toHaveBeenCalledWith(user.id);
      expect(generateRefreshToken).toHaveBeenCalledWith(user.id);

      expect(result).toMatchObject({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: "fake-access-token",
        refreshToken: "fake-refresh-token",
      });

      // should not expose password
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("Refresh User Tokens", () => {
    it("should throw AuthError if no user is found", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ userId: user.id });
      mockRepo.findById = jest.fn().mockResolvedValue(null);

      await expect(
        authService.refresh("valid-refresh-token")
      ).rejects.toBeInstanceOf(AuthError);
    });

    it("should throw AuthError if refresh token is invalid", async () => {
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new AuthError({
          message: "Invalid or expired token",
          property: "token",
        });
      });

      await expect(authService.refresh("bad-token")).rejects.toBeInstanceOf(
        AuthError
      );
    });

    it("should generate new tokens if refresh token is valid", async () => {
      (verifyToken as jest.Mock).mockReturnValue({ userId: user.id });
      mockRepo.findById = jest.fn().mockResolvedValue(user);

      (generateAccessToken as jest.Mock).mockReturnValue("new-access-token");
      (generateRefreshToken as jest.Mock).mockReturnValue("new-refresh-token");

      const result = await authService.refresh("valid-refresh-token");

      expect(verifyToken).toHaveBeenCalledWith("valid-refresh-token", true);
      expect(mockRepo.findById).toHaveBeenCalledWith(user.id);

      expect(result).toStrictEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });
  });
});
