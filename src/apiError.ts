export default class ApiError extends Error {
  /** The name of this error. This will always be "ApiError" */
  public name: string;

  /** The HTTP status code to return. */
  public statusCode: number;

  /** The public-facing message to stringify. */
  public message: string;

  constructor(statusCode: number, message: string) {
    super();
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.message = message;
  }
}
