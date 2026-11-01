import type { RequestContext } from "../models/environment.ts";
import { MediaService } from "../services/media.service.ts";
export async function mediaRoute({
  env,
  url,
  request,
}: RequestContext): Promise<Response> {
  return new MediaService(env.BUCKET).serve(
    url.pathname.slice("/api/media/".length),
    request.method === "HEAD",
  );
}
