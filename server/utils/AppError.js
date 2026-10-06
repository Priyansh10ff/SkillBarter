// An error with an HTTP status code. Throw it anywhere in a request and
// the central error handler turns it into a JSON response.
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = AppError;
