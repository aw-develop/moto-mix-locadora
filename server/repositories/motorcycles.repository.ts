import type { Motorcycle } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
type MotorcycleRow = Omit<Motorcycle, "available" | "cardGroup"> & {
  available: number;
  card_group: string;
};
const columns = [
  ["id", "id"],
  ["card_group", "cardGroup"],
  ["name", "name"],
  ["version", "version"],
  ["category", "category"],
  ["transmission", "transmission"],
  ["consumption", "consumption"],
  ["description", "description"],
  ["image", "image"],
  ["daily", "daily"],
  ["weekly", "weekly"],
  ["available", "available"],
  ["position", "$index"],
] as const;
export function selectMotorcycles(db: D1Database): D1PreparedStatement {
  return db.prepare(
    "SELECT id, name, version, category, transmission, consumption, description, image, daily, weekly, available, card_group FROM motorcycles ORDER BY position, id",
  );
}
export function decodeMotorcycles(
  result: D1Result<unknown> | undefined,
): Motorcycle[] {
  return resultRows<MotorcycleRow>(result).map(({ card_group, ...row }) => ({
    ...row,
    ...(card_group ? { cardGroup: card_group } : {}),
    available: row.available === 1,
  }));
}
export function replaceMotorcycles(
  db: D1Database,
  items: readonly Motorcycle[],
  token: string,
): D1PreparedStatement[] {
  return replaceCollection(
    db,
    "motorcycles",
    columns,
    items.map((item) => ({ ...item, cardGroup: item.cardGroup ?? "" })),
    token,
  );
}
