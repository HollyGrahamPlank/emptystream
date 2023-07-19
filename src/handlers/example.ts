import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

/**
 * Validation for this handler function.
 * @param event The AWS Event information for this event
 * @param context The AWS Lambda execution context for this event
 * @returns relevant info once the handler passes verification.
 */
async function handlerValidation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: APIGatewayProxyEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: Context,
) {
  // ...do nothing
}

export const handler: APIGatewayProxyHandler = async (
  event,
  context,
): Promise<APIGatewayProxyResult> => {
  handlerValidation(event, context);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello World!',
    }),
  };
};

export default handler;
