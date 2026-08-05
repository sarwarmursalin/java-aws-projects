// Scheduled ingestion job (invoked by EventBridge — see infra/lambda.tf).
// Same logic as backend/src/ingest.ts, but standalone: no shared imports
// across the two deployment units, and it skips any ticker whose latest
// 10-K is already stored instead of blindly re-ingesting everything.
const { Pool } = require("pg");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { convert: htmlToText } = require("html-to-text");

const CHUNK_SIZE = 1500;
const EMBED_BATCH_SIZE = 20;
// Same conservative pacing as backend/src/embeddings.ts — Voyage's free
// tier allows 3 requests/minute.
const MIN_REQUEST_INTERVAL_MS = 21000;
const SEC_USER_AGENT = "Golam Sarwar Md Mursalin sec-filings-assistant-project@example.com";

const TICKER_TO_CIK = {
  AAPL: "0000320193",
  MSFT: "0000789019",
  AMZN: "0001018724",
  GOOGL: "0001652044",
  TSLA: "0001318605",
};

const secretsClient = new SecretsManagerClient({});
let lastVoyageRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSecretJson(secretId) {
  const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretId }));
  return JSON.parse(response.SecretString);
}

function chunkText(text) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
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

function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

async function findLatest10K(cik) {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const response = await fetch(url, { headers: { "User-Agent": SEC_USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Submissions request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();

  const recent = data.filings.recent;
  const index = recent.form.findIndex((form) => form === "10-K");
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

async function fetchFilingText(documentUrl) {
  const response = await fetch(documentUrl, { headers: { "User-Agent": SEC_USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Filing fetch failed: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  return htmlToText(html, { wordwrap: false });
}

async function embedTexts(texts, voyageApiKey) {
  const elapsed = Date.now() - lastVoyageRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastVoyageRequestAt = Date.now();

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageApiKey}`,
    },
    body: JSON.stringify({ input: texts, model: "voyage-3", input_type: "document" }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage API request failed: ${response.status} ${response.statusText} — ${body}`);
  }

  const data = await response.json();
  return data.data.map((entry) => entry.embedding);
}

async function ingestCompany(pool, voyageApiKey, ticker, cik) {
  const filing = await findLatest10K(cik);

  const existing = await pool.query(
    `SELECT 1 FROM filing_chunks WHERE ticker = $1 AND form_type = $2 AND filed_date = $3 LIMIT 1`,
    [ticker, filing.formType, filing.filedDate]
  );
  if (existing.rowCount > 0) {
    console.log(`[${ticker}] latest ${filing.formType} (filed ${filing.filedDate}) already ingested, skipping`);
    return { ticker, status: "skipped", filedDate: filing.filedDate };
  }

  console.log(`[${ticker}] new filing found (filed ${filing.filedDate}), fetching text...`);
  const text = await fetchFilingText(filing.documentUrl);
  const chunks = chunkText(text);
  console.log(`[${ticker}] split into ${chunks.length} chunks, embedding...`);

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedTexts(batch, voyageApiKey);

    for (let j = 0; j < batch.length; j++) {
      await pool.query(
        `INSERT INTO filing_chunks (ticker, company, form_type, filed_date, chunk_text, embedding)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ticker, filing.companyName, filing.formType, filing.filedDate, batch[j], toVectorLiteral(embeddings[j])]
      );
    }
    console.log(`[${ticker}] stored ${Math.min(i + EMBED_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
  }

  return { ticker, status: "ingested", filedDate: filing.filedDate, chunks: chunks.length };
}

exports.handler = async () => {
  const [dbSecret, appSecret] = await Promise.all([
    getSecretJson(process.env.DB_SECRET_ID),
    getSecretJson(process.env.APP_SECRET_ID),
  ]);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: "secfilings",
    user: dbSecret.username,
    password: dbSecret.password,
    ssl: { rejectUnauthorized: false },
  });

  const results = [];
  try {
    for (const [ticker, cik] of Object.entries(TICKER_TO_CIK)) {
      try {
        results.push(await ingestCompany(pool, appSecret.voyage_api_key, ticker, cik));
      } catch (err) {
        console.error(`[${ticker}] failed:`, err);
        results.push({ ticker, status: "error", message: err.message });
      }
    }
  } finally {
    await pool.end();
  }

  console.log("Done:", JSON.stringify(results));
  return { results };
};
