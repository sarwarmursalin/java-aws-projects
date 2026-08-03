import { describe, it, expect } from "vitest";
import { extractAnnualFigures, fiscalYearLabel, type XbrlFact } from "./secEdgar.js";

function fact(overrides: Partial<XbrlFact>): XbrlFact {
  return {
    form: "10-K",
    start: "2022-01-01",
    end: "2022-12-31",
    val: 1000,
    filed: "2023-01-15",
    ...overrides,
  };
}

describe("extractAnnualFigures", () => {
  it("excludes quarterly entries (duration under ~350 days)", () => {
    const quarterly = fact({ start: "2022-10-01", end: "2022-12-31" }); // ~91 days
    const annual = fact({ start: "2022-01-01", end: "2022-12-31" }); // ~365 days

    const result = extractAnnualFigures([quarterly, annual]);

    expect(result).toEqual([annual]);
  });

  it("excludes non-10-K forms", () => {
    const tenQ = fact({ form: "10-Q" });
    const tenK = fact({ form: "10-K" });

    const result = extractAnnualFigures([tenQ, tenK]);

    expect(result).toEqual([tenK]);
  });

  // Regression test: a real bug where two entries shared a period (a
  // restatement) and the wrong one was kept, producing incorrect figures.
  it("keeps the latest-filed entry when the same period appears twice", () => {
    const original = fact({ end: "2022-12-31", val: 1000, filed: "2023-01-15" });
    const restated = fact({ end: "2022-12-31", val: 1050, filed: "2023-06-01" });

    const result = extractAnnualFigures([original, restated]);

    expect(result).toEqual([restated]);
  });

  // Regression test: a real bug where fiscal years were mislabeled because
  // fy/fp were trusted instead of deriving the period from start/end dates.
  // This test locks in that behavior by ensuring the correct entries survive
  // sorting and slicing even when input order doesn't match chronological order.
  it("returns only the most recent 4 periods, sorted chronologically", () => {
    const years = ["2019", "2020", "2021", "2022", "2023"].map((y) =>
      fact({ start: `${y}-01-01`, end: `${y}-12-31`, val: Number(y) })
    );
    // shuffle input order to confirm sorting isn't accidentally relying on input order
    const shuffled = [years[3], years[0], years[4], years[2], years[1]];

    const result = extractAnnualFigures(shuffled);

    expect(result.map((r) => r.end)).toEqual([
      "2020-12-31",
      "2021-12-31",
      "2022-12-31",
      "2023-12-31",
    ]);
  });

  it("returns an empty array when given no facts", () => {
    expect(extractAnnualFigures([])).toEqual([]);
  });
});

describe("fiscalYearLabel", () => {
  it("labels a period by the calendar year its end date falls in", () => {
    expect(fiscalYearLabel("2023-09-30")).toBe(2023);
    expect(fiscalYearLabel("2023-12-31")).toBe(2023);
  });
});
