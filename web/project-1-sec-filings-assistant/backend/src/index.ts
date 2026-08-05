import "dotenv/config";
import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import { runAgent } from "./agent.js";
import { createConversation, loadMessages, saveMessage } from "./conversations.js";

const app = express();
const PORT = 3001;

// Allows the React dev server (a different origin: localhost:5173) to call
// this API. Without this, the browser blocks the response before your
// frontend code ever sees it, even though the request reaches the server fine.
// FRONTEND_ORIGIN is set in the deployed environment to the CloudFront domain.
const corsOrigins = ["http://localhost:5173"];
if (process.env.FRONTEND_ORIGIN) {
  corsOrigins.push(process.env.FRONTEND_ORIGIN);
}
app.use(cors({ origin: corsOrigins }));

// Parses incoming JSON request bodies into req.body — without this,
// req.body would be undefined for a POST request with a JSON payload.
app.use(express.json());

interface ChatRequest {
  message: string;
  conversationId?: string;
}

interface ChatResponse {
  reply: string;
  conversationId: string;
}

// Claude Sonnet pricing, per million tokens — check against Anthropic's
// current published rates if these drift, this isn't read from a live
// pricing API.
const INPUT_COST_PER_MILLION_USD = 3;
const OUTPUT_COST_PER_MILLION_USD = 15;

function estimatedCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION_USD +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION_USD
  );
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/chat", async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse>) => {
  const { message, conversationId } = req.body;

  if (!message) {
    res.status(400).json({ reply: "Missing 'message' in request body", conversationId: "" });
    return;
  }

  try {
    const convId = conversationId ?? (await createConversation());
    const priorMessages = await loadMessages(convId);

    await saveMessage(convId, "user", message);
    const { reply, latencyMs, inputTokens, outputTokens } = await runAgent(priorMessages, message);
    await saveMessage(convId, "assistant", reply);

    // One structured JSON line per request. systemd appends this to
    // /var/log/sec-filings-assistant.log; the CloudWatch Agent ships that
    // file up, and a log metric filter turns these fields into real
    // CloudWatch metrics (infra/cloudwatch.tf) — this line never being on
    // the request's success/failure path is intentional, a logging issue
    // should never be able to break a chat response.
    console.log(
      JSON.stringify({
        metric: "llm_request",
        latencyMs,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimatedCostUsd(inputTokens, outputTokens),
      })
    );

    res.json({ reply, conversationId: convId });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ reply: "Something went wrong talking to the agent.", conversationId: conversationId ?? "" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
