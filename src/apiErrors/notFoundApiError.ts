import ApiError from "./apiError.js";

export default class NotFoundApiError extends ApiError {
  constructor() {
    super(404, "Item not found.");
  }
}
