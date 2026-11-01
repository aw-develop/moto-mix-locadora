import { test } from "node:test";
import assert from "node:assert/strict";
import { CatalogRepository } from "../repositories/catalog.repository.ts";
import { environment, seedState } from "./helpers.ts";
test("backfills legacy data once, preserving values, ordering, version and backup", async () => {
  const context = environment(),
    state = seedState();
  const legacy = {
    ...state,
    bikes: [...state.bikes].reverse().map((b) => ({ ...b, daily: 57.35 })),
    banners: [
      { ...state.banners[0]!, title: "Campanha antiga salva", order: 0 },
    ],
    settings: {
      ...state.settings,
      address: "Rua preservada, 123",
      instagram: "https://instagram.com/mix",
    },
  };
  context.legacy(legacy, 42);
  const repository = new CatalogRepository(context.env.DB);
  const first = await repository.load();
  assert.deepEqual(first.state, legacy);
  assert.equal(first.version, 42);
  assert.equal(first.updatedAt, "2026-10-31T12:00:00Z");
  assert.deepEqual((await repository.load()).state, legacy);
  await repository.save({ ...legacy, bikes: [], banners: [] }, 42);
  assert.deepEqual((await repository.load()).state.bikes, []);
  assert.deepEqual((await repository.load()).state.banners, []);
  const original = context.db
    .prepare("SELECT payload, version FROM site_state WHERE id='main'")
    .get();
  assert.equal(original?.["payload"], JSON.stringify(legacy));
  assert.equal(original?.["version"], 42);
  context.db.close();
});
test("concurrent initialization is idempotent and bounded in statement count", async () => {
  const { env, db, maximumBatch } = environment();
  const a = new CatalogRepository(env.DB),
    b = new CatalogRepository(env.DB);
  const results = await Promise.all([a.load(), b.load()]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM motorcycles").get()?.["count"],
    3,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM site_settings").get()?.["count"],
    1,
  );
  assert.ok(maximumBatch() <= 9);
  db.close();
});
test("malformed legacy JSON never gets silently replaced with seed data", async () => {
  const { env, db } = environment();
  db.prepare("INSERT INTO site_state VALUES ('main', ?, 8, ?)").run(
    "{broken",
    "2026-10-31T12:00:00Z",
  );
  await assert.rejects(() => new CatalogRepository(env.DB).load());
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM catalog_metadata").get()?.[
      "count"
    ],
    0,
  );
  assert.equal(
    db.prepare("SELECT payload FROM site_state").get()?.["payload"],
    "{broken",
  );
  db.close();
});
test("backfill retries when a legacy writer changes data before the transaction", async () => {
  const context = environment(),
    state = seedState();
  context.legacy(state, 7);
  const newer = {
    ...state,
    settings: {
      ...state.settings,
      address: "Endereço atualizado durante a conversão",
    },
  };
  context.beforeBatch(() =>
    context.db
      .prepare("UPDATE site_state SET payload=?, version=8 WHERE id='main'")
      .run(JSON.stringify(newer)),
  );
  const loaded = await new CatalogRepository(context.env.DB).load();
  assert.equal(loaded.version, 8);
  assert.deepEqual(loaded.state, newer);
  context.db.close();
});
