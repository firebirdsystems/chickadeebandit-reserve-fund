import { describe, it, expect } from "vitest";
import {
  canManageReserve,
  fundBalanceCents,
  fundedPct,
  sortTxByDate,
  projectFundingGapCents,
  failureLine,
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

// ── failureLine ───────────────────────────────────────────────────────────────
describe("failureLine", () => {
  const what = { action: "add the transaction", thing: "transaction" };
  const err = (props, message = "hub text") => Object.assign(new Error(message), props);

  it("says a duplicate already exists, by code or by the hub's text", () => {
    expect(failureLine(err({ status: 400, code: "UNIQUE_CONSTRAINT" }), what)).toBe("That transaction already exists.");
    expect(failureLine(err({ status: 400 }, "UNIQUE constraint failed: app_reserve_fund__manual_tx.id"), what)).toBe("That transaction already exists.");
  });
  it("says a refusal is not allowed, without naming the board", () => {
    expect(failureLine(err({ status: 403 }), what)).toBe("You don’t have permission to add the transaction.");
  });
  it("says a full household store is full", () => {
    expect(failureLine(err({ status: 507 }), what)).toBe("The household’s storage is full — free up space first.");
  });
  it("says a row that is gone has been removed", () => {
    expect(failureLine({ status: 404 }, what)).toBe("This transaction has been removed.");
  });
  it("says a conflict was someone else's change", () => {
    expect(failureLine(err({ status: 409 }), what)).toBe("This transaction was changed by someone else — check it first.");
  });
  it("asks to try again only when trying again can work", () => {
    for (const e of [err({}), err({ status: 0 }), err({ status: 400 }), err({ status: 500 }), err({ status: 503 }), null, undefined]) {
      expect(failureLine(e, what)).toBe("Couldn’t add the transaction — try again.");
    }
  });
  it("never shows the hub's own text", () => {
    for (const status of [undefined, 400, 403, 404, 409, 500, 507]) {
      expect(failureLine(err({ status }, "Table requires privileged group membership"), what)).not.toMatch(/privileged/);
    }
  });
});
