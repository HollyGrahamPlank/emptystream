import ParseMultipartError from "./parseMultipartError.js";

export default class FieldTooLargeError extends ParseMultipartError {
  constructor(fieldName: string) {
    super(`Field '${fieldName}' exceeds the max field size.`);
  }
}
