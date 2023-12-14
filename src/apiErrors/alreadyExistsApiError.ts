import ApiError from "./apiError.js";

export default class AlreadyExistsApiError extends ApiError {
  constructor() {
    super(409, "Item already exists.");
  }
}
