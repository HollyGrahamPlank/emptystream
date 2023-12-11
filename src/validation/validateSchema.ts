import { z } from "zod";
import ApiError from "../apiErrors/apiError.js";

/**
 * Given some Zod schema and an object, validate it or throw a proper ApiError.
 *
 * @param schema The schema that should be enforced on `object`.
 * @param object The object to validate, using `schema`.
 * @returns The fully validated object, typed correctly.
 */
export default async function validateSchema<T, TSchema extends z.ZodType<T>>(
  schema: TSchema,
  object: Partial<T> | null | undefined,
): Promise<z.infer<TSchema>> {
  try {
    // Validate the input object. If the input object is valid, then we are done!
    const result = await schema.parseAsync(object || {});

    return result;
  } catch (err) {
    if (err instanceof z.ZodError) {
      // If there was an error during the Zod validation... handle it.
      throw new ApiError(409, "Failed to validate data");
    } else {
      // If we don't know WHAT the issue was... handle it.
      console.log(err);
      throw new ApiError(500, "Unknown validation error");
    }
  }
}
