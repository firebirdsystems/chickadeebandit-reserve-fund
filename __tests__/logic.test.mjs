import { canManageReserve } from "../src/logic.js";
import { testPrivilegedGateContract } from "./helpers/privileged-gate.mjs";

// ── canManageReserve ──────────────────────────────────────────────────────────
// Fronts the funds / manual_tx / projects write_privileged_only policies, so it
// must satisfy the shared privileged-gate contract (mirrors the hub: no adult
// fallback when no board group is configured; dangling group is not privileged).

testPrivilegedGateContract("canManageReserve", canManageReserve, {
  member:   { id: "a1", role: "adult" },
  outsider: { id: "a3", role: "adult" },
  groups:   [{ id: "g1", memberIds: ["a1", "a2"] }],
  groupId:  "g1",
});
