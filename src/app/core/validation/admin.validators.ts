import {
  MAX_STORED_IMAGE_BYTES,
  matchesImageSignature,
} from "../services/image-upload.service";
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
export function isSafeImage(value: string): boolean {
  return (
    /^\/?assets\/[a-zA-Z0-9_./-]+\.(webp|png|jpe?g)$/i.test(value) ||
    /^\/api\/media\/[a-f0-9]{64}\.(webp|png|jpeg)$/.test(value) ||
    (value.startsWith("data:image/") ? isEmbeddedImage(value) : isHttps(value))
  );
}
export function isHttps(value: string): boolean {
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
export function isSafeLink(value: string): boolean {
  return /^#[a-zA-Z][\w-]*$/.test(value) || isHttps(value);
}
export const imageValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  isSafeImage(String(control.value || "").trim()) ? null : { imageUrl: true };
export const linkValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  isSafeLink(String(control.value || "").trim()) ? null : { linkUrl: true };
export const optionalHttpsValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  !control.value || isHttps(String(control.value).trim())
    ? null
    : { httpsUrl: true };

export function isEmbeddedImage(value: string): boolean {
  if (value.length > Math.ceil(MAX_STORED_IMAGE_BYTES / 3) * 4 + 32)
    return false;
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (
    !match ||
    match[2].length % 4 !== 0 ||
    match[2].length > Math.ceil(MAX_STORED_IMAGE_BYTES / 3) * 4
  )
    return false;
  const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
  if ((match[2].length / 4) * 3 - padding > MAX_STORED_IMAGE_BYTES)
    return false;
  const header = atob(match[2].slice(0, 16));
  const bytes = Uint8Array.from(header, (char) => char.charCodeAt(0));
  return matchesImageSignature(bytes, "image/" + match[1]);
}
