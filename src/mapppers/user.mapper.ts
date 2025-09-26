// src/mappers/user.mapper.ts
import { Prisma, User } from "../../generated/prisma";
import {
  EducationDTO,
  ExperienceDTO,
  ExtractedUserProfileDTO,
  HybridArray,
  SkillDTO,
  UserDTO,
  UserProfileDTO,
} from "../dto/user.dto";

class UserMapper {
  static toUserDTO = (user: User): UserDTO => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  });

  static toUserProfileDTO(data: any): UserProfileDTO {
    return {
      resumeText: data?.resumetext ?? null,
      id: data?.id ?? null,
      userId: data?.userId ?? null,
      createdAt: data?.createdAt ?? null,
      updatedAt: data?.updatedAt ?? null,

      contact: this.mapContact(data?.contact),
      skills: data.skills,
      experience: data.experience,
      education: data.education,
    };
  }
  static toExtractedUserProfileDTO(data: any): ExtractedUserProfileDTO {
    return {
      contact: this.mapContact(data?.contact),
      skills: data.skills,
      experience: data.experience,
      education: data.education,
    };
  }
  static toCreateProfileInput(
    userId: string,
    dto: ExtractedUserProfileDTO
  ): Prisma.UserProfileCreateInput {
    const input: Prisma.UserProfileCreateInput = {
      user: { connect: { id: userId } },

      contact: dto.contact ? { create: dto.contact } : undefined,
      experience: dto.experience
        ? {
            create: dto.experience,
          }
        : undefined,
      education: dto.education
        ? {
            create: dto.education,
          }
        : undefined,
    };
    return input;
  }

  private static mapHybridArray<T>(
    value: HybridArray<T>,
    uniqueField: keyof T = "id" as keyof T
  ) {
    if (Array.isArray(value)) {
      return { deleteMany: {}, create: value };
    } else {
      return {
        ...(value.add?.length ? { create: value.add } : {}),
        ...(value.remove?.length
          ? { deleteMany: { [uniqueField]: { in: value.remove } } }
          : {}),
      };
    }
  }
  private static mapContact(contact: any) {
    if (!contact) return undefined;

    return {
      name: contact?.name ?? null,
      email: contact?.email ?? null,
      phone: contact?.phone ?? null,
      linkedin: contact?.linkedin ?? null,
    };
  }
  private static mapSkills(skills: any) {
    if (!skills || skills.length === 0) return undefined;
    return Array.isArray(skills) ? skills : null;
  }

  private static mapExperience(exp: any) {
    if (!exp || exp.length === 0) return undefined;

    return Array.isArray(exp)
      ? exp.map((exp: any) => ({
          company: exp?.company ?? null,
          role: exp?.role ?? null,
          startDate: exp?.startDate ?? null,
          endDate: exp?.endDate ?? null,
          achievements: Array.isArray(exp?.achievements)
            ? exp.achievements
            : null,
        }))
      : null;
  }

  private static mapEducation(education: any) {
    if (!education || education.length === 0) return undefined;

    return Array.isArray(education)
      ? education.map((edu: any) => ({
          degree: edu?.degree ?? null,
          institution: edu?.institution ?? null,
          year: edu?.year ?? null,
        }))
      : null;
  }
}

export default UserMapper;
