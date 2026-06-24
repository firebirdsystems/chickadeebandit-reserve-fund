-- Reserve Fund Dashboard — D1 schema.
--
-- The board-managed source of truth (funds, the manual ledger, capital
-- projects) lives in these per-app tables under owner_or_visibility row
-- policies: everyone in the household may read, only the configured Board group
-- may write (see manifest.json row_policies). The board-group pointer lives in
-- `settings` under an app_config policy — writable only via the admin-only
-- /api/admin-config endpoint, so a member can't crown their own group.
--
-- `funds-list` remains a Board-write-protected KV projection for discovery by
-- other apps. Imported transactions are authoritative D1 rows written only by
-- the Hub finance protocol and deduplicated by source reference.

CREATE TABLE IF NOT EXISTS app_reserve_fund__settings (
  key   TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__funds (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  goal_cents   INTEGER NOT NULL DEFAULT 0 CHECK (goal_cents >= 0),
  monthly_rate_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_rate_cents >= 0),
  archived     INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  visibility   TEXT NOT NULL DEFAULT 'everyone' CHECK (visibility = 'everyone'),
  created_by   TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__manual_tx (
  id          TEXT PRIMARY KEY,
  fund_id     TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents <> 0),
  description TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'everyone' CHECK (visibility = 'everyone'),
  created_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (fund_id) REFERENCES app_reserve_fund__funds(id)
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__projects (
  id             TEXT PRIMARY KEY,
  fund_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (estimated_cost_cents >= 0),
  planned_year   INTEGER NOT NULL CHECK (planned_year BETWEEN 2000 AND 2200),
  visibility     TEXT NOT NULL DEFAULT 'everyone' CHECK (visibility = 'everyone'),
  created_by     TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  FOREIGN KEY (fund_id) REFERENCES app_reserve_fund__funds(id)
);

CREATE TABLE IF NOT EXISTS app_reserve_fund__imported_tx (
  id             TEXT PRIMARY KEY,
  source_app_id  TEXT NOT NULL,
  source_ref_id  TEXT NOT NULL,
  operation      TEXT NOT NULL CHECK (operation IN ('payment', 'reversal')),
  fund_id        TEXT NOT NULL,
  amount_cents   INTEGER NOT NULL CHECK (amount_cents <> 0),
  description    TEXT NOT NULL DEFAULT '',
  effective_date TEXT NOT NULL,
  posted_by_id   TEXT NOT NULL,
  posted_at      TEXT NOT NULL,
  FOREIGN KEY (fund_id) REFERENCES app_reserve_fund__funds(id),
  UNIQUE (source_app_id, source_ref_id, fund_id, operation)
);

CREATE INDEX IF NOT EXISTS idx_rf_manual_tx_fund ON app_reserve_fund__manual_tx (fund_id);
CREATE INDEX IF NOT EXISTS idx_rf_projects_fund  ON app_reserve_fund__projects (fund_id);
CREATE INDEX IF NOT EXISTS idx_rf_imported_tx_fund ON app_reserve_fund__imported_tx (fund_id);
