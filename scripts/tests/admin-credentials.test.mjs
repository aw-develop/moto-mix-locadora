import test from "node:test";
import assert from "node:assert/strict";
import { createAdminSecrets } from "../admin-credentials.mjs";
import { verifyPassword } from "../../server/auth/password.ts";
test("generates independent salts/session secrets and a hash accepted by the Worker", async () => {
  const password = "fixture-password-long";
  const first = createAdminSecrets("admin", password, password),
    second = createAdminSecrets("admin", password, password);
  assert.equal(first.ADMIN_USERNAME, "admin");
  assert.equal(await verifyPassword(password, first.ADMIN_PASSWORD_HASH), true);
  assert.equal(
    await verifyPassword("different-password", first.ADMIN_PASSWORD_HASH),
    false,
  );
  assert.notEqual(first.ADMIN_PASSWORD_HASH, second.ADMIN_PASSWORD_HASH);
  assert.notEqual(first.SESSION_SECRET, second.SESSION_SECRET);
  assert.match(first.SESSION_SECRET, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(first).includes(password));
});
test("rejects invalid initial credentials before generating secrets", () => {
  assert.throws(() =>
    createAdminSecrets("a", "long-password-fixture", "long-password-fixture"),
  );
  assert.throws(() => createAdminSecrets("admin", "short", "short"));
  assert.throws(() =>
    createAdminSecrets(
      "admin",
      "long-password-fixture",
      "different-confirmation",
    ),
  );
});
