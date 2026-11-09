import { test } from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../router.ts";
import { environment, request, seedState, snapshot } from "./helpers.ts";
const call = async (
  request: Request,
  env: ReturnType<typeof environment>["env"],
) => {
  const response = await handleApi(request, env);
  assert.ok(response);
  return response;
};
test("rejects anonymous/non-admin and cross-origin writes before touching storage", async () => {
  const { env, db } = environment();
  const body = { version: 0, state: seedState() };
  assert.equal((await call(request("PUT", body, false), env)).status, 401);
  assert.equal(
    (await call(request("PUT", body, true, "https://evil.test"), env)).status,
    403,
  );
  const other = request("PUT", body, false);
  other.headers.set("oai-authenticated-user-email", "admin@example.com");
  other.headers.set("oai-authenticated-user-id", "owner");
  assert.equal((await call(other, env)).status, 401);
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM catalog_metadata").get()?.[
      "count"
    ],
    0,
  );
  db.close();
});
test("stores normalized columns and detects stale writers without changing rows", async () => {
  const { env, db } = environment(),
    state = seedState();
  const updated = {
    ...state,
    bikes: state.bikes.map((bike, index) =>
      index === 0 ? { ...bike, daily: 99 } : bike,
    ),
    banners: state.banners.map((banner) => ({
      ...banner,
      title: "Salvo permanentemente",
    })),
  };
  const response = await call(
    request("PUT", { version: 0, state: updated }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal((await snapshot(response)).version, 1);
  const loaded = await snapshot(await call(request(), env));
  assert.equal(loaded.state.bikes[0]?.daily, 99);
  assert.equal(loaded.state.banners[0]?.title, "Salvo permanentemente");
  assert.equal(
    db.prepare("SELECT daily FROM motorcycles WHERE id='cg160'").get()?.[
      "daily"
    ],
    99,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM site_state").get()?.["count"],
    0,
  );
  assert.equal(
    (await call(request("PUT", { version: 0, state }), env)).status,
    409,
  );
  assert.equal(
    (await snapshot(await call(request(), env))).state.bikes[0]?.daily,
    99,
  );
  db.close();
});
test("stores raster images in R2 and serves public media with safe headers", async () => {
  const { env, db } = environment(),
    state = seedState();
  const updated = {
    ...state,
    bikes: state.bikes.map((bike, index) =>
      index === 0
        ? {
            ...bike,
            image:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jc1sAAAAASUVORK5CYII=",
          }
        : bike,
    ),
  };
  const response = await call(
    request("PUT", { version: 0, state: updated }),
    env,
  );
  assert.equal(response.status, 200);
  const result = await snapshot(response),
    image = result.state.bikes[0]?.image;
  assert.match(image || "", /^\/api\/media\/[a-f0-9]{64}\.png$/);
  const media = await call(new Request("https://mix.test" + image), env);
  assert.equal(media.status, 200);
  assert.equal(media.headers.get("content-type"), "image/png");
  assert.equal(media.headers.get("x-content-type-options"), "nosniff");
  assert.ok((await media.arrayBuffer()).byteLength > 0);
  const head = await call(
    new Request("https://mix.test" + image, { method: "HEAD" }),
    env,
  );
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  db.close();
});
test("validates unknown request bodies, prices, categories and executable URLs", async () => {
  const { env, db } = environment(),
    state = seedState();
  for (const body of [
    null,
    [],
    {},
    { version: -1, state },
    {
      version: 0,
      state: { ...state, bikes: state.bikes.map((b) => ({ ...b, daily: -1 })) },
    },
    {
      version: 0,
      state: {
        ...state,
        bikes: state.bikes.map((b) => ({ ...b, image: "javascript:alert(1)" })),
      },
    },
  ])
    assert.equal((await call(request("PUT", body ?? "null"), env)).status, 400);
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM catalog_metadata").get()?.[
      "count"
    ],
    0,
  );
  db.close();
});
test("public reads omit administrative history; authorized reads preserve it", async () => {
  const { env, db } = environment(),
    state = seedState();
  const updated = {
    ...state,
    activities: [
      {
        id: "event-1",
        type: "fleet" as const,
        title: "Moto atualizada",
        detail: "Honda CG 160",
        at: "2026-10-31T12:00:00Z",
      },
    ],
  };
  await call(request("PUT", { version: 0, state: updated }), env);
  assert.equal(
    (await snapshot(await call(request(), env))).state.activities.length,
    1,
  );
  assert.deepEqual(
    (await snapshot(await call(request("GET", undefined, false), env))).state
      .activities,
    [],
  );
  db.close();
});
test("concurrent writes using the same version have exactly one winner", async () => {
  const { env, db } = environment(),
    state = seedState();
  await call(request(), env);
  const responses = await Promise.all([
    call(
      request("PUT", {
        version: 0,
        state: {
          ...state,
          bikes: state.bikes.map((b) => ({ ...b, daily: 70 })),
        },
      }),
      env,
    ),
    call(
      request("PUT", {
        version: 0,
        state: {
          ...state,
          bikes: state.bikes.map((b) => ({ ...b, daily: 80 })),
        },
      }),
      env,
    ),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const current = await snapshot(await call(request(), env));
  assert.equal(current.version, 1);
  assert.equal(new Set(current.state.bikes.map((b) => b.daily)).size, 1);
  db.close();
});
test("a failing database statement rolls the entire save back", async () => {
  const { env, db } = environment(),
    state = seedState();
  await call(request(), env);
  db.exec(
    "CREATE TRIGGER block_banner BEFORE INSERT ON banners BEGIN SELECT RAISE(ABORT, 'test rollback'); END;",
  );
  const updated = {
    ...state,
    bikes: state.bikes.map((b) => ({ ...b, daily: 88 })),
  };
  assert.equal(
    (await call(request("PUT", { version: 0, state: updated }), env)).status,
    503,
  );
  const current = await snapshot(await call(request(), env));
  assert.equal(current.version, 0);
  assert.deepEqual(current.state, state);
  db.close();
});
