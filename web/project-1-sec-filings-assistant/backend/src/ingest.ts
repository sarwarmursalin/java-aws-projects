import "dotenv/config";
import { convert as htmlToText } from "html-to-text";
import { pool } from "./db.js";
import { embedTexts } from "./embeddings.js";
import { TICKER_TO_CIK, SEC_USER_AGENT } from "./tools/secEdgar.js";

const CHUNK_SIZE = 1500;
const EMBED_BATCH_SIZE = 20;

interface FilingRef {
  companyName: string;
  formType: string;
  filedDate: string;
  documentUrl: string;
}

async function findLatest10K(cik: string): Promise<FilingRef> {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const response = await fetch(url, { headers: { "User-Agent": SEC_USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Submissions request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();

  const recent = data.filings.recent;
  const index = recent.form.findIndex((form: string) => form === "10-K");
  if (index === -1) {
    throw new Error("No 10-K found in recent filings");
  }

  const accessionNoDashes = recent.accessionNumber[index].replace(/-/g, "");
  const cikNoLeadingZeros = String(Number(cik));
  const documentUrl = `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionNoDashes}/${recent.primaryDocument[index]}`;

  return {
    companyName: data.name,
    formType: recent.form[index],
    filedDate: recent.filingDate[index],
    documentUrl,
  };
}

async function fetchFilingText(documentUrl: string): Promise<string> {
  const response = await fetch(documentUrl, { headers: { "User-Agent": SEC_USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Filing fetch failed: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  return htmlToText(html, { wordwrap: false });
}

// Splits on paragraph breaks and packs paragraphs into ~CHUNK_SIZE pieces,
// so a chunk never cuts a sentence in half.
export function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current);
      current = "";
    }
    current += (current ? "\n\n" : "") + paragraph;
  }
  if (current) chunks.push(current);

  return chunks;
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function ingestCompany(ticker: string, cik: string): Promise<void> {
  console.log(`[${ticker}] finding latest 10-K...`);
  const filing = await findLatest10K(cik);

  console.log(`[${ticker}] fetching filing text (filed ${filing.filedDate})...`);
  const text = await fetchFilingText(filing.documentUrl);

  const chunks = chunkText(text);
  console.log(`[${ticker}] split into ${chunks.length} chunks, embedding...`);

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedTexts(batch, "document");

    for (let j = 0; j < batch.length; j++) {
      await pool.query(
        `INSERT INTO filing_chunks (ticker, company, form_type, filed_date, chunk_text, embedding)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          ticker,
          filing.companyName,
          filing.formType,
          filing.filedDate,
          batch[j],
          toVectorLiteral(embeddings[j]),
        ]
      );
    }
    console.log(`[${ticker}] stored ${Math.min(i + EMBED_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
  }
}

async function main() {
  for (const [ticker, cik] of Object.entries(TICKER_TO_CIK)) {
    await ingestCompany(ticker, cik);
  }
  await pool.end();
  console.log("Done.");
}

// Only run the pipeline when this file is executed directly (`npm run ingest`),
// not when something imports from it (like the test file importing chunkText).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
