import type { Banner } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
type BannerRow = Omit<Banner, "active" | "motorcycleIds"> & {
  active: number;
  motorcycle_ids: string;
};
export function selectBanners(db: D1Database): D1PreparedStatement {
  return db.prepare(
    'SELECT id, title, subtitle, image, link, active, motorcycle_ids, position AS "order" FROM banners ORDER BY position, id',
  );
}
export function decodeBanners(result: D1Result<unknown> | undefined): Banner[] {
  return resultRows<BannerRow>(result).map(({ motorcycle_ids, ...row }) => {
    const ids: unknown = JSON.parse(motorcycle_ids);
    if (
      !Array.isArray(ids) ||
      ids.length > 6 ||
      ids.some((id) => typeof id !== "string")
    )
      throw new Error("Invalid banner motorcycle references");
    return {
      ...row,
      active: row.active === 1,
      ...(ids.length ? { motorcycleIds: ids as string[] } : {}),
    };
  });
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
      ["motorcycle_ids", "motorcycleIds"],
    ],
    items.map((item) => ({ ...item, motorcycleIds: item.motorcycleIds ?? [] })),
    token,
  );
}
