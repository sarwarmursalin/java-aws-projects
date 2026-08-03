import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";

// Same shape as the backend's ChatRequest/ChatResponse — kept in sync by
// hand for now since this is a small project; a shared types package would
// be worth adding if the contract grows.
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Local dev talks to the backend on a different port (localhost:3001).
// In production, CloudFront proxies /chat and /health to the backend on
// the same origin the frontend is served from, so an empty string (a
// relative path) is correct there — avoids mixed-content issues from an
// HTTPS page calling an HTTP-only ALB directly.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.PROD ? "" : "http://localhost:3001");

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, conversationId }),
      });
      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: could not reach the backend." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewConversation() {
    setMessages([]);
    setConversationId(null);
  }

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "40px auto",
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0 }}>SEC Filings Assistant</h1>
        <button
          onClick={handleNewConversation}
          disabled={messages.length === 0}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: messages.length === 0 ? "default" : "pointer",
            color: messages.length === 0 ? "#aaa" : "#1a1a1a",
          }}
        >
          New conversation
        </button>
      </div>

      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 12,
          padding: 16,
          minHeight: 360,
          maxHeight: 480,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#888" }}>Ask about a public company's financials or filings.</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 14,
                background: msg.role === "user" ? "#2563eb" : "#fff",
                color: msg.role === "user" ? "#fff" : "#1a1a1a",
                border: msg.role === "assistant" ? "1px solid #e0e0e0" : "none",
                lineHeight: 1.5,
              }}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", margin: "10px 0" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background: "#fff",
                border: "1px solid #e0e0e0",
                color: "#888",
              }}
            >
              Thinking…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. What was Apple's revenue last year?"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: isLoading ? "#93c5fd" : "#2563eb",
            color: "#fff",
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
