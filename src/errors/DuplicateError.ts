// src/errors/DuplicateError.ts
import CustomError from "./CustomError";
interface FieldError {
  message: string;
  property?: string;
}
class DuplicateError extends CustomError {
  statusCode = 409;
  errorType = "DUPLICATE_ERROR";

  constructor(public errors: FieldError) {
    super("Duplicate resource found");
    Object.setPrototypeOf(this, DuplicateError.prototype);
  }

  serializeErrors() {
    return [this.errors];
  }
}

export default DuplicateError;
