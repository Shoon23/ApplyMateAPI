import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import AuthError from "../errors/AuthError";

const generateAccessToken = (userId: string): string => {
  try {
    return jwt.sign(
      { userId },
      config.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "1h" } // short-lived
    );
  } catch (error) {
    throw new AuthError({
      message: "Failed to generate access token",
      property: "token",
    });
  }
};

const generateRefreshToken = (userId: string): string => {
  try {
    return jwt.sign(
      { userId },
      config.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" } // longer-lived
    );
  } catch (error) {
    throw new AuthError({
      message: "Failed to generate refresh token",
      property: "token",
    });
  }
};
const verifyToken = (token: string, isRefresh = false): JwtPayload => {
  try {
    const secret = isRefresh
      ? (config.REFRESH_TOKEN_SECRET as string)
      : (config.ACCESS_TOKEN_SECRET as string);

    const decoded = jwt.verify(token, secret);

    return decoded as JwtPayload; // contains { userId, iat, exp }
  } catch (error) {
    throw new AuthError({
      message: "Invalid or expired token",
      property: "token",
    });
  }
};
export { generateAccessToken, generateRefreshToken, verifyToken };
