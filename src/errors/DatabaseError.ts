import CustomError from "./CustomError";

class DatabaseError extends CustomError {
  statusCode = 500;
  errorType = "DATABASE_ERROR";
  originalError: Error;

  constructor(error: Error) {
    super(error.message);
    this.originalError = error;

    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  serializeErrors(): { message: string; property?: string }[] {
    return [
      {
        message:
          "Something went wrong with our database. Please try again later.",
      },
    ];
  }
  getDebugInfo() {
    return {
      errorType: this.errorType,
      originalMessage: this.originalError.message,
      stack: this.originalError.stack,
    };
  }
}

export default DatabaseError;
