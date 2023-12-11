import ApiError from "./apiError.js";

export default class BadRequestApiError extends ApiError {
  constructor() {
    super(400, "Bad request.");
  }
}
