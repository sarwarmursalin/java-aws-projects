# Project 1 (Web track) — SEC Filings Assistant

## Why I'm building this

I wanted hands-on, production-shaped experience with the stack I hadn't touched yet — React, TypeScript, Node.js — paired with the AI-agent side I already have a head start on (multi-agent orchestration, RAG, tool use from earlier work). Rather than a tutorial clone, this is a real agent that answers questions about public companies using real SEC filings, with a full AWS deployment behind it — the same "build it end-to-end, including the ops work" approach as the Java project ladder, applied to a new stack.

---

## What it does

A chat assistant that answers two kinds of questions about public companies:
- **Quantitative** ("What was Apple's revenue last quarter?") — answered via a tool call to SEC's structured XBRL data.
- **Qualitative** ("What risk factors did they cite in their last 10-K?") — answered via retrieval over real filing text (RAG).

Both use real, live SEC EDGAR data — no synthetic or hardcoded documents.

## Data sources — SEC EDGAR (two different APIs, two different jobs)

- **XBRL company-facts API** (`data.sec.gov/api/xbrl/companyfacts/CIK##########.json`) — structured financial data per company (revenue, net income, etc). Used as a **tool call** for precise numeric questions.
- **Full-text filing documents** (10-K/10-Q narrative sections) — real prose. Used as the **RAG corpus** for qualitative questions.
- **Requirements**: every request needs a `User-Agent` header identifying the requester (name + email) — SEC's fair-access policy, not optional even though there's no API key. Rate limit: 10 requests/second.

## Architecture

```
Browser (React + TS)
   │  served as static files from S3 + CloudFront   [Phase B]
   │
   │  POST /chat  (fetch, JSON)
   ▼
ALB → EC2 Auto Scaling Group                         [Phase B]
   Node.js + TypeScript (Express) backend
   │
   ▼
LangGraph agent loop
   ├─→ Anthropic API (the LLM call)
   ├─→ SEC EDGAR XBRL API   (tool: numeric company facts)
   └─→ Postgres + pgvector  (tool: semantic search over embedded filing text)

Conversation history persisted to the same Postgres (conversations/messages tables).

Separately, decoupled from the live chat path:
EventBridge (schedule) → Lambda → fetches new filings → embeds them → writes to pgvector   [Phase B]
```

## Plan — Phase A: build and prove it locally (no AWS yet)

Local-first, same reasoning as project 2: prove the app logic works before adding AWS networking into the mix, so a bug is either "my code" or "my infra," never both at once.

1. **Node + TypeScript + Express skeleton** — a bare `/chat` endpoint, no LLM yet. Concepts: Node's request/response cycle, npm vs Maven, TS types vs Java's static types.
2. **LangGraph agent + first tool** — wire in the Anthropic API and one tool: SEC EDGAR XBRL company-facts lookup. Concepts: the agent loop (message → model requests a tool → we execute it → feed the result back → model responds), tool-schema design.
3. **React + TypeScript chat UI** — minimal frontend, local dev server, calling the local backend. Concepts: components, JSX, `useState`, props, the request/response cycle from the frontend's side.
4. **Local RAG** — Postgres (via Docker) + `pgvector`; ingest real 10-K/10-Q text for a handful of companies, embed it, add a semantic-search tool. Concepts: chunking, embeddings, vector similarity search, when to use RAG vs a tool call.
5. **Persist conversation history** to the same local Postgres, instead of in-memory state.
6. **Unit tests** — SEC EDGAR client, the retrieval function, tool-selection logic (LLM calls mocked where needed).

## Plan — Phase B: deploy to AWS (its own phase, after Phase A works)

Using a separate AWS account (not the one tied to my MUN email) with a $100 free-credit allowance.

7. **VPC / ALB / Auto Scaling Group** for the backend, **RDS Postgres + pgvector** replacing the local DB, **Secrets Manager** for DB credentials and the Anthropic API key.
8. **S3 + CloudFront** for the React static build.
9. **Lambda + EventBridge** scheduled ingestion job (replaces the local ingestion script) — needs an explicit security-group rule granting it access into RDS's Postgres port.
10. **IAM least-privilege roles** throughout — no broad admin access.
11. **CloudWatch** — logs, plus custom metrics for LLM latency and cost per request.

**Cost note:** RDS + ALB running continuously cost real money on the $100 credit — tear down or stop resources between active work sessions.

## What this is meant to demonstrate

- Full-stack ownership: React/TypeScript frontend, Node.js/TypeScript backend, AWS deployment — not just one layer.
- Real agentic system design: an explicit agent loop (LangGraph), not a single prompt-and-response.
- The RAG vs tool-use distinction, applied correctly to different question types instead of forcing everything through one path.
- Real AWS engineering: networking, IAM, managed database, serverless scheduled jobs, observability — the same breadth as project 2, extended into a second, independent service (Lambda) with its own security boundary.
