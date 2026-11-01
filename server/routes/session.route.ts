import type { RequestContext } from "../models/environment.ts";
import { json } from "../http/responses.ts";
export function sessionRoute({ identity }: RequestContext): Response {
  return json({
    isAdmin: identity.isAdmin,
    signedIn: identity.signedIn,
    name: identity.isAdmin ? identity.name : "",
    email: "",
  });
}
