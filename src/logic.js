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
