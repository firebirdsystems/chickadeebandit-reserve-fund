-- Reserve Fund Dashboard — D1 schema.
--
-- The board-managed source of truth (funds, the manual ledger, capital
-- projects) lives in these per-app tables under owner_or_visibility row
-- policies: everyone in the household may read, only the configured Board group
-- may write (see manifest.json row_policies). The board-group pointer lives in
-- `settings` under an app_config policy — writable only via the admin-only
-- /api/admin-config endpoint, so a member can't crown their own group.
--
-- The cross-app interface stays in KV (the only cross-app channel the platform
-- offers): `funds-list` (a {id,name} projection republished on each board
-- mutation) and `transactions` (the import target other apps cross-write, e.g.
-- dues-contributions allocations — now gated by manifest.export_acls).

CREATE TABLE IF NOT EXISTS app_reserve_fund__settings (
  key   TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__funds (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  goal         REAL NOT NULL DEFAULT 0,
  monthly_rate REAL NOT NULL DEFAULT 0,
  archived     INTEGER NOT NULL DEFAULT 0,
  visibility   TEXT NOT NULL DEFAULT 'everyone',
  created_by   TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__manual_tx (
  id          TEXT PRIMARY KEY,
  fund_id     TEXT NOT NULL,
  amount      REAL NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'everyone',
  created_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__projects (
  id             TEXT PRIMARY KEY,
  fund_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  estimated_cost REAL NOT NULL DEFAULT 0,
  planned_year   INTEGER NOT NULL DEFAULT 0,
  visibility     TEXT NOT NULL DEFAULT 'everyone',
  created_by     TEXT NOT NULL,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rf_manual_tx_fund ON app_reserve_fund__manual_tx (fund_id);
CREATE INDEX IF NOT EXISTS idx_rf_projects_fund  ON app_reserve_fund__projects (fund_id);
