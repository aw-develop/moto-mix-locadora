import type { Activity } from "../models/catalog.ts";
import { replaceCollection, resultRows } from "./sql.ts";
export function selectActivities(db: D1Database): D1PreparedStatement {
  return db.prepare(
    "SELECT id, type, title, detail, at FROM admin_activities ORDER BY position, id",
  );
}
export function decodeActivities(
  result: D1Result<unknown> | undefined,
): Activity[] {
  return resultRows<Activity>(result).map((row) => ({ ...row }));
}
export function replaceActivities(
  db: D1Database,
  items: readonly Activity[],
  token: string,
): D1PreparedStatement[] {
  return replaceCollection(
    db,
    "admin_activities",
    [
      ["id", "id"],
      ["type", "type"],
      ["title", "title"],
      ["detail", "detail"],
      ["at", "at"],
      ["position", "$index"],
    ],
    items,
    token,
  );
}
