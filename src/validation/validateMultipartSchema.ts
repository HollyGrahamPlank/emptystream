import { APIGatewayProxyEvent } from "aws-lambda";
import { z } from "zod";
import ApiError from "../apiError.js";
import { IParseMultipartConfig, parseMultipart } from "../multipart/parseMultipart.js";
import ParseMultipartError from "../multipart/parseMultipartError.js";

/**
 * Given some Zod schema and multipart parsing data, parse a lambda event's multipart data and
 * validate it according to the schema - or throw a proper API error
 *
 * @param schema The schema that should be enforced on the parsed multipart data.
 * @param event The APIGateway event (typically passed in from a lambda) that has multipart data.
 * @param inputConfig Determines how to parse the multipart data. See `IParseMultipartConfig` for
 *   more info.
 * @returns The parsed and fully validated object, typed correctly.
 */
export default async function validateMultipartSchema<T, TSchema extends z.ZodType<T>>(
  schema: TSchema,
  event: APIGatewayProxyEvent,
  inputConfig: Partial<IParseMultipartConfig> = {},
): Promise<z.infer<TSchema>> {
  try {
    // Parse the multipart data from the given lambda event
    const parsedResults = await parseMultipart(event, inputConfig);

    // Because the parsed data is just returned as a JSON object, we can pass it RIGHT into zod.
    // If the input object is valid, then we are done!
    const result = await schema.parseAsync(parsedResults || {});

    return result;
  } catch (err) {
    if (err instanceof z.ZodError) {
      // If there was an error during the Zod validation... handle it.
      throw new ApiError(409, "Failed to validate data");
    } else if (err instanceof ParseMultipartError) {
      // If there was an error during the multipart parsing... handle it.
      throw new ApiError(409, err.message);
    } else {
      // If we don't know WHAT the issue was... handle it.
      console.log(err);
      throw new ApiError(500, "Unknown validation error");
    }
  }
}
