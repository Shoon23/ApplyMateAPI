import AuthError from "../errors/AuthError";
import UserRepository from "../repository/UserRepository";
import { LoginDTO, RegisterDTO } from "../dto/auth.dto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/generateJwt";
import { comparePassword, hashPassword } from "../utils/hashPassword";
import logger from "../utils/logger";
import UserMapper from "../mapppers/user.mapper";

class AuthService {
  constructor(private userRepo: UserRepository) {}

  async login(userCredentials: LoginDTO) {
    logger.info(`Login Attempt for email: ${userCredentials.email}`);

    const user = await this.userRepo.findByEmail(userCredentials.email);

    if (!user) {
      logger.warn(`Login Failed: User Not Found ${userCredentials.email}`);
      throw new AuthError({
        message: "User is not yet Registered",
        property: "email",
      });
    }

    const isPassword = await comparePassword(
      userCredentials.password,
      user.password
    );

    if (!isPassword) {
      logger.warn(
        `Login Failed: Password Do not Match ${userCredentials.email}`
      );

      throw new AuthError({
        message: "Wrong Password",
        property: "password",
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    logger.info(`Login successful for email: ${userCredentials.email}`);

    return {
      user: UserMapper.toUserDTO(user),
      accessToken,
      refreshToken,
    };
  }

  async register(userCredentials: RegisterDTO) {
    const user = await this.userRepo.findByEmail(userCredentials.email);

    if (user) {
      logger.warn(`Register Failed: User Found ${userCredentials.email}`);
      throw new AuthError({
        message: "User is already Registered",
        property: "email",
      });
    }

    const hashedPassword = await hashPassword(userCredentials.password);

    const createdUser = await this.userRepo.create({
      ...userCredentials,
      password: hashedPassword,
    });
    const accessToken = generateAccessToken(createdUser.id);
    const refreshToken = generateRefreshToken(createdUser.id);
    return {
      user: UserMapper.toUserDTO(createdUser),
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    const decoded = verifyToken(token, true);

    const user = await this.userRepo.findById(decoded.userId);

    if (!user) {
      logger.warn(`Refresh failed: user not found (userId=${decoded.userId})`);

      throw new AuthError({
        property: "",
        message: "User Not Found",
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: UserMapper.toUserDTO(user),
      accessToken,
      refreshToken,
    };
  }
}

export default AuthService;
