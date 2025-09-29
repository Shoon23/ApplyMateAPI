// src/mappers/user.mapper.ts
import { date, when } from "joi";
import { Prisma, User } from "../../generated/prisma";
import {
  EducationDTO,
  ExperienceDTO,
  ExtractedUserProfileDTO,
  HybridArray,
  SkillDTO,
  UpdateUserProfileDTO,
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

      contact: data?.contact,
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
      skills: dto.skills ? { create: dto.skills } : undefined,
    };
    return input;
  }
  static toUpateProfileInput(
    dto: UpdateUserProfileDTO
  ): Prisma.UserProfileUpdateInput {
    const input: Prisma.UserProfileUpdateInput = {};
    if (dto.contact)
      input.contact = { upsert: { update: dto.contact, create: dto.contact } };
    if (dto.skills) input.skills = this.mapHybridArray<SkillDTO>(dto.skills);
    if (dto.experience)
      input.experience = this.mapHybridArray<ExperienceDTO>(dto.experience);
    if (dto.education)
      input.education = this.mapHybridArray<EducationDTO>(dto.education);

    return input;
  }
  private static mapHybridArray<T>(
    value: HybridArray<T>,
    uniqueField: keyof T = "id" as keyof T
  ) {
    return {
      ...(value.add?.length
        ? {
            createMany: {
              data: value.add,
            },
          }
        : {}),
      ...(value.remove?.length
        ? { deleteMany: { [uniqueField]: { in: value.remove } } }
        : {}),
      ...(value.update?.length
        ? {
            updateMany: value.update.map((val) => {
              const { [uniqueField]: id, ...rest } = val;
              return {
                where: { [uniqueField]: id },
                data: rest,
              };
            }),
          }
        : {}),
    };
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
}

export default UserMapper;
