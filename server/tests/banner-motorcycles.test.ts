import { test } from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../router.ts";
import { environment, request, seedState, snapshot } from "./helpers.ts";

test("persists an ordered group of motorcycles without a background and exposes it publicly", async () => {
  const { env, db, maximumBatch } = environment();
  try {
    const initial = seedState();
    const ids = initial.bikes
      .slice(0, 2)
      .map((bike) => bike.id)
      .reverse();
    const state = {
      ...initial,
      banners: [{ ...initial.banners[0]!, image: "", motorcycleIds: ids }],
    };
    const saved = await handleApi(request("PUT", { version: 0, state }), env);
    assert.equal(saved?.status, 200);
    const response = await handleApi(request("GET", undefined, false), env);
    assert.ok(response);
    const loaded = await snapshot(response);
    assert.deepEqual(loaded.state.banners[0]?.motorcycleIds, ids);
    assert.equal(loaded.state.banners[0]?.image, "");
    assert.deepEqual(
      JSON.parse(
        String(
          db.prepare("SELECT motorcycle_ids FROM banners").get()?.[
            "motorcycle_ids"
          ],
        ),
      ),
      ids,
    );
    assert.ok(maximumBatch() <= 9);
  } finally {
    db.close();
  }
});

test("rejects duplicate, excessive, malformed and missing motorcycle references before saving", async () => {
  const { env, db } = environment();
  try {
    const state = seedState(),
      id = state.bikes[0]!.id;
    for (const motorcycleIds of [
      [id, id],
      ["missing"],
      Array.from({ length: 7 }, (_, i) => String(i)),
      [null],
      "not-an-array",
    ]) {
      const next = {
        ...state,
        banners: [{ ...state.banners[0], motorcycleIds }],
      };
      assert.equal(
        (await handleApi(request("PUT", { version: 0, state: next }), env))
          ?.status,
        400,
      );
    }
    assert.equal(
      (
        await handleApi(
          request("PUT", {
            version: 0,
            state: {
              ...state,
              banners: [{ ...state.banners[0], image: "", motorcycleIds: [] }],
            },
          }),
          env,
        )
      )?.status,
      400,
    );
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
