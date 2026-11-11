import type { BackendEnvironment } from '../models/environment.ts';
import type { CatalogSnapshot } from '../models/catalog.ts';
import { CatalogRepository } from '../repositories/catalog.repository.ts';
import { CatalogService } from '../services/catalog.service.ts';
import { MediaService } from '../services/media.service.ts';
import { SITE_ORIGIN, PRODUCTION_ALIASES } from './site-identity.ts';
import { localBusiness, serializeStructuredData } from './structured-data.ts';
type Renderer = (request: Request, context: { publicCatalog: CatalogSnapshot }) => Promise<Response | null>;
const publicHeaders = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };
export async function publicPage(request: Request, env: BackendEnvironment, render: Renderer): Promise<Response | null> {
  const url = new URL(request.url);
  if (!['GET','HEAD'].includes(request.method)) return null;
  const known = ['/', '/robots.txt', '/sitemap.xml'].includes(url.pathname);
  if (!known) {
    if (/^\/(?:admin|api|assets|client|_next)(?:\/|$)/.test(url.pathname) || ['/favicon.ico','/vinext-client-entry-manifest.json'].includes(url.pathname)) return null;
    return new Response(request.method === 'HEAD' ? null : 'Página não encontrada.', {status:404,headers:{...publicHeaders,'content-type':'text/plain; charset=utf-8'}});
  }
  // Redirect only public documents. Auth/API requests stay on their own origin.
  if (PRODUCTION_ALIASES.has(url.hostname)) {
    return new Response(null, {status: 301, headers: { location: `${SITE_ORIGIN}${url.pathname}${url.search}`, 'cache-control':'public, max-age=300' }});
  }
  if (url.pathname === '/robots.txt') {
    const body = url.hostname === 'mixlocadora.com.br'
      ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /client/index.csr.html\nDisallow: /client/index.html\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n';
    return new Response(request.method === 'HEAD' ? null : body, {headers: {...publicHeaders, 'content-type':'text/plain; charset=utf-8'}});
  }
  if (url.pathname === '/sitemap.xml') {
    const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_ORIGIN}/</loc></url></urlset>`;
    return new Response(request.method === 'HEAD' ? null : body, {headers:{...publicHeaders,'content-type':'application/xml; charset=utf-8'}});
  }
  try {
    const service = new CatalogService(new CatalogRepository(env.DB), new MediaService(env.BUCKET));
    const snapshot = await service.read(false);
    // Sanitize headers as well as data: the public render never receives credentials or cookies.
    const publicRequest = new Request(url, {method:'GET', headers:{accept:'text/html'}});
    const response = await render(publicRequest, {publicCatalog:snapshot});
    if (!response?.ok) throw new Error('Public render unavailable');
    let html = await response.text();
    const business = localBusiness(snapshot.state.settings);
    if (business) html = html.replace('</head>', `<script type="application/ld+json">${serializeStructuredData(business)}</script></head>`);
    const headers = new Headers(response.headers);
    headers.set('content-type','text/html; charset=utf-8');
    headers.set('cache-control','no-store');
    headers.delete('set-cookie');
    if (url.hostname !== 'mixlocadora.com.br') headers.set('x-robots-tag','noindex');
    return new Response(request.method === 'HEAD' ? null : html, {status:200,headers});
  } catch {
    // No demo data or empty app shell indexed when D1/SSR is unavailable.
    return new Response(request.method === 'HEAD' ? null : 'Não foi possível carregar a Mix. Tente novamente em instantes.', {status:503,headers:{...publicHeaders,'content-type':'text/plain; charset=utf-8','retry-after':'60'}});
  }
}
