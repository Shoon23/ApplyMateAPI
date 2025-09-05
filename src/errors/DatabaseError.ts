import CustomError from "./CustomError";

class DatabaseError extends CustomError {
  statusCode = 500;
  errorType = "DATABASE_ERROR";
  originalError: Error;

  constructor(error: Error, public message: string) {
    super(error.message);
    this.originalError = error;

    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  serializeErrors(): { message: string; property?: string }[] {
    return [
      {
        message: this.message,
      },
    ];
  }
  // getDebugInfo() {
  //   return {
  //     errorType: this.errorType,
  //     originalMessage: this.originalError.message,
  //     stack: this.originalError.stack,
  //   };
  // }
}

export default DatabaseError;
