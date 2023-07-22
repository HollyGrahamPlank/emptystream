import Joi, { ObjectSchema } from "joi";
import ApiError from "../apiError.js";

export interface IValidateSchemaOptions {
  /** Should we tolerate unknown keys in the given object? */
  allowUnknown: boolean;

  /** Should we strip out any unknown keys in the given object? */
  stripUnknown: boolean;
}

/** The default options for the `validateSchema` function. */
const defaultValidateSchemaOptions: IValidateSchemaOptions = {
  allowUnknown: true,
  stripUnknown: true,
};

export default async function validateSchema<TSchema = any>(
  schema: ObjectSchema<TSchema>,
  object: Partial<TSchema> | null | undefined,
  options: Partial<IValidateSchemaOptions> = {},
): Promise<TSchema> {
  // Apply any defaults to unset values in the options object.
  const fullOptions: IValidateSchemaOptions = {
    ...defaultValidateSchemaOptions,
    ...options,
  };

  try {
    // Validate the input object. If the input object is valid, then we are done!
    const result = await schema.validateAsync(object || {}, {
      allowUnknown: fullOptions.allowUnknown,
      stripUnknown: fullOptions.stripUnknown,
    });

    return result;
  } catch (err) {
    if (err instanceof Joi.ValidationError) {
      // If there was an error during the JOI validation... handle it.
      throw new ApiError(409, err.message);
    } else {
      // If we don't know WHAT the issue was... handle it.
      console.log(err);
      throw new ApiError(500, "Unknown validation error");
    }
  }
}
