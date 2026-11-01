import { fail } from "../http/errors.ts";
import { https, text } from "./fields.ts";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export function imageReference(value: unknown): string {
  const source = text(value, "Imagem", Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 50);
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(source))
    return source;
  if (source.length > 2048) fail("URL de imagem muito longa.");
  if (
    /^\/?assets\/[\w./-]+\.(webp|png|jpe?g)$/i.test(source) ||
    /^\/api\/media\/[a-f0-9]{64}\.(webp|png|jpeg)$/.test(source) ||
    https(source)
  )
    return source;
  fail("Imagem inválida. Use o upload ou uma URL HTTPS.");
}
export function decodeImage(source: string): {
  bytes: Uint8Array<ArrayBuffer>;
  extension: "png" | "jpeg" | "webp";
} {
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(source);
  if (
    !match?.[1] ||
    !match[2] ||
    match[2].length % 4 !== 0 ||
    match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4
  )
    fail("Imagem inválida.");
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  } catch {
    fail("Imagem inválida.");
  }
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
    fail("Imagem maior que 2 MB.");
  const extension = match[1] as "png" | "jpeg" | "webp";
  const valid =
    extension === "png"
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
      : extension === "jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!valid) fail("Assinatura de imagem inválida.");
  return { bytes, extension };
}
