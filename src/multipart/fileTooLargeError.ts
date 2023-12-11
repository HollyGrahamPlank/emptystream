import ParseMultipartError from "./parseMultipartError.js";

export default class FileTooLargeError extends ParseMultipartError {
  constructor(fieldName: string) {
    super(`File in field '${fieldName}' exceeds the max file size.`);
  }
}
