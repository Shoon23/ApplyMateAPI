import bcrypt from "bcryptjs";
import AuthError from "../errors/AuthError";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new AuthError({
      message: "Failed to hash password",
      property: "password",
    });
  }
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new AuthError({
      message: "Pasword Do not Match",
      property: "password",
    });
  }
};
