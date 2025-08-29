import CustomError from "./CustomError";
interface FieldError {
  message: string;
  property?: string;
}
class ValidationError extends CustomError {
  statusCode = 400;
  errorType = "VALIDATION_ERROR";
  constructor(public errors: FieldError[]) {
    super("Validation Failed");
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
  serializeErrors() {
    return this.errors;
  }
}

export default ValidationError;
