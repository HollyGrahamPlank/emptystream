import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { nanoid } from "nanoid";
import { z } from "zod";
import Transmission from "../../../db/entities/Transmission.js";
import handleApiException from "../../../handleApiException.js";
import validateMultipartSchema from "../../../validation/validateMultipartSchema.js";
import TransmissionSource from "../../../s3/transmissionSource.js";

//
//  Interfaces
//

/** The schema for the parameters that are passed into the handler via multipart data in the body */
const SchemaHandlerMultipartInput = z.object({
  /** The name of the new Transmission. */
  name: z.string(),

  /** The audio file of the Transmission. */
  audio: z.instanceof(Buffer),
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
  const { name, audio } = await validateMultipartSchema(SchemaHandlerMultipartInput, event, {
    filesToParse: ["audio"],
    maxFileSize: 1048576 * 3, // 3 MB
  });

  return { name, audio };
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
    const { name, audio } = await handlerValidation(event, context);

    // Create a new transmission with a new ID, and the desired name
    const item = await Transmission.create({
      id: nanoid(),
      name,
    }).go();

    // Store the source audio in S3
    await TransmissionSource.upload(item.data.id, audio);
    // TODO - what happens if the above fails?

    // Format the data output
    const response: IHandlerOutput = {
      id: item.data.id,
      name: item.data.name,
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
