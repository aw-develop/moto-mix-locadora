import { test } from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../router.ts";
import { environment, request, seedState, snapshot } from "./helpers.ts";

test("rental conditions survive D1 saves, are public and can be cleared without changing other settings", async () => {
  const { env, db, maximumBatch } = environment();
  try {
    const state = seedState();
    const rentalConditions = { dailyPlan: "Retirada combinada", weeklyPlan: "Renovação sob consulta", deposit: "Caução a confirmar", documents: "Documentos da empresa", coverage: "Conforme contrato", included: "Manutenção conforme plano" };
    const updated = { ...state, settings: { ...state.settings, rentalConditions } };
    assert.equal((await handleApi(request("PUT", { version: 0, state: updated }), env))?.status, 200);
    const loaded = await snapshot((await handleApi(request("GET", undefined, false), env))!);
    assert.deepEqual(loaded.state.settings.rentalConditions, rentalConditions);
    const row = db.prepare("SELECT rental_conditions FROM site_settings WHERE id='main'").get();
    assert.deepEqual(JSON.parse(row?.["rental_conditions"] as string), rentalConditions);
    const cleared = { ...loaded.state, settings: state.settings };
    assert.equal((await handleApi(request("PUT", { version: 1, state: cleared }), env))?.status, 200);
    const reloaded = await snapshot((await handleApi(request("GET", undefined, false), env))!);
    assert.deepEqual(reloaded.state.settings, state.settings);
    assert.ok(maximumBatch() <= 9);
  } finally { db.close(); }
});

test("invalid conditions and anonymous changes never write to D1", async () => {
  const { env, db } = environment();
  try {
    const state = seedState();
    for (const rentalConditions of [null, [], { dailyPlan: "a".repeat(801) }, { dailyPlan: 42 }]) {
      assert.equal((await handleApi(request("PUT", { version: 0, state: { ...state, settings: { ...state.settings, rentalConditions } } }), env))?.status, 400);
    }
    assert.equal((await handleApi(request("PUT", { version: 0, state }, false), env))?.status, 401);
    assert.equal(db.prepare("SELECT count(*) AS count FROM catalog_metadata").get()?.["count"], 0);
  } finally { db.close(); }
});
