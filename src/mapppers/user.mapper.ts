// src/mappers/user.mapper.ts
import { User } from "../../generated/prisma";
import {
  ExtractedUserProfileDTO,
  UserDTO,
  UserProfileDTO,
} from "../dto/user.dto";

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

export function toUserProfileDTO(data: any): UserProfileDTO {
  return {
    resumeText: data?.resumetext ?? null,
    id: data?.id ?? null,
    userId: data?.userId ?? null,
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,

    contact: {
      name: data?.contact?.name ?? null,
      email: data?.contact?.email ?? null,
      phone: data?.contact?.phone ?? null,
      linkedin: data?.contact?.linkedin ?? null,
    },
    skills: Array.isArray(data?.skills) ? data.skills : null,
    experience: Array.isArray(data?.experience)
      ? data.experience.map((exp: any) => ({
          company: exp?.company ?? null,
          role: exp?.role ?? null,
          startDate: exp?.startDate ?? null,
          endDate: exp?.endDate ?? null,
          achievements: Array.isArray(exp?.achievements)
            ? exp.achievements
            : null,
        }))
      : null,
    education: Array.isArray(data?.education)
      ? data.education.map((edu: any) => ({
          degree: edu?.degree ?? null,
          institution: edu?.institution ?? null,
          year: edu?.year ?? null,
        }))
      : null,
  };
}
export function toExtractedUserProfileDTO(data: any): ExtractedUserProfileDTO {
  return {
    contact: {
      name: data?.contact?.name ?? null,
      email: data?.contact?.email ?? null,
      phone: data?.contact?.phone ?? null,
      linkedin: data?.contact?.linkedin ?? null,
    },
    skills: Array.isArray(data?.skills) ? data.skills : null,
    experience: Array.isArray(data?.experience)
      ? data.experience.map((exp: any) => ({
          company: exp?.company ?? null,
          role: exp?.role ?? null,
          startDate: exp?.startDate ?? null,
          endDate: exp?.endDate ?? null,
          achievements: Array.isArray(exp?.achievements)
            ? exp.achievements
            : null,
        }))
      : null,
    education: Array.isArray(data?.education)
      ? data.education.map((edu: any) => ({
          degree: edu?.degree ?? null,
          institution: edu?.institution ?? null,
          year: edu?.year ?? null,
        }))
      : null,
  };
}
