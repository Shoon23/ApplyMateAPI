// src/errors/LLMExtractionError.ts
import CustomError from "./CustomError";

class LLMExtractionError extends CustomError {
  statusCode = 422; // Unprocessable Entity (fits for parsing/validation issues)
  errorType = "LLM_EXTRACTION_ERROR";

  constructor(message: string, private property?: string) {
    super(message);

    Object.setPrototypeOf(this, LLMExtractionError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message, property: this.property }];
  }
}

export default LLMExtractionError;
