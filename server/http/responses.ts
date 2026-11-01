import { HttpError } from "./errors.ts";
export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
export function errorResponse(error: unknown): Response {
  return error instanceof HttpError
    ? json({ error: error.message }, error.status)
    : json(
        { error: "Não foi possível acessar o armazenamento. Tente novamente." },
        503,
      );
}
