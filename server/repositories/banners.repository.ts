import type { Banner } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
type BannerRow = Omit<Banner, "active"> & { active: number };
export function selectBanners(db: D1Database): D1PreparedStatement {
  return db.prepare(
    'SELECT id, title, subtitle, image, link, active, position AS "order" FROM banners ORDER BY position, id',
  );
}
export function decodeBanners(result: D1Result<unknown> | undefined): Banner[] {
  return resultRows<BannerRow>(result).map((row) => ({
    ...row,
    active: row.active === 1,
  }));
}
export function replaceBanners(
  db: D1Database,
  items: readonly Banner[],
  token: string,
): D1PreparedStatement[] {
  return replaceCollection(
    db,
    "banners",
    [
      ["id", "id"],
      ["title", "title"],
      ["subtitle", "subtitle"],
      ["image", "image"],
      ["link", "link"],
      ["active", "active"],
      ["position", "order"],
    ],
    items,
    token,
  );
}
