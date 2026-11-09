import type {
  BackendEnvironment,
  RequestIdentity,
} from "../models/environment.ts";
import { fail } from "../http/errors.ts";
import { credentials } from "../repositories/credentials.repository.ts";
const encoder = new TextEncoder();
export const SESSION_COOKIE = "__Host-mix_admin";
export const SESSION_SECONDS = 8 * 60 * 60;
export async function digest(value: string): Promise<string> {
  return hex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
}
function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export async function passwordHash(
  password: string,
  salt: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 100000,
      salt: encoder.encode(salt),
    },
    key,
    256,
  );
  return hex(new Uint8Array(bits));
}
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const actual = await passwordHash(password, salt);
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++)
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
export function sessionToken(request: Request): string | null {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(SESSION_COOKIE + "="))
    ?.slice(SESSION_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function sessionKey(
  token: string,
  env: BackendEnvironment,
): Promise<string> {
  if (!env.SESSION_SECRET || !/^[a-f0-9]{64}$/i.test(env.SESSION_SECRET))
    fail("Segredo de sessão não configurado.", 503);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(token)),
    ),
  );
}
export function sessionCookie(token: string, maxAge = SESSION_SECONDS): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export async function passwordIdentity(
  request: Request,
  env: BackendEnvironment,
): Promise<RequestIdentity | null> {
  const token = sessionToken(request);
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(await sessionKey(token, env), Date.now())
    .first();
  if (!row) return null;
  const account = await credentials(env);
  return {
    isAdmin: true,
    signedIn: true,
    userId: "password-admin",
    email: "",
    name: account.username,
  };
}
export function newToken(): string {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}
