import CustomError from "./CustomError";
interface FieldError {
  message: string;
  property?: string;
}
class AuthError extends CustomError {
  statusCode = 401;
  errorType = "AUTH_ERROR";
  constructor(public errors: FieldError) {
    super("Authentication Failed");
    Object.setPrototypeOf(this, AuthError.prototype);
  }

  serializeErrors() {
    return [this.errors];
  }
}

export default AuthError;
