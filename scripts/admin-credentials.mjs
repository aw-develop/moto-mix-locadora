import { pbkdf2Sync, randomBytes } from "node:crypto";

export function createAdminSecrets(username, password, confirmation) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._@-]{2,79}$/.test(username)) {
    throw new Error("O login deve ter entre 3 e 80 caracteres válidos.");
  }
  if (
    typeof password !== "string" ||
    password.length < 16 ||
    password.length > 128 ||
    !/\S/.test(password)
  ) {
    throw new Error("Escolha uma senha de 16 a 128 caracteres.");
  }
  if (password !== confirmation)
    throw new Error("A confirmação da senha não confere.");
  const salt = randomBytes(32).toString("hex");
  // The backend derives PBKDF2 using the UTF-8 salt string, not decoded hex bytes.
  const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return {
    ADMIN_USERNAME: username,
    ADMIN_PASSWORD_HASH: `${salt}:${hash}`,
    SESSION_SECRET: randomBytes(32).toString("hex"),
  };
}
