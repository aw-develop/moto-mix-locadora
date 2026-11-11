import type { SiteSettings } from '../models/catalog.ts';
import { SITE_ORIGIN } from './site-identity.ts';

function hours(value: string) {
  const definitions = [
    { match: /segunda\s+a\s+sexta[^\d]*(\d{1,2})(?:h(?:(\d{2}))?|:(\d{2}))\s*(?:às|a|[-–])\s*(\d{1,2})(?:h(?:(\d{2}))?|:(\d{2}))/i, days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
    { match: /s[áa]bado[^\d]*(\d{1,2})(?:h(?:(\d{2}))?|:(\d{2}))\s*(?:às|a|[-–])\s*(\d{1,2})(?:h(?:(\d{2}))?|:(\d{2}))/i, days: ['Saturday'] },
  ];
  return definitions.flatMap(({match, days}) => {
    const m = value.match(match);
    if (!m) return [];
    const openHour = Number(m[1]), closeHour = Number(m[4]);
    const openMinute = Number(m[2] || m[3] || 0), closeMinute = Number(m[5] || m[6] || 0);
    if (openHour > 23 || closeHour > 23 || openMinute > 59 || closeMinute > 59 || openHour * 60 + openMinute >= closeHour * 60 + closeMinute) return [];
    const clock = (h: number, min: number) => `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: days.map(d => `https://schema.org/${d}`), opens: clock(openHour, openMinute), closes: clock(closeHour, closeMinute) }];
  });
}
export function localBusiness(settings: SiteSettings): Record<string, unknown> | null {
  if (!/^55\d{10,11}$/.test(settings.whatsappNumber) || !/palhoça|palhoca/i.test(settings.address) || /demonstrativ|a confirmar/i.test(settings.address)) return null;
  const postalCode = settings.address.match(/\b\d{5}-?\d{3}\b/)?.[0];
  const sameAs = [settings.instagram, settings.facebook].filter(value => /^https:\/\//.test(value));
  const openingHoursSpecification = hours(settings.hours);
  return {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': `${SITE_ORIGIN}/#empresa`,
    name: 'Mix Locadora de Motos', url: `${SITE_ORIGIN}/`, telephone: `+${settings.whatsappNumber}`,
    description: 'Aluguel de motos em Palhoça, Santa Catarina. Consulte a frota, os planos e as condições de locação.',
    address: { '@type': 'PostalAddress', streetAddress: settings.address.replace(/,\s*Palho[çc]a\s*[-–]\s*SC.*$/i, ''), addressLocality: 'Palhoça', addressRegion: 'SC', addressCountry: 'BR', ...(postalCode ? {postalCode} : {}) },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`,
    ...(sameAs.length ? {sameAs} : {}),
    ...(openingHoursSpecification.length ? {openingHoursSpecification} : {}),
    makesOffer: { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Aluguel de motos', serviceType: 'Locação de motocicletas', areaServed: { '@type': 'City', name: 'Palhoça' } } },
  };
}
/** Escape HTML-sensitive characters even though this script contains data, not JavaScript. */
export function serializeStructuredData(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => ({'<':'\\u003c','>':'\\u003e','&':'\\u0026','\u2028':'\\u2028','\u2029':'\\u2029'}[c]!));
}
