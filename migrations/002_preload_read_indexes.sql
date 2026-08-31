-- Index the manifest `preload` read, which the hub runs server-side while
-- rendering this app's document — on every launch, for every household.
--
-- Both preload reads sorted their whole table under a LIMIT.
CREATE INDEX IF NOT EXISTS app_reserve_fund__funds_created_idx
  ON app_reserve_fund__funds (created_at ASC);
CREATE INDEX IF NOT EXISTS app_reserve_fund__projects_created_idx
  ON app_reserve_fund__projects (created_at DESC);
