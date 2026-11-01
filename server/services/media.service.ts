import { decodeImage } from "../validation/images.ts";
import { fail } from "../http/errors.ts";
export class MediaService {
  private readonly bucket: R2Bucket;
  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }
  async store(source: string): Promise<string> {
    if (!source.startsWith("data:image/")) return source;
    const { bytes, extension } = decodeImage(source);
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    const key = `${hash}.${extension}`;
    await this.bucket.put(key, bytes, {
      httpMetadata: { contentType: `image/${extension}` },
    });
    return `/api/media/${key}`;
  }
  async serve(key: string, head = false): Promise<Response> {
    if (!/^[a-f0-9]{64}\.(webp|png|jpeg)$/.test(key))
      fail("Imagem não encontrada.", 404);
    const file = await this.bucket.get(key);
    if (!file) fail("Imagem não encontrada.", 404);
    // Cloudflare and DOM Response types differ only in their streaming declarations.
    return new Response(
      head ? null : (file.body as unknown as ReadableStream),
      {
        headers: {
          "content-type": file.httpMetadata?.contentType || "image/webp",
          "cache-control": "public, max-age=31536000, immutable",
          "x-content-type-options": "nosniff",
          "content-security-policy": "default-src 'none'",
          etag: file.httpEtag,
        },
      },
    );
  }
}
