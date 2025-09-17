import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import AuthError from "../errors/AuthError";

const generateAccessToken = (userId: string): string => {
  try {
    return jwt.sign({ userId }, config.ACCESS_TOKEN_SECRET as string, {
      expiresIn: "1h",
    });
  } catch (error) {
    throw new AuthError({
      message: "Failed to generate access token",
      property: "token",
    });
  }
};

const generateRefreshToken = (userId: string): string => {
  try {
    return jwt.sign({ userId }, config.REFRESH_TOKEN_SECRET as string, {
      expiresIn: "7d",
    });
  } catch (error) {
    throw new AuthError({
      message: "Failed to generate refresh token",
      property: "token",
    });
  }
};
const verifyToken = (
  token: string,
  isRefresh = false
): JwtPayload & { userId: string } => {
  try {
    const secret = isRefresh
      ? (config.REFRESH_TOKEN_SECRET as string)
      : (config.ACCESS_TOKEN_SECRET as string);

    const decoded = jwt.verify(token, secret);

    return decoded as JwtPayload & { userId: string };
  } catch (error) {
    throw new AuthError({
      message: "Your session has expired. Please log in again.",
      property: "token",
    });
  }
};
export { generateAccessToken, generateRefreshToken, verifyToken };
