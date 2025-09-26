// src/errors/ForbiddenError.ts
import CustomError from "./CustomError";
interface FieldError {
  message: string;
  property?: string;
}
class ForbiddenError extends CustomError {
  statusCode = 403; // Forbidden
  errorType = "FORBIDDEN_ERROR";

  constructor(public errors: FieldError) {
    super("Forbidden");

    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  serializeErrors() {
    return [this.errors];
  }
}

export default ForbiddenError;
