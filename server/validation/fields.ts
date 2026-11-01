import { fail } from "../http/errors.ts";
export function object(
  value: unknown,
  label = "Dados",
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(`${label}: valor inválido.`);
  return value as Record<string, unknown>;
}
export function text(
  value: unknown,
  label: string,
  max = 400,
  empty = false,
): string {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > max
  )
    fail(`${label}: valor inválido.`);
  return value.trim();
}
export function https(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function price(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 100000
  )
    fail("Preço inválido.");
  return value;
}
export function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") fail("Status inválido.");
  return value;
}
export function rows(
  value: unknown,
  max: number,
  label: string,
): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > max)
    fail(`${label}: limite excedido.`);
  const ids = new Set<string>();
  return value.map((item) => {
    const record = object(item, label);
    const id = text(record["id"], "Identificador", 80);
    if (ids.has(id)) fail("Identificadores duplicados.");
    ids.add(id);
    return record;
  });
}
export function enumValue<const T extends readonly string[]>(
  value: unknown,
  values: T,
  label: string,
): T[number] {
  if (typeof value !== "string" || !values.includes(value))
    fail(`${label}: valor inválido.`);
  return value;
}
