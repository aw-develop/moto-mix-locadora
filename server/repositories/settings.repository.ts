import type { SiteSettings } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
export function selectSettings(db: D1Database): D1PreparedStatement {
  return db.prepare(
    "SELECT whatsapp_number AS whatsappNumber, address, hours, map_query AS mapQuery, map_label AS mapLabel, instagram, facebook FROM site_settings WHERE id = 'main'",
  );
}
export function decodeSettings(
  result: D1Result<unknown> | undefined,
): SiteSettings {
  const row = resultRows<SiteSettings>(result)[0];
  if (!row) throw new Error("Site settings not initialized");
  return { ...row };
}
export function replaceSettings(
  db: D1Database,
  settings: SiteSettings,
  token: string,
): D1PreparedStatement[] {
  return replaceCollection(
    db,
    "site_settings",
    [
      ["id", "id"],
      ["whatsapp_number", "whatsappNumber"],
      ["address", "address"],
      ["hours", "hours"],
      ["map_query", "mapQuery"],
      ["map_label", "mapLabel"],
      ["instagram", "instagram"],
      ["facebook", "facebook"],
    ],
    [{ id: "main", ...settings }],
    token,
  );
}
