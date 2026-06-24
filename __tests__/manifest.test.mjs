import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));

const VALID_STORAGE   = ["kv", "db", "none"];
const VALID_AUDIENCES = ["everyone", "adults", "children"];

describe("manifest.json", () => {
  it("has required string fields", () => {
    for (const field of ["id", "name", "version", "description", "entrypoint", "runtime", "icon"]) {
      expect(manifest[field], `missing field: ${field}`).toBeTruthy();
    }
  });

  it("entrypoint is index.html", () => expect(manifest.entrypoint).toBe("index.html"));
  it("runtime is static",        () => expect(manifest.runtime).toBe("static"));

  it("storage is declared and valid", () => {
    expect(manifest.storage, "storage field is required").toBeTruthy();
    expect(VALID_STORAGE).toContain(manifest.storage);
  });

  it("version follows semver", () => expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/));

  it("permissions.default_audience is valid", () => {
    expect(VALID_AUDIENCES).toContain(manifest.permissions.default_audience);
  });

  it("permissions.requires_approval is boolean", () => {
    expect(typeof manifest.permissions.requires_approval).toBe("boolean");
  });

  it("data_access has reads and writes arrays", () => {
    expect(Array.isArray(manifest.data_access.reads)).toBe(true);
    expect(Array.isArray(manifest.data_access.writes)).toBe(true);
  });

  it("protects its projection and imports transactions only through the Hub ledger protocol", () => {
    expect(manifest.store_acls["funds-list"].write.require_group_setting).toMatchObject({
      settings_table: "settings",
      settings_key: "board_group_id",
    });
    expect(manifest.exports).toEqual(["funds-list"]);
    expect(manifest.row_policies.imported_tx).toMatchObject({ kind: "endpoint_only", read: "everyone" });
    expect(manifest.financial_ledger_imports.transactions).toMatchObject({
      table: "imported_tx",
      funds_table: "funds",
      allowed_source_apps: ["dues-contributions"],
    });
  });

  it("stores money as integer cents", () => {
    const migration = readFileSync(join(__dirname, "../migrations/001_init.sql"), "utf-8");
    expect(migration).toContain("goal_cents");
    expect(migration).toContain("amount_cents INTEGER");
    expect(migration).toContain("estimated_cost_cents");
    expect(migration).not.toMatch(/\bREAL\b/);
  });
});
