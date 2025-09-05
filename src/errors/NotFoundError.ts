import CustomError from "./CustomError";
interface FieldError {
  message: string;
  property?: string;
}
class NotFoundError extends CustomError {
  errorType = "NOT_FOUND";
  statusCode = 404;
  constructor(public errors: FieldError) {
    super("Data Not Found");
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
  serializeErrors() {
    return [this.errors];
  }
}

export default NotFoundError;
