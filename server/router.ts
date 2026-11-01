import type {
  BackendEnvironment,
  RequestContext,
} from "./models/environment.ts";
import { resolveIdentity } from "./auth/identity.ts";
import { errorResponse, json } from "./http/responses.ts";
import { catalogRoute } from "./routes/catalog.route.ts";
import { sessionRoute } from "./routes/session.route.ts";
import { mediaRoute } from "./routes/media.route.ts";
export async function handleApi(
  request: Request,
  env: BackendEnvironment,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  try {
    const context: RequestContext = {
      request,
      env,
      url,
      identity: resolveIdentity(request, env),
    };
    if (url.pathname === "/api/session" && request.method === "GET")
      return sessionRoute(context);
    if (
      url.pathname === "/api/state" &&
      ["GET", "PUT"].includes(request.method)
    )
      return await catalogRoute(context);
    if (
      url.pathname.startsWith("/api/media/") &&
      ["GET", "HEAD"].includes(request.method)
    )
      return await mediaRoute(context);
    return json({ error: "Recurso não encontrado." }, 404);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
