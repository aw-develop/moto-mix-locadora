import { createHmac, pbkdf2Sync } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import type { BackendEnvironment } from "../models/environment.ts";
import type { CatalogState } from "../models/catalog.ts";
import seed from "../seed.json" with { type: "json" };
import { catalogState } from "../validation/catalog.ts";
export const seedState = (): CatalogState =>
  catalogState(structuredClone(seed));
interface TestResult {
  success: true;
  results: Record<string, unknown>[];
  meta: { changes: number };
}
class Statement {
  readonly sql: string;
  private readonly db: DatabaseSync;
  private readonly parameters: SQLInputValue[];
  constructor(db: DatabaseSync, sql: string, parameters: SQLInputValue[] = []) {
    this.db = db;
    this.sql = sql;
    this.parameters = parameters;
  }
  bind(...values: SQLInputValue[]): Statement {
    return new Statement(this.db, this.sql, values);
  }
  async first(): Promise<Record<string, unknown> | null> {
    return this.db.prepare(this.sql).get(...this.parameters) || null;
  }
  execute(): TestResult {
    const results = this.db.prepare(this.sql).all(...this.parameters);
    const change = this.db.prepare("SELECT changes() AS count").get();
    return {
      success: true,
      results,
      meta: { changes: Number(change?.["count"] ?? 0) },
    };
  }
}
const fixtureToken = "a".repeat(64);
const fixtureSecret = "b".repeat(64);
const fixtureHash =
  "fixture-salt:" +
  pbkdf2Sync("fixture-password", "fixture-salt", 100000, 32, "sha256").toString(
    "hex",
  );
export function environment(options: { authenticated?: boolean } = {}) {
  const db = new DatabaseSync(":memory:");
  for (const filename of readdirSync(new URL("../../drizzle/", import.meta.url))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    db.exec(
      readFileSync(
        new URL("../../drizzle/" + filename, import.meta.url),
        "utf8",
      ),
    );
  const files = new Map<
    string,
    {
      body: Uint8Array;
      httpMetadata: { contentType: string };
      httpEtag: string;
    }
  >();
  let maximumBatch = 0;
  let beforeBatch: (() => void) | undefined;
  const binding = {
    prepare: (sql: string) => new Statement(db, sql),
    batch: async (statements: Statement[]) => {
      const hook = beforeBatch;
      beforeBatch = undefined;
      hook?.();
      maximumBatch = Math.max(maximumBatch, statements.length);
      db.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((statement) => statement.execute());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
  const env = {
    SESSION_SECRET: fixtureSecret,
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH: fixtureHash,
    DB: binding,
    BUCKET: {
      put: async (
        key: string,
        body: Uint8Array,
        metadata: { httpMetadata: { contentType: string } },
      ) =>
        files.set(key, {
          body,
          httpMetadata: metadata.httpMetadata,
          httpEtag: '"test-etag"',
        }),
      get: async (key: string) => files.get(key) || null,
    },
  } as unknown as BackendEnvironment;
  if (options.authenticated !== false) {
    db.prepare(
      "INSERT INTO admin_credentials(id,username,password_hash,revision) VALUES('main','admin',?,'fixture-revision')",
    ).run(fixtureHash);
    db.prepare(
      "INSERT INTO admin_sessions(token_hash,expires_at) VALUES(?,?)",
    ).run(
      createHmac("sha256", fixtureSecret).update(fixtureToken).digest("hex"),
      Date.now() + 3600000,
    );
  }
  return {
    env,
    db,
    files,
    beforeBatch: (hook: () => void) => {
      beforeBatch = hook;
    },
    maximumBatch: () => maximumBatch,
    legacy: (
      state: CatalogState,
      version = 7,
      updatedAt = "2026-10-31T12:00:00Z",
    ) =>
      db
        .prepare(
          "INSERT INTO site_state (id, payload, version, updated_at) VALUES ('main', ?, ?, ?)",
        )
        .run(JSON.stringify(state), version, updatedAt),
  };
}
export function request(
  method = "GET",
  body?: unknown,
  admin = true,
  origin = "https://mix.test",
): Request {
  return new Request("https://mix.test/api/state", {
    method,
    headers: {
      ...(admin
        ? {
            cookie: "__Host-mix_admin=" + fixtureToken,
          }
        : {}),
      ...(body ? { "content-type": "application/json", origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
export async function snapshot(
  response: Response,
): Promise<{ state: CatalogState; version: number; updatedAt: string | null }> {
  return (await response.json()) as {
    state: CatalogState;
    version: number;
    updatedAt: string | null;
  };
}
