import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { z } from "zod";
import handleApiException from "../../../handleApiException.js";
import { parseMultipart } from "../../../multipart/parseMultipart.js";
import validateMultipartSchema from "../../../validation/validateMultipartSchema.js";

//
//  Interfaces
//

/** The schema for the parameters that are passed into the handler via multipart data in the body */
const SchemaHandlerMultipartInput = z.object({
  Test: z.string(),
  tester: z.instanceof(Buffer),
});

/** How the JSON that the handler returns should be formatted. */
interface IHandlerOutput {
  /** The message to return. In this example, it's always "Hello World!" */
  message: string;
}

//
//  Handler
//

/**
 * Validation for this handler function.
 *
 * @param event The AWS Event information for this event
 * @param context The AWS Lambda execution context for this event
 * @returns Relevant info once the handler passes verification.
 */
async function handlerValidation(event: APIGatewayProxyEvent, context: Context) {
  // ...do nothing
  const parsedData = await validateMultipartSchema(SchemaHandlerMultipartInput, event, {
    filesToParse: ["tester"],
    maxFileSize: 1048576 * 3, // 3 MB
  });

  console.log(parsedData);
}

/**
 * An example Lambda Handler. Simply returns "Hello World!" as json.
 *
 * @param event Info about the API Gateway event that triggered this lambda.
 * @param context Context regarding this lambda call
 * @returns APIGatewayProxyResult
 */
export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    await handlerValidation(event, context);

    const response: IHandlerOutput = { message: "Hello World!" };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (exception) {
    return handleApiException(exception);
  }
};

export default handler;
