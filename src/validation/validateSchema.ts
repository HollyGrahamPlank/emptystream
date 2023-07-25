import { z } from "zod";
import ApiError from "../apiError.js";

export default async function validateSchema<T, TSchema extends z.ZodType<T>>(
  schema: TSchema,
  object: Partial<T> | null | undefined,
): Promise<T> {
  try {
    // Validate the input object. If the input object is valid, then we are done!

    const result = await schema.parseAsync(object || {});

    return result;
  } catch (err) {
    if (err instanceof z.ZodError) {
      // If there was an error during the Zod validation... handle it.
      throw new ApiError(409, err.message);
    } else {
      // If we don't know WHAT the issue was... handle it.
      console.log(err);
      throw new ApiError(500, "Unknown validation error");
    }
  }
}
