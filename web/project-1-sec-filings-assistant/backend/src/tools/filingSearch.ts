import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { pool } from "../db.js";
import { embedTexts } from "../embeddings.js";

const TOP_K = 5;

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function searchFilings(query: string, ticker?: string): Promise<string> {
  const [queryEmbedding] = await embedTexts([query], "query");
  const vectorLiteral = toVectorLiteral(queryEmbedding);

  const result = ticker
    ? await pool.query(
        `SELECT ticker, company, form_type, filed_date, chunk_text
         FROM filing_chunks
         WHERE ticker = $2
         ORDER BY embedding <=> $1::vector
         LIMIT ${TOP_K}`,
        [vectorLiteral, ticker.toUpperCase()]
      )
    : await pool.query(
        `SELECT ticker, company, form_type, filed_date, chunk_text
         FROM filing_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT ${TOP_K}`,
        [vectorLiteral]
      );

  if (result.rows.length === 0) {
    return "No matching filing text found.";
  }

  return JSON.stringify(
    result.rows.map((row) => ({
      ticker: row.ticker,
      company: row.company,
      formType: row.form_type,
      filedDate: row.filed_date,
      excerpt: row.chunk_text,
    }))
  );
}

export const searchFilingsTool = tool(
  async ({ query, ticker }) => searchFilings(query, ticker),
  {
    name: "search_filing_text",
    description:
      "Search real 10-K filing text (risk factors, business description, management discussion) " +
      "for passages relevant to a qualitative question — e.g. 'what risks did they mention', " +
      "'how do they describe their competition'. Not for numeric data like revenue — use " +
      "get_company_facts for that instead.",
    schema: z.object({
      query: z.string().describe("The question or topic to search filing text for"),
      ticker: z
        .string()
        .optional()
        .describe("Optional stock ticker to narrow the search to one company, e.g. AAPL"),
    }),
  }
);
