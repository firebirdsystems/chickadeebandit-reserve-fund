// Pure, browser-free logic for reserve-fund, extracted so it can be unit-tested.
// index.html imports from here; tests import from here directly.

/**
 * Whether `me` may manage the reserve fund — create/edit/delete funds, manual
 * transactions, and projects. Mirrors the server-side `write_privileged_only`
 * policy on the `funds` / `manual_tx` / `projects` tables, which is gated by the
 * configured Board group (board_group_id).
 *
 * MUST match the hub's privileged resolution exactly: privileged IFF the board
 * group is configured, still exists, and the member is in it. There is NO "all
 * adults" fallback when the group is unset or dangling — the hub rejects every
 * privileged write in that state, so management controls stay hidden here too
 * (otherwise every action would be a silent 403). Admin status alone does NOT
 * satisfy the row policy. See __tests__/helpers/privileged-gate.mjs.
 *
 * @param {object|null} me
 * @param {Array}  groups
 * @param {string|null} boardGroupId
 */
export function canManageReserve(me, groups, boardGroupId) {
  if (!me || !boardGroupId) return false;
  const g = groups.find(g => g.id === boardGroupId);
  return !!g && g.memberIds.includes(me.id);
}

/**
 * A fund's balance: the signed sum of its transactions' amountCents (deposits
 * positive, withdrawals negative). Pure core of getFundBalance, extracted so the
 * money math is unit-tested rather than living inline.
 *
 * @param {Array<{amountCents?: number}>} transactions
 * @returns {number} balance in cents
 */
export function fundBalanceCents(transactions) {
  return (transactions ?? []).reduce((s, t) => s + Number(t.amountCents || 0), 0);
}

/**
 * How funded a fund is toward its goal, as a percentage clamped at 100. Returns
 * 0 when there is no positive goal (avoids divide-by-zero). Drives the progress
 * bar; a bug here mis-sizes it.
 *
 * @param {number} balanceCents
 * @param {number} goalCents
 * @returns {number} 0..100
 */
export function fundedPct(balanceCents, goalCents) {
  const goal = Number(goalCents) || 0;
  if (goal <= 0) return 0;
  return Math.min(100, (Number(balanceCents) || 0) / goal * 100);
}

/**
 * A fund's transactions sorted ascending by ISO date string (stable for equal
 * dates). Returns a new array; does not mutate the input.
 *
 * @param {Array<{date: string}>} transactions
 */
export function sortTxByDate(transactions) {
  return [...(transactions ?? [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * A capital project's funding gap: estimated cost minus the fund's current
 * balance. Positive means a shortfall; zero or negative means fully funded.
 *
 * @param {number} estimatedCostCents
 * @param {number} balanceCents
 * @returns {number} gap in cents
 */
export function projectFundingGapCents(estimatedCostCents, balanceCents) {
  return Number(estimatedCostCents || 0) - Number(balanceCents || 0);
}
