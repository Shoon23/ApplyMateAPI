import { UserDTO } from "./user.dto";

export type LoginDTO = {
  email: string;
  password: string;
};

export type RegisterDTO = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponseDTO = {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
};
