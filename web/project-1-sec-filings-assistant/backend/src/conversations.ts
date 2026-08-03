import { pool } from "./db.js";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
}

export async function createConversation(): Promise<string> {
  const result = await pool.query<{ id: string }>(
    "INSERT INTO conversations DEFAULT VALUES RETURNING id"
  );
  return result.rows[0].id;
}

export async function loadMessages(conversationId: string): Promise<StoredMessage[]> {
  const result = await pool.query<StoredMessage>(
    "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [conversationId]
  );
  return result.rows;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
    [conversationId, role, content]
  );
}
