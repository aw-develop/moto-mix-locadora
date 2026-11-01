import type { Motorcycle } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
type MotorcycleRow = Omit<Motorcycle, "available"> & { available: number };
const columns = [
  ["id", "id"],
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
    "SELECT id, name, version, category, transmission, consumption, description, image, daily, weekly, available FROM motorcycles ORDER BY position, id",
  );
}
export function decodeMotorcycles(
  result: D1Result<unknown> | undefined,
): Motorcycle[] {
  return resultRows<MotorcycleRow>(result).map((row) => ({
    ...row,
    available: row.available === 1,
  }));
}
export function replaceMotorcycles(
  db: D1Database,
  items: readonly Motorcycle[],
  token: string,
): D1PreparedStatement[] {
  return replaceCollection(db, "motorcycles", columns, items, token);
}
