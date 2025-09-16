import bcrypt from "bcryptjs";
import { hashPassword, comparePassword } from "../../src/utils/hashPassword";
import AuthError from "../../src/errors/AuthError";

jest.mock("bcryptjs");

describe("Password utilities", () => {
  const plainPassword = "mySecret123";
  const hashedPassword = "hashedPasswordMock";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("saltMock");
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(plainPassword);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, "saltMock");
      expect(result).toBe(hashedPassword);
    });

    it("should throw AuthError if bcrypt fails", async () => {
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error("salt error"));

      await expect(hashPassword(plainPassword)).rejects.toThrow(AuthError);
    });
  });

  describe("comparePassword", () => {
    it("should return true if passwords match", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword
      );
      expect(result).toBe(true);
    });

    it("should return false if passwords do not match", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(false);
    });

    it("should throw AuthError if bcrypt.compare fails", async () => {
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error("compare error")
      );

      await expect(
        comparePassword(plainPassword, hashedPassword)
      ).rejects.toThrow(AuthError);
    });
  });
});
