import type { SiteSettings } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
export function selectSettings(db: D1Database): D1PreparedStatement {
  return db.prepare(
    "SELECT whatsapp_number AS whatsappNumber, address, hours, map_query AS mapQuery, map_label AS mapLabel, instagram, facebook, rental_conditions AS rentalConditionsJson FROM site_settings WHERE id = 'main'",
  );
}
export function decodeSettings(
  result: D1Result<unknown> | undefined,
): SiteSettings {
  const row = resultRows<SiteSettings & { rentalConditionsJson: string }>(result)[0];
  if (!row) throw new Error("Site settings not initialized");
  const { rentalConditionsJson, ...settings } = row;
  const conditions = JSON.parse(rentalConditionsJson);
  return { ...settings, ...(Object.keys(conditions).length ? { rentalConditions: conditions } : {}) };
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
      ["rental_conditions", "rentalConditions"],
    ],
    [{ id: "main", ...settings, rentalConditions: settings.rentalConditions ?? {} }],
    token,
  );
}
