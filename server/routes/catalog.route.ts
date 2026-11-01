import type { RequestContext } from "../models/environment.ts";
import { requireAdmin, requireSameOrigin } from "../auth/identity.ts";
import { json } from "../http/responses.ts";
import { readJson } from "../http/body.ts";
import { saveCatalog } from "../validation/catalog.ts";
import { CatalogRepository } from "../repositories/catalog.repository.ts";
import { CatalogService } from "../services/catalog.service.ts";
import { MediaService } from "../services/media.service.ts";
export async function catalogRoute(context: RequestContext): Promise<Response> {
  const { request, env, identity } = context;
  const service = new CatalogService(
    new CatalogRepository(env.DB),
    new MediaService(env.BUCKET),
  );
  if (request.method === "GET")
    return json(await service.read(identity.isAdmin));
  requireAdmin(identity);
  requireSameOrigin(request);
  return json(await service.save(saveCatalog(await readJson(request))));
}
