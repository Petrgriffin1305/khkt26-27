export class ApiError extends Error {
  constructor(
    public status: number,
    public kind: string,
    message: string,
  ) {
    super(message);
  }
}
export function missing(message = "Resource not found"): never {
  throw new ApiError(404, "not-found", message);
}
