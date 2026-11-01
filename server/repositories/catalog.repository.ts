import type { CatalogSnapshot, CatalogState } from "../models/catalog.ts";
import seed from "../seed.json" with { type: "json" };
import { catalogState } from "../validation/catalog.ts";
import { fail } from "../http/errors.ts";
import {
  decodeMotorcycles,
  replaceMotorcycles,
  selectMotorcycles,
} from "./motorcycles.repository.ts";
import {
  decodeBanners,
  replaceBanners,
  selectBanners,
} from "./banners.repository.ts";
import {
  decodeSettings,
  replaceSettings,
  selectSettings,
} from "./settings.repository.ts";
import {
  decodeActivities,
  replaceActivities,
  selectActivities,
} from "./activities.repository.ts";
import { resultRows } from "./sql.ts";
interface MetadataRow {
  version: number;
  updated_at: string | null;
}
interface LegacyRow {
  payload: string;
  version: number;
  updated_at: string;
}
const conflict =
  "Outro dispositivo atualizou os dados. Recarregue antes de salvar novamente.";
export class CatalogRepository {
  private readonly db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }
  private contentStatements(
    state: CatalogState,
    token: string,
  ): D1PreparedStatement[] {
    return [
      ...replaceMotorcycles(this.db, state.bikes, token),
      ...replaceBanners(this.db, state.banners, token),
      ...replaceSettings(this.db, state.settings, token),
      ...replaceActivities(this.db, state.activities, token),
    ];
  }
  /** Data-only backfill, outside schema migrations. A unique token makes concurrent initialization idempotent. */
  async ensureInitialized(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await this.db
        .prepare("SELECT version FROM catalog_metadata WHERE id = 'main'")
        .first<MetadataRow>();
      if (existing) return;
      const legacy = await this.db
        .prepare(
          "SELECT payload, version, updated_at FROM site_state WHERE id = 'main'",
        )
        .first<LegacyRow>();
      // Parsing errors abort the backfill and preserve the original payload.
      const state = catalogState(
        legacy
          ? (JSON.parse(legacy.payload) as unknown)
          : structuredClone(seed),
      );
      const token = crypto.randomUUID();
      // If a legacy writer changes the snapshot before the transaction starts, retry with that newer version.
      const guard = legacy
        ? "EXISTS (SELECT 1 FROM site_state WHERE id = 'main' AND version = ?)"
        : "NOT EXISTS (SELECT 1 FROM site_state WHERE id = 'main')";
      const insert = this.db.prepare(
        `INSERT INTO catalog_metadata (id, version, updated_at, write_token) SELECT 'main', ?, ?, ? WHERE ${guard} ON CONFLICT(id) DO NOTHING`,
      );
      const parameters = legacy
        ? [legacy.version, legacy.updated_at, token, legacy.version]
        : [0, null, token];
      const results = await this.db.batch([
        insert.bind(...parameters),
        ...this.contentStatements(state, token),
      ]);
      if (results[0]?.meta.changes === 1) return;
    }
    // A concurrent initializer may have won the final attempt.
    if (
      await this.db
        .prepare("SELECT version FROM catalog_metadata WHERE id = 'main'")
        .first()
    )
      return;
    fail("O cadastro está sendo atualizado. Tente carregar novamente.", 503);
  }
  async load(): Promise<CatalogSnapshot> {
    await this.ensureInitialized();
    const results = await this.db.batch([
      this.db.prepare(
        "SELECT version, updated_at FROM catalog_metadata WHERE id = 'main'",
      ),
      selectMotorcycles(this.db),
      selectBanners(this.db),
      selectSettings(this.db),
      selectActivities(this.db),
    ]);
    const metadata = resultRows<MetadataRow>(results[0])[0];
    if (!metadata) throw new Error("Catalog metadata missing");
    return {
      version: metadata.version,
      updatedAt: metadata.updated_at,
      state: {
        bikes: decodeMotorcycles(results[1]),
        banners: decodeBanners(results[2]),
        settings: decodeSettings(results[3]),
        activities: decodeActivities(results[4]),
        visits: 0,
      },
    };
  }
  async save(
    state: CatalogState,
    expectedVersion: number,
  ): Promise<CatalogSnapshot> {
    await this.ensureInitialized();
    const token = crypto.randomUUID(),
      now = new Date().toISOString();
    const results = await this.db.batch([
      this.db
        .prepare(
          "UPDATE catalog_metadata SET version = version + 1, updated_at = ?, write_token = ? WHERE id = 'main' AND version = ?",
        )
        .bind(now, token, expectedVersion),
      ...this.contentStatements(state, token),
    ]);
    // Every statement is guarded by the same token; a stale writer cannot delete or insert any rows.
    if (results[0]?.meta.changes !== 1) fail(conflict, 409);
    return { state, version: expectedVersion + 1, updatedAt: now };
  }
}
