/** Thank you vandium-io for the inspiration with https://github.com/vandium-io/lambda-tester */
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { v4 as uuidV4 } from "uuid";

/**
 * A class for helping with running unit tests on AWS Lambdas. The main purpose of this is to act as
 * a wrapper around lambdas, so that they can be run like an async function.
 */
export default class LambdaTest {
  //
  //    Public Methods
  //

  /**
   * Run a Lambda Handler as if it was a normal async function. This handles providing all of the
   * right data to the handler function, including providing default values for the event parameter
   * and populating the context object.
   *
   * This is meant to be used with Unit Tests, in order to make testing easier!
   *
   * @example
   *   // Imagine that `someHandlerFunction` is some AWS Lambda Handler that says "Hello X!" where
   *   // x is the value of a query string named "nameToGreet" passed in to the route.
   *
   *   // Run the `someHandlerFunction` lambda as if it was an async method const result = await
   *   LambdaTest.run(someHandlerFunction, { queryStringParameters: { nameToGreet: "Holly" } });
   *
   *   // Parse the results and print 'em out. It should print "Hello Holly!" const { message } =
   *   JSON.parse(result.body);
   *   console.log(message);
   *
   * @param lambdaHandler The function exported by the lambda handler (usually named `handler`)
   * @param event Any additional event info, like params or headers.
   * @returns The lambda's result!
   */
  public static async run(
    lambdaHandler: APIGatewayProxyHandler,
    event: Partial<APIGatewayProxyEvent>,
  ): Promise<APIGatewayProxyResult> {
    // Construct a full event object from the partially provided one
    const fullEvent = LambdaTest.applyEventDefaults(event);

    // Construct a full context object just from defaults
    const fullContext = LambdaTest.applyContextDefaults({});

    // Call the handler, and return the results!
    const result = await LambdaTest.runHandlerAsPromise(lambdaHandler, fullEvent, fullContext);
    return result;
  }

  //
  //    Static Functions
  //

  /**
   * Populates a partial API Gateway event object with default values, if they are not already
   * populated.
   *
   * @example
   *   // The default values are as follows:
   *   return {
   *     path: "/",
   *     resource: "",
   *     httpMethod: "POST",
   *     body: null,
   *     headers: {},
   *     multiValueHeaders: {},
   *     queryStringParameters: {},
   *     multiValueQueryStringParameters: {},
   *     pathParameters: {},
   *     isBase64Encoded: false,
   *   };
   *
   * @param partialEvent An API Gateway event object that is partially populated or unpopulated.
   * @returns A fully populated API Gateway object
   */
  static applyEventDefaults(partialEvent: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent {
    const eventDefaults: Partial<APIGatewayProxyEvent> = {
      path: "/",
      resource: "",
      httpMethod: "POST",
      body: null,
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      pathParameters: {},
      isBase64Encoded: false,
    };

    return { ...eventDefaults, ...partialEvent } as APIGatewayProxyEvent;
  }

  /**
   * Populates a partial Lambda Context object with default values, if they are not already
   * populated.
   *
   * @example
   *   // The default values are as follows:
   *   return {
   *     functionName: defaultFunctionName,
   *     functionVersion: defaultFunctionVersion,
   *     memoryLimitInMB: "128",
   *     logGroupName: "/aws/lambda/test-function",
   *     logStreamName: LambdaTest.createContextLogStreamName(defaultFunctionVersion, new Date()),
   *     invokedFunctionArn: LambdaTest.createContextFunctionArn(defaultFunctionName),
   *     awsRequestId: uuidV4(),
   *   };
   *
   * @param partialContext A Context object that is partially populated or unpopulated.
   * @returns A fully populated Context object.
   */
  static applyContextDefaults(partialContext: Partial<Context>): Context {
    const defaultFunctionName = "test-function";
    const defaultFunctionVersion = "$LATEST";

    const contextDefaults: Partial<Context> = {
      functionName: defaultFunctionName,
      functionVersion: defaultFunctionVersion,
      memoryLimitInMB: "128",
      logGroupName: `/aws/lambda/${defaultFunctionName}`,
      logStreamName: LambdaTest.createContextLogStreamName(defaultFunctionVersion, new Date()),
      invokedFunctionArn: LambdaTest.createContextFunctionArn(defaultFunctionName),
      awsRequestId: uuidV4(),
    };

    return { ...contextDefaults, ...partialContext } as Context;
  }

  /**
   * Constructs a formatted string that resembles the name of a lambda's log stream. This is
   * primarily used when creating the Context object for a lambda.
   *
   * @param functionVersion The version of the function
   * @param date The date/time that the log belongs to
   * @returns The formatted string
   */
  static createContextLogStreamName(functionVersion: string, date: Date) {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const id = uuidV4()
      .replace("-", "")
      .replace("-", "")
      .replace("-", "")
      .replace("-", "") as string;

    return `${year}/${month}/${day}/[${functionVersion}]${id}`;
  }

  /**
   * Constructs a formatted string that resembles a function ARN. This is primarily used when
   * creating the Context object for a lambda.
   *
   * @param functionName The name of the function calling the lambda.
   * @returns The formatted string
   */
  static createContextFunctionArn(functionName: string) {
    const region = process.env.AWS_REGION || "us-east-1";
    return `arn:aws:lambda:${region}:999999999999:function:${functionName}`;
  }

  /**
   * A wrapper method that runs a Lambda Handler as a promise. This is necessary because Lambdas can
   * be written to use either a callback structure, OR a promise structure.
   *
   * @param handler The Lambda Handler to call
   * @param event The Lambda Event to pass
   * @param context The Lambda Context to pass
   * @returns The result of the lambda call as an APIGatewayProxyResult
   */
  static runHandlerAsPromise(
    handler: APIGatewayProxyHandler,
    event: APIGatewayProxyEvent,
    context: Context,
  ) {
    return new Promise<APIGatewayProxyResult>((resolve, reject) => {
      /**
       * A function that will finish this promise by taking the results of either the handler
       * callback or the handler promise return type, and converting it to just a normal promise.
       *
       * @param callbackErr
       * @param callbackResult
       */
      function finishPromise(
        callbackErr: string | Error | null | undefined,
        callbackResult: APIGatewayProxyResult | undefined,
      ) {
        if (callbackErr || !callbackResult) {
          reject(callbackErr);
        } else {
          resolve(callbackResult);
        }
      }

      try {
        // Run the handler. If the handler uses a callback structure, handle it with finishPromise.
        const result = handler(event, context, finishPromise);

        // If the handler uses a promise structure, handle it with finishPromise.
        if (result) {
          result.then(
            (promiseResult) => finishPromise(undefined, promiseResult),
            (promiseErr) => finishPromise(promiseErr, undefined),
          );
        }
      } catch (handlerErr) {
        reject(handlerErr);
      }
    });
  }
}
