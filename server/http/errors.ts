export class HttpError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
export function fail(message: string, status = 400): never {
  throw new HttpError(message, status);
}
