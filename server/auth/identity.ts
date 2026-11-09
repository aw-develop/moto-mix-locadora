import type { RequestIdentity } from "../models/environment.ts";
import { fail } from "../http/errors.ts";
/** Only a validated server session can authorize an administrator. */
export function anonymousIdentity(): RequestIdentity {
  return { isAdmin: false, signedIn: false, userId: null, email: "", name: "" };
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
