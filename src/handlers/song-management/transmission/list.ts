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

//
//  Interfaces
//

/** The schema for the parameters that are passed into the handler via the query string. */
const SchemaHandlerQueryInput = z.object({
  /** If we are paginating results - this is the ID where we last left off. */
  lastEvaluatedId: z.string().optional(),
});

/** How the JSON that the handler returns should be formatted. */
interface IHandlerOutput {
  lastEvaluatedId?: string;
  itemCount: number;
  items: {
    id: string;
    name: string;
  }[];
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
  const { lastEvaluatedId } = await validateSchema(
    SchemaHandlerQueryInput,
    event.queryStringParameters,
  );

  return { lastEvaluatedId };
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
    const { lastEvaluatedId } = await handlerValidation(event, context);

    const results = await Transmission.scan.go({ cursor: lastEvaluatedId });

    const response: IHandlerOutput = {
      lastEvaluatedId: results.cursor || undefined,
      itemCount: results.data.length,
      items: results.data.map((value) => ({ name: value.name, id: value.id })),
    };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (exception) {
    return handleApiException(exception);
  }
};

export default handler;
