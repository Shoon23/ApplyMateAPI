export type UserDTO = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};
export interface ExtractedUserProfileDTO {
  contact?: ContactDTO;
  skills?: SkillDTO[];
  experience?: ExperienceDTO[];
  education?: EducationDTO[];
}
export interface ContactDTO {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface SkillDTO {
  name: string;
}

export interface ExperienceDTO {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

export interface EducationDTO {
  degree?: string;
  institution?: string;
  year?: string;
}

export type HybridArray<T> = T[] | { add?: T[]; remove?: string[] };
export interface UpdateUserProfileDTO {
  contact?: ContactDTO;
  skills?: HybridArray<SkillDTO>;
  experience?: HybridArray<ExperienceDTO>;

  education?: HybridArray<EducationDTO>;
}

export interface UserProfileDTO extends ExtractedUserProfileDTO {
  id: string;
  userId: string;
  resumeText: string | null;
  createdAt: Date;
  updatedAt: Date;
}
