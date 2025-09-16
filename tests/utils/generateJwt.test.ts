import jwt from "jsonwebtoken";
import config from "../../src/config";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../src/utils/generateJwt";
import AuthError from "../../src/errors/AuthError";

jest.mock("jsonwebtoken");

describe("Auth token utilities", () => {
  const userId = "user123";
  const mockAccessToken = "mockAccessToken";
  const mockRefreshToken = "mockRefreshToken";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("should generate an access token", () => {
      (jwt.sign as jest.Mock).mockReturnValue(mockAccessToken);

      const token = generateAccessToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        config.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      expect(token).toBe(mockAccessToken);
    });

    it("should throw AuthError if jwt.sign fails", () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error("sign error");
      });

      expect(() => generateAccessToken(userId)).toThrow(AuthError);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a refresh token", () => {
      (jwt.sign as jest.Mock).mockReturnValue(mockRefreshToken);

      const token = generateRefreshToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        config.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      expect(token).toBe(mockRefreshToken);
    });

    it("should throw AuthError if jwt.sign fails", () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error("sign error");
      });

      expect(() => generateRefreshToken(userId)).toThrow(AuthError);
    });
  });

  describe("verifyToken", () => {
    it("should verify an access token by default", () => {
      const decodedPayload = { userId };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      const payload = verifyToken(mockAccessToken);

      expect(jwt.verify).toHaveBeenCalledWith(
        mockAccessToken,
        config.ACCESS_TOKEN_SECRET
      );
      expect(payload).toEqual(decodedPayload);
    });

    it("should verify a refresh token when isRefresh is true", () => {
      const decodedPayload = { userId };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      const payload = verifyToken(mockRefreshToken, true);

      expect(jwt.verify).toHaveBeenCalledWith(
        mockRefreshToken,
        config.REFRESH_TOKEN_SECRET
      );
      expect(payload).toEqual(decodedPayload);
    });

    it("should throw AuthError if jwt.verify fails", () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("verify error");
      });

      expect(() => verifyToken(mockAccessToken)).toThrow(AuthError);
    });
  });
});
