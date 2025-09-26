import { GoogleGenAI } from "@google/genai";
import LLMExtractionError from "../errors/LLMExtractionError";
import UserMapper from "../mapppers/user.mapper";
import logger from "../utils/logger";
class LLMService {
  private genAI: GoogleGenAI;
  private model = "gemini-2.5-flash";
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Google Gemini API key is requred");
    }

    this.genAI = new GoogleGenAI({
      apiKey,
    });
  }

  async extractUserProfile(text: string) {
    logger.info("Extracting user profile");
    const systemInstruction = `You are a highly accurate information extraction system.
Your task is to read the provided text and return only a valid JSON object representing the user profile. Do not include explanations, markdown, or any text outside of the JSON.

Rules:

Follow the exact JSON schema below.

If a field is missing, return it as null.

If there is no useful information, return:

{
  "error": null
}


Dates must follow YYYY-MM format. If only the year is available, use YYYY.

Emails and URLs must be normalized (lowercase, no spaces). If invalid, return null.

Multiple roles at the same company should be listed as separate objects in the experience array.

Preserve all useful information but keep it concise.

JSON string Schema:
{
  "contact": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+63 912 345 6789",
    "linkedin": "linkedin.com/in/janedoe"
  },
  "skills": ["Python", "React", "SQL", "Project Management"],
  "experience": [
    {
      "company": "ABC Corp",
      "role": "Software Engineer",
      "startDate": "2021-01",
      "endDate": "2023-06",
      "achievements": [
        "Developed REST APIs with Express.js",
        "Improved query performance by 30%"
      ]
    }
  ],
  "education": [
    {
      "degree": "BSc Computer Science",
      "institution": "XYZ University",
      "year": "2020"
    }
  ]
}`;

    let raw: any;

    try {
      const response = await this.genAI.models.generateContent({
        model: this.model,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          systemInstruction: [{ text: systemInstruction }],
        },
        contents: text,
      });

      const responseText = response.text as string;
      const cleanedText = responseText.replace(/^```json\s*|\s*```$/g, "");
      raw = JSON.parse(cleanedText);
    } catch (err) {
      logger.error("LLM extraction failed", { error: err });

      throw new LLMExtractionError("User profile extraction failed", "file");
    }

    if (raw.error === null) {
      logger.warn("LLM returned no useful information");
      throw new LLMExtractionError(
        "User profile extraction failed. No useful information was found.",
        "file"
      );
    }
    logger.info("LLM extraction successful");
    return UserMapper.toExtractedUserProfileDTO(raw);
  }
}

export default LLMService;
