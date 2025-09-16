// src/mappers/user.mapper.ts
import { User } from "../../generated/prisma";
import { UserDTO } from "../dto/user.dto";

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});
