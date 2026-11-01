import { fail } from "./errors.ts";
export const MAX_BODY_BYTES = 8 * 1024 * 1024;
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    fail("Formato de requisição inválido.", 415);
  const reader = request.body?.getReader();
  if (!reader) fail("Requisição vazia.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      fail("Envie menos imagens por vez.", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    fail("JSON inválido.");
  }
}
