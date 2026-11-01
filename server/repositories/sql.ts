export const writeGuard =
  "EXISTS (SELECT 1 FROM catalog_metadata WHERE id = 'main' AND write_token = ?)";
export type ColumnMap = readonly (readonly [column: string, jsonKey: string])[];
/** Identifiers and JSON paths come exclusively from static repository definitions. */
export function replaceCollection(
  db: D1Database,
  table: string,
  columns: ColumnMap,
  items: readonly unknown[],
  token: string,
): D1PreparedStatement[] {
  const names = columns.map(([column]) => column).join(", ");
  const expressions = columns
    .map(([, key]) =>
      key === "$index"
        ? "CAST(key AS INTEGER)"
        : `json_extract(value, '$.${key}')`,
    )
    .join(", ");
  return [
    db.prepare(`DELETE FROM ${table} WHERE ${writeGuard}`).bind(token),
    db
      .prepare(
        `INSERT INTO ${table} (${names}) SELECT ${expressions} FROM json_each(?) WHERE ${writeGuard}`,
      )
      .bind(JSON.stringify(items), token),
  ];
}
export function resultRows<T>(result: D1Result<unknown> | undefined): T[] {
  if (!result) throw new Error("Missing database batch result");
  return result.results as T[];
}
