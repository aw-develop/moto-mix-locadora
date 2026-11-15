import type { CatalogState } from '../models/catalog.ts';
import { SITE_ORIGIN } from './site-identity.ts';

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[character]!);
}

/** Only the canonical homepage exists today; section anchors are not pages. */
export function buildSitemap(state: CatalogState): string {
  const images = new Set<string>();
  const candidates = [
    ...state.bikes.map(bike => bike.image),
    ...state.banners.filter(banner => banner.active).map(banner => banner.image),
  ];
  for (const source of candidates) {
    try {
      const image = new URL(source, SITE_ORIGIN);
      // Include only our public assets, never external hosts, inline uploads or APIs.
      if (image.origin !== SITE_ORIGIN || image.username || image.password ||
          !/^\/(?:assets\/|api\/media\/)/.test(image.pathname)) continue;
      image.hash = '';
      images.add(image.href);
    } catch { /* Invalid images must not invalidate the entire sitemap. */ }
  }
  const entries = [...images].slice(0, 1000).map(image => [
    '    <image:image>',
    `      <image:loc>${escapeXml(image)}</image:loc>`,
    '    </image:image>',
  ].join('\n'));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    '  <url>',
    `    <loc>${SITE_ORIGIN}/</loc>`,
    ...entries,
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
}
