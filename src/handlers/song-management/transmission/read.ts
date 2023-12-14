import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { z } from "zod";
import handleApiException from "../../../handleApiException.js";
import validateSchema from "../../../validation/validateSchema.js";
import Transmission from "../../../db/entities/Transmission.js";
import NotFoundApiError from "../../../apiErrors/notFoundApiError.js";

//
//  Interfaces
//

/** The schema for the parameters that are passed into the handler via the HTTP path. */
const SchemaHandlerPathInput = z.object({
  /** The ID of the Transmission to get. */
  id: z.string(),
});

/** How the JSON that the handler returns should be formatted. */
interface IHandlerOutput {
  id: string;
  name: string;
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

    // Get the item, and throw if we can't
    const item = await Transmission.get({ id }).go();
    if (!item.data) throw new NotFoundApiError();

    const response: IHandlerOutput = { id: item.data.id, name: item.data.name };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (exception) {
    return handleApiException(exception);
  }
};

export default handler;
