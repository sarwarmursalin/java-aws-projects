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
    const reply = await runAgent(priorMessages, message);
    await saveMessage(convId, "assistant", reply);

    res.json({ reply, conversationId: convId });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ reply: "Something went wrong talking to the agent.", conversationId: conversationId ?? "" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
