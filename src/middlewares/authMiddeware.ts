import { Request, Response, NextFunction } from "express";
import AuthError from "../errors/AuthError";
import { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/generateJwt";

export interface AuthRequest extends Request {
  user?: JwtPayload; // attach user payload
}

export const authMiddeware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError({
      message: "No token provided",
      property: "token",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token, false);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AuthError({
      message: "Authentication Failed",
      property: "token",
    });
  }
};
