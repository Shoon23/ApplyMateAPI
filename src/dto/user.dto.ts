export type UserDTO = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};
export interface ExtractedUserProfileDTO {
  contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
  };
  skills: string[] | null;
  experience:
    | {
        company: string | null;
        role: string | null;
        startDate: string | null;
        endDate: string | null;
        achievements: string[] | null;
      }[]
    | null;
  education:
    | {
        degree: string | null;
        institution: string | null;
        year: string | null;
      }[]
    | null;
}

export interface UserProfileDTO extends ExtractedUserProfileDTO {
  createdAt: Date;
  updatedAt: Date;
  id: string;
  userId: string;
  resumeText: string | null;
}
