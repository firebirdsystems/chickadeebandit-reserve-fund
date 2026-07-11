import { describe, it, expect } from "vitest";
import {
  canManageReserve,
  fundBalanceCents,
  fundedPct,
  sortTxByDate,
  projectFundingGapCents,
} from "../src/logic.js";
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

// ── fundBalanceCents ──────────────────────────────────────────────────────────
describe("fundBalanceCents", () => {
  it("sums deposits and withdrawals (signed)", () => {
    expect(fundBalanceCents([{ amountCents: 500000 }, { amountCents: 50000 }, { amountCents: -20000 }]))
      .toBe(530000);
  });
  it("is zero for no transactions", () => {
    expect(fundBalanceCents([])).toBe(0);
    expect(fundBalanceCents(undefined)).toBe(0);
  });
  it("treats a missing amount as zero", () => {
    expect(fundBalanceCents([{}, { amountCents: 100 }])).toBe(100);
  });
});

// ── fundedPct ─────────────────────────────────────────────────────────────────
describe("fundedPct", () => {
  it("computes the percentage of the goal", () => {
    expect(fundedPct(50000, 200000)).toBe(25);
    expect(fundedPct(150000, 200000)).toBe(75);
  });
  it("clamps at 100 when over-funded", () => {
    expect(fundedPct(300000, 200000)).toBe(100);
  });
  it("returns 0 when there is no positive goal (no divide-by-zero)", () => {
    expect(fundedPct(50000, 0)).toBe(0);
    expect(fundedPct(50000, undefined)).toBe(0);
    expect(fundedPct(50000, -100)).toBe(0);
  });
});

// ── sortTxByDate ──────────────────────────────────────────────────────────────
describe("sortTxByDate", () => {
  it("orders transactions ascending by ISO date without mutating the input", () => {
    const input = [
      { id: "b", date: "2025-03-01" },
      { id: "a", date: "2025-01-01" },
      { id: "c", date: "2025-02-01" },
    ];
    const out = sortTxByDate(input);
    expect(out.map(t => t.id)).toEqual(["a", "c", "b"]);
    expect(input.map(t => t.id)).toEqual(["b", "a", "c"]); // original untouched
  });
  it("handles empty/missing input", () => {
    expect(sortTxByDate([])).toEqual([]);
    expect(sortTxByDate(undefined)).toEqual([]);
  });
});

// ── projectFundingGapCents ────────────────────────────────────────────────────
describe("projectFundingGapCents", () => {
  it("is positive when the fund falls short of the project cost", () => {
    expect(projectFundingGapCents(1000000, 600000)).toBe(400000);
  });
  it("is zero or negative when the fund fully covers the project", () => {
    expect(projectFundingGapCents(600000, 600000)).toBe(0);
    expect(projectFundingGapCents(600000, 800000)).toBe(-200000);
  });
});
