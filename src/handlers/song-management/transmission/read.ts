import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import Joi from "joi";
import handleApiException from "../../../handleApiException.js";
import validateSchema from "../../../validation/validateSchema.js";

//
//  Interfaces
//

interface IHandlerPathInput {
  id: string;
}

const SchemaHandlerPathInput = Joi.object<IHandlerPathInput, true>({
  id: Joi.string().required(),
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
  const { id } = await validateSchema(SchemaHandlerPathInput, event.pathParameters);
  return { id };
}

/**
 * A lambda handler that gets the requested transmission, by it's ID
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
    const { id } = await handlerValidation(event, context);

    const response: IHandlerOutput = { message: `Got ID ${id}` };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (exception) {
    return handleApiException(exception);
  }
};

export default handler;
