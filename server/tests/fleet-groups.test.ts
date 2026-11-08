import { test } from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../router.ts";
import { environment, request, seedState, snapshot } from "./helpers.ts";

test("persists card groups through D1 and public reads without merging individual motorcycle data", async () => {
  const { env, db, maximumBatch } = environment();
  try {
    const initial = seedState();
    const state = {
      ...initial,
      bikes: initial.bikes.map((bike, i) =>
        i < 2 ? { ...bike, cardGroup: "Motos para entregas" } : bike,
      ),
    };
    const saved = await handleApi(request("PUT", { version: 0, state }), env);
    assert.equal(saved?.status, 200);
    const response = await handleApi(request("GET", undefined, false), env);
    assert.ok(response);
    const loaded = await snapshot(response);
    assert.deepEqual(
      loaded.state.bikes.map((b) => b.cardGroup),
      ["Motos para entregas", "Motos para entregas", undefined],
    );
    assert.equal(loaded.state.bikes[0]?.daily, initial.bikes[0]?.daily);
    assert.equal(loaded.state.bikes[1]?.daily, initial.bikes[1]?.daily);
    assert.equal(
      db
        .prepare("SELECT card_group FROM motorcycles WHERE id=?")
        .get(initial.bikes[0]!.id)?.["card_group"],
      "Motos para entregas",
    );
    const clear = {
      ...loaded.state,
      bikes: loaded.state.bikes.map((b) => ({ ...b, cardGroup: "" })),
    };
    assert.equal(
      (await handleApi(request("PUT", { version: 1, state: clear }), env))
        ?.status,
      200,
    );
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS count FROM motorcycles WHERE card_group!=''",
        )
        .get()?.["count"],
      0,
    );
    assert.ok(maximumBatch() <= 9);
  } finally {
    db.close();
  }
});

test("rejects malformed or oversized group names without writing data", async () => {
  const { env, db } = environment();
  try {
    const initial = seedState();
    for (const cardGroup of [42, [], null, "a".repeat(81)]) {
      const state = {
        ...initial,
        bikes: initial.bikes.map((b) => ({ ...b, cardGroup })),
      };
      assert.equal(
        (await handleApi(request("PUT", { version: 0, state }), env))?.status,
        400,
      );
    }
    assert.equal(
      db.prepare("SELECT count(*) AS count FROM catalog_metadata").get()?.[
        "count"
      ],
      0,
    );
  } finally {
    db.close();
  }
});
