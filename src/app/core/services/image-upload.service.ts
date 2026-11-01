import { Injectable } from "@angular/core";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_STORED_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export interface UploadedImage {
  readonly source: string;
  readonly name: string;
  readonly size: number;
}

export function validateImageFile(file: Pick<File, "size" | "type">): void {
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type))
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  if (!file.size || file.size > MAX_UPLOAD_BYTES)
    throw new Error("A imagem deve ter até 5 MB e não pode estar vazia.");
}
export function matchesImageSignature(
  bytes: Uint8Array,
  type: string,
): boolean {
  if (type === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    );
  if (type === "image/webp")
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}

/** Rasterizes locally to strip metadata and keep demo images small; no remote upload. */
@Injectable({ providedIn: "root" })
export class ImageUploadService {
  async process(file: File): Promise<UploadedImage> {
    validateImageFile(file);
    const bytes = new Uint8Array(await this.read(file.slice(0, 12)));
    if (!matchesImageSignature(bytes, file.type))
      throw new Error(
        "O conteúdo do arquivo não corresponde ao formato informado.",
      );
    const image = await this.decode(file);
    try {
      if (
        !image.width ||
        !image.height ||
        image.width * image.height > 40_000_000
      )
        throw new Error("Use uma imagem com até 40 megapixels.");
      const ratio = Math.min(1, 1920 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("Seu navegador não conseguiu preparar a imagem.");
      context.drawImage(image.source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("Não foi possível otimizar a imagem.")),
          "image/webp",
          0.84,
        ),
      );
      if (blob.size > MAX_STORED_IMAGE_BYTES)
        throw new Error(
          "A imagem continua muito grande. Escolha uma foto menor.",
        );
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("Não foi possível ler a imagem."));
        reader.readAsDataURL(blob);
      });
      return { source, name: file.name, size: blob.size };
    } finally {
      image.release();
    }
  }
  private read(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () =>
        reject(new Error("Não foi possível ler o arquivo."));
      reader.readAsArrayBuffer(blob);
    });
  }
  private async decode(file: File): Promise<{
    source: CanvasImageSource;
    width: number;
    height: number;
    release: () => void;
  }> {
    try {
      if (typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(file);
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          release: () => bitmap.close(),
        };
      }
      const source = URL.createObjectURL(file);
      try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error());
          image.src = source;
        });
        return {
          source: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          release: () => URL.revokeObjectURL(source),
        };
      } catch (error) {
        URL.revokeObjectURL(source);
        throw error;
      }
    } catch {
      throw new Error(
        "Não foi possível abrir esta imagem. Tente outra foto JPG, PNG ou WebP.",
      );
    }
  }
}
