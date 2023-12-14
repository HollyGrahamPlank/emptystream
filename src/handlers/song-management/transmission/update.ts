import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { boolean, z } from "zod";
import handleApiException from "../../../handleApiException.js";
import validateSchema from "../../../validation/validateSchema.js";
import Transmission from "../../../db/entities/Transmission.js";
import { SetRecord } from "electrodb";
import NotFoundApiError from "../../../apiErrors/notFoundApiError.js";

//
//  Interfaces
//

/** The schema for the parameters that are passed into the handler via the HTTP path. */
const SchemaHandlerPathInput = z.object({
  /** The ID of the Transmission to update. */
  id: z.string(),
});

/** The schema for the parameters that are passed into the handler via the request body. */
const SchemaHandlerBodyInput = z.object({
  name: z.string().optional(),
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
  const { name } = await validateSchema(SchemaHandlerBodyInput, JSON.parse(event.body || "{}"));

  return { id, fieldsToSet: { name } };
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
    const { id, fieldsToSet } = await handlerValidation(event, context);

    await Transmission.patch({ id })
      .set(fieldsToSet.name ? { name: fieldsToSet.name } : {})
      .go();
    const result = await Transmission.get({ id }).go();
    if (!result.data) throw new NotFoundApiError();

    const response: IHandlerOutput = { id: result.data.id, name: result.data.name };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (exception) {
    return handleApiException(exception);
  }
};

export default handler;
