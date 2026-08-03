import { describe, it, expect } from "vitest";
import { chunkText } from "./ingest.js";

describe("chunkText", () => {
  it("keeps a short text as a single chunk", () => {
    const text = "Paragraph one.\n\nParagraph two.";
    expect(chunkText(text)).toEqual([text]);
  });

  it("does not split a chunk in the middle of a paragraph", () => {
    const paragraph = "a".repeat(2000); // longer than CHUNK_SIZE on its own
    const result = chunkText(`${paragraph}\n\nshort paragraph`);

    // the oversized paragraph stays intact as its own chunk rather than being cut
    expect(result[0]).toBe(paragraph);
  });

  it("packs multiple small paragraphs into one chunk until the size target is hit", () => {
    const paragraphs = Array.from({ length: 5 }, (_, i) => `paragraph ${i}`.repeat(20));
    const result = chunkText(paragraphs.join("\n\n"));

    // small paragraphs should be combined, not one chunk per paragraph
    expect(result.length).toBeLessThan(paragraphs.length);
  });

  it("returns an empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("ignores blank paragraphs between real ones", () => {
    const result = chunkText("first\n\n\n\nsecond");
    expect(result).toEqual(["first\n\nsecond"]);
  });
});
