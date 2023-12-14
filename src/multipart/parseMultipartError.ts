export default class ParseMultipartError extends Error {
  /** The name of this error. This will always be "ParseMultipartError" */
  public name: string;

  /** The public-facing message to stringify. */
  public message: string;

  constructor(message: string) {
    super();
    this.name = "ParseMultipartError";
    this.message = message;
  }
}
