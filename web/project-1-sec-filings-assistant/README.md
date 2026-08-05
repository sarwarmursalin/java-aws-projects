# SEC Filings Assistant

A full-stack agentic RAG app that answers questions about public companies using real SEC EDGAR data — built to get hands-on, production-shaped experience with React, TypeScript, Node.js, and a full AWS deployment, alongside the AI-agent side (multi-agent orchestration, RAG, tool use) from earlier work.

## What it does

A chat assistant that answers two kinds of questions about public companies:
- **Quantitative** ("What was Apple's revenue last quarter?") — answered via a tool call to SEC's structured XBRL data.
- **Qualitative** ("What risk factors did they cite in their last 10-K?") — answered via retrieval over real filing text (RAG).

An explicit LangGraph agent loop decides which tool fits each question — not a single prompt-and-response. Both paths use real, live SEC EDGAR data, no synthetic or hardcoded documents.

## Data sources — SEC EDGAR

- **XBRL company-facts API** (`data.sec.gov/api/xbrl/companyfacts/CIK##########.json`) — structured financial data per company (revenue, net income). Used as a **tool call** for precise numeric questions.
- **Full-text filing documents** (10-K/10-Q narrative sections) — real prose, chunked and embedded for **RAG** over qualitative questions.
- Every request needs a `User-Agent` header identifying the requester — SEC's fair-access policy, not optional even without an API key.

## Architecture

```
Browser (React + TS)
   │  served as static files from S3 + CloudFront
   │
   │  POST /chat  (fetch, JSON)
   ▼
CloudFront → ALB → EC2 Auto Scaling Group
   Node.js + TypeScript (Express) backend
   │
   ▼
LangGraph agent loop
   ├─→ Anthropic API (the LLM call)
   ├─→ SEC EDGAR XBRL API   (tool: numeric company facts)
   └─→ Postgres + pgvector  (tool: semantic search over embedded filing text)

Conversation history persisted to the same Postgres (conversations/messages tables).

Decoupled from the live chat path:
EventBridge (daily schedule) → Lambda (in a NAT-Gateway-routed private subnet)
   → checks each ticker's latest 10-K, skips if already ingested
   → fetches, chunks, embeds, and writes new filings to pgvector

Observability:
App logs → CloudWatch Agent → CloudWatch Logs → metric filters
   → custom metrics (LLM latency, LLM cost per request) → CloudWatch dashboard
```

## Tech stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, TypeScript, Express, LangGraph (`createReactAgent`), Anthropic Claude
- **Data**: PostgreSQL + `pgvector`, Voyage AI embeddings
- **Infra**: Terraform — VPC, ALB, Auto Scaling Group, RDS, S3, CloudFront, Secrets Manager, IAM, Lambda, EventBridge, NAT Gateway, CloudWatch
- **Tests**: Vitest (SEC EDGAR client, chunking logic — regression tests for real bugs found during development)

## Repo layout

```
backend/    Express API + LangGraph agent + SEC EDGAR/RAG tools
frontend/   React chat UI
db/         SQL schema (pgvector table, conversations/messages)
lambda/     Standalone scheduled-ingestion Lambda handler
infra/      Terraform — all AWS infrastructure
```

## Running locally

```bash
docker compose up -d              # Postgres + pgvector
cp backend/.env.example backend/.env   # fill in ANTHROPIC_API_KEY, VOYAGE_API_KEY
cd backend && npm install && npm run ingest   # seed real filing data
npm run dev                       # backend on :3001
cd ../frontend && npm install && npm run dev  # frontend on :5173
```

## Deploying to AWS

```bash
cd infra
terraform init
terraform apply          # provisions everything: VPC → RDS → ALB/ASG → Lambda → CloudWatch
./deploy-backend.sh      # builds + uploads the backend
./deploy-frontend.sh     # builds + uploads the frontend, invalidates CloudFront
```

Torn down between work sessions (`terraform destroy`) to avoid ongoing cost — RDS, ALB, and NAT Gateway all bill continuously while running.

## What got built

- **Local-first development**: every feature (agent loop, RAG, conversation persistence) proven working locally before any AWS networking entered the picture, so a bug was always either "my code" or "my infra," never both at once.
- **Full AWS deployment**: VPC/ALB/Auto Scaling Group for the backend, RDS Postgres with `pgvector`, S3 + CloudFront for the frontend (proxying `/chat` and `/health` to the ALB to avoid a mixed-content HTTPS/HTTP problem, since the ALB has no TLS certificate).
- **Scheduled ingestion**: a Lambda, triggered daily by EventBridge, decoupled from the live request path — checks each company's latest 10-K and only does real work (fetch, chunk, embed, insert) the day a genuinely new filing appears.
- **IAM least-privilege audit**: every role scoped to exactly what it uses. One deliberate, documented exception — a hand-rolled minimal SSM policy was tried and found to break SSM Agent registration, so that one role uses AWS's managed policy instead, since guessing further against undocumented agent behavior wasn't a good trade for a personal project.
- **Observability**: structured JSON logs per chat request, shipped to CloudWatch Logs, turned into real custom metrics (LLM latency, LLM cost per request) via log metric filters, visualized on a CloudWatch dashboard.

## Real bugs found and fixed along the way

Not glossed over — these were genuine debugging, useful to be able to talk through:
- A security group's default "allow all outbound" rule is *not* auto-created by Terraform, unlike the AWS console — silently broke all outbound access (Secrets Manager, S3, SSM) until made explicit.
- Terraform's `templatefile()` only treats `${` as an escape sequence for a literal `${` — a bare `$` in a bash script passes through unescaped, causing a real syntax error until the whole script was rewritten with that in mind.
- RDS's auto-generated master password could contain characters (`? $ ( ! :`) that broke URL parsing even when correctly percent-encoded — fixed by using discrete `PGHOST`/`PGUSER`/`PGPASSWORD` env vars instead of a connection-string URL.
- Mixing a security group's inline `ingress {}` rules with a separate standalone `aws_security_group_rule` resource for the same group causes a permanent plan/apply conflict — Terraform treats the inline list as the complete authoritative set.
- A tightened IAM policy for SSM broke agent registration entirely (undocumented requirement beyond the publicly-listed minimum actions) — reverted to AWS's managed policy after direct testing confirmed it.
- The EC2 AMI filter (`al2023-ami-*`) matched both the standard and "minimal" AL2023 image names — `most_recent` silently started resolving to the minimal variant, which ships without SSM Agent and with only a 2GB root volume, breaking both SSM access and (once the CloudWatch Agent was added) disk space.

## What this is meant to demonstrate

- Full-stack ownership: React/TypeScript frontend, Node.js/TypeScript backend, AWS deployment — not just one layer.
- Real agentic system design: an explicit agent loop (LangGraph), not a single prompt-and-response.
- The RAG vs tool-use distinction, applied correctly to different question types instead of forcing everything through one path.
- Real AWS engineering: networking, IAM, a managed database, a serverless scheduled job with its own security boundary, and production observability (logs → metrics → dashboard).
