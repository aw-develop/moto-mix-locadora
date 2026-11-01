import type {
  BackendEnvironment,
  RequestIdentity,
} from "../models/environment.ts";
import { fail } from "../http/errors.ts";
/** Identity headers are supplied by Sites dispatch, never accepted as application credentials. */
export function resolveIdentity(
  request: Request,
  env: BackendEnvironment,
): RequestIdentity {
  const userId = request.headers.get("oai-authenticated-user-id"),
    email = request.headers.get("oai-authenticated-user-email");
  const allowed = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return {
    isAdmin: !!userId && !!email && allowed.includes(email.toLowerCase()),
    signedIn: !!userId,
    userId,
    email: email || "",
    name: email?.split("@")[0] || "Administrador",
  };
}
export function requireAdmin(identity: RequestIdentity): void {
  if (!identity.isAdmin)
    fail("Acesso restrito ao administrador.", identity.signedIn ? 403 : 401);
}
export function requireSameOrigin(request: Request): void {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    fail("Origem não autorizada.", 403);
}
