import { APIGatewayProxyResult } from "aws-lambda";
import ApiError from "./apiError.js";

/**
 * Takes an exception and generates a public-facing result for a lambda handler to return. This
 * function will choose a status-code and message depending on the exception.
 *
 * Meant to be used in every lambda handler. Lambda handlers should catch any exceptions, pass them
 * into this function, and then return this function's results.
 *
 * @param exception The exception caught by a lambda handler.
 * @returns A lambda result based on the given exception.
 */
export default function handleApiException(exception: any): APIGatewayProxyResult {
  /** The status code to return. Will be determined based on the if statements below. */
  let statusCode: number;

  /**
   * The public, user-facing message to return inside of JSON. Will be determined based on the if
   * statements below.
   */
  let message: string;

  if (exception instanceof ApiError) {
    // If we know how to handle this exception, then assign an appropriate status code and message!
    statusCode = exception.statusCode;
    message = exception.message;
  } else {
    // Otherwise, we DON'T know how to handle this exception. This is some uncaught internal error.
    console.error("Uncaught Internal Error", exception);
    statusCode = 500;
    message = "Internal Error";
  }

  // Package the parsed data in terms that lambda will understand, and return it!
  const response: APIGatewayProxyResult = {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };

  return response;
}
