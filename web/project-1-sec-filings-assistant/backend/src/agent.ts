import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getCompanyFactsTool } from "./tools/secEdgar.js";
import { searchFilingsTool } from "./tools/filingSearch.js";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Without this, the model will happily blend real tool results with
// numbers it recalls from training data, presented with equal confidence —
// the exact "prompt reliability" failure mode that matters in production.
const SYSTEM_PROMPT =
  "You answer questions about public companies using two tools: " +
  "get_company_facts for numeric data (revenue, net income), and " +
  "search_filing_text for qualitative questions (risk factors, business description, " +
  "management discussion) grounded in real 10-K filing excerpts. " +
  "Only state facts that came from one of these tools' output. " +
  "Never use figures or claims from your own training data, even if you recall them confidently. " +
  "If a tool's data doesn't cover what was asked, say so explicitly instead of filling the " +
  "gap with a remembered answer.";

// createReactAgent builds the whole "message -> maybe call a tool -> feed
// result back -> respond" loop for us. We just hand it the model and the
// list of tools it's allowed to use.
export const agent = createReactAgent({
  llm: model,
  tools: [getCompanyFactsTool, searchFilingsTool],
});

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResult {
  reply: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

export async function runAgent(
  priorMessages: HistoryMessage[],
  userMessage: string
): Promise<AgentResult> {
  // Typed explicitly (rather than left to be inferred from the array
  // literal) — inferring it produced a tuple type that TypeScript matched
  // against the wrong arm of LangChain's message union, requiring a `type`
  // field our plain {role, content} objects don't have.
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...priorMessages,
    { role: "user", content: userMessage },
  ];

  const startedAt = Date.now();
  const result = await agent.invoke({ messages });
  const latencyMs = Date.now() - startedAt;

  // The react loop can call the model more than once per request (e.g. a
  // tool call, then a follow-up response using the tool's result) — sum
  // usage across every AI message, not just the last one, for an accurate
  // per-request total.
  let inputTokens = 0;
  let outputTokens = 0;
  for (const message of result.messages) {
    const usage = (message as { usage_metadata?: { input_tokens?: number; output_tokens?: number } })
      .usage_metadata;
    if (usage) {
      inputTokens += usage.input_tokens ?? 0;
      outputTokens += usage.output_tokens ?? 0;
    }
  }

  const lastMessage = result.messages[result.messages.length - 1];
  const reply = typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);

  return { reply, latencyMs, inputTokens, outputTokens };
}
