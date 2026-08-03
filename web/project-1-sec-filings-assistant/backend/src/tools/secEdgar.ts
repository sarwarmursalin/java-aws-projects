import { tool } from "@langchain/core/tools";
import { z } from "zod";

// SEC identifies companies by a 10-digit CIK, not by ticker. Starting with
// a small hardcoded set of well-known companies — real SEC data, just a
// limited starting list. Can expand later with SEC's full company_tickers.json.
export const TICKER_TO_CIK: Record<string, string> = {
  AAPL: "0000320193",
  MSFT: "0000789019",
  AMZN: "0001018724",
  GOOGL: "0001652044",
  TSLA: "0001318605",
};

// SEC requires every request to identify the requester via User-Agent —
// requests without one get blocked. Format: "Name email@example.com".
export const SEC_USER_AGENT = "Golam Sarwar Md Mursalin sec-filings-assistant-project@example.com";

async function fetchCompanyFacts(ticker: string): Promise<string> {
  const cik = TICKER_TO_CIK[ticker.toUpperCase()];
  if (!cik) {
    return `Unknown ticker "${ticker}". Supported tickers: ${Object.keys(TICKER_TO_CIK).join(", ")}`;
  }

  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
  const response = await fetch(url, {
    headers: { "User-Agent": SEC_USER_AGENT },
  });

  if (!response.ok) {
    return `SEC API request failed: ${response.status} ${response.statusText}`;
  }

  const data = await response.json();

  // Companies switched which tag they report revenue under around 2018
  // (accounting rule change, ASC 606). Try the current tag first, fall
  // back to the older one so we cover companies on either side of the switch.
  const revenue =
    data.facts?.["us-gaap"]?.RevenueFromContractWithCustomerExcludingAssessedTax?.units?.USD ??
    data.facts?.["us-gaap"]?.Revenues?.units?.USD ??
    [];
  const netIncome = data.facts?.["us-gaap"]?.NetIncomeLoss?.units?.USD ?? [];

  const recentRevenue = extractAnnualFigures(revenue).map((e) => ({
    fiscalYear: fiscalYearLabel(e.end),
    periodEnd: e.end,
    revenueUSD: e.val,
  }));
  const recentNetIncome = extractAnnualFigures(netIncome).map((e) => ({
    fiscalYear: fiscalYearLabel(e.end),
    periodEnd: e.end,
    netIncomeUSD: e.val,
  }));

  return JSON.stringify({
    company: data.entityName,
    ticker,
    recentAnnualRevenue: recentRevenue,
    recentAnnualNetIncome: recentNetIncome,
  });
}

export interface XbrlFact {
  form: string;
  start: string; // period start date, e.g. "2022-09-25"
  end: string; // period end date, e.g. "2023-09-30" — the actual period this value covers
  val: number;
  filed: string; // date this value was filed, e.g. "2023-11-03" — used to pick the latest if the same period appears more than once (restatements)
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

// SEC's fy/fp fields describe which FILING a value came from, not which
// period it covers — a single 10-K reports the current year plus two prior
// years for comparison, sometimes under the same fy label. So we derive the
// real period from start/end dates instead of trusting fy/fp.
export function extractAnnualFigures(facts: XbrlFact[]): XbrlFact[] {
  const fullYearOnly = facts.filter((entry) => {
    if (entry.form !== "10-K" || !entry.start || !entry.end) return false;
    const durationDays =
      (new Date(entry.end).getTime() - new Date(entry.start).getTime()) / ONE_DAY_MS;
    return durationDays >= 350 && durationDays <= 380; // excludes quarterly entries
  });

  const latestByPeriod = new Map<string, XbrlFact>();
  for (const entry of fullYearOnly) {
    const existing = latestByPeriod.get(entry.end);
    if (!existing || entry.filed > existing.filed) {
      latestByPeriod.set(entry.end, entry);
    }
  }

  return Array.from(latestByPeriod.values())
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(-4);
}

// Labels a period by the calendar year its fiscal year ends in — correct
// for companies like Apple (FY ends in September): end "2023-09-30" -> FY2023.
export function fiscalYearLabel(periodEnd: string): number {
  return new Date(periodEnd).getFullYear();
}

// `tool()` wraps our plain function with the schema description the model
// reads to decide when/how to call it. The model never runs fetchCompanyFacts
// itself — it can only ask for it, our code executes it.
export const getCompanyFactsTool = tool(
  async ({ ticker }) => fetchCompanyFacts(ticker),
  {
    name: "get_company_facts",
    description:
      "Get real recent annual revenue and net income for a public company from SEC's XBRL data, given its stock ticker (e.g. AAPL, MSFT).",
    schema: z.object({
      ticker: z.string().describe("The company's stock ticker symbol, e.g. AAPL"),
    }),
  }
);
