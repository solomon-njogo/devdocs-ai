/**
 * Splits source file content into semantic chunks.
 * MVP approach: split on top-level declarations using regex heuristics.
 * Respects MAX_CHUNK_TOKENS from env (default 800).
 */

import { createHash } from "crypto";

const DEFAULT_MAX_TOKENS = 800;
const APPROX_CHARS_PER_TOKEN = 4;

function getMaxChunkChars(): number {
  const envMax = process.env.MAX_CHUNK_TOKENS;
  const tokens = envMax ? parseInt(envMax, 10) || DEFAULT_MAX_TOKENS : DEFAULT_MAX_TOKENS;
  return tokens * APPROX_CHARS_PER_TOKEN;
}

export type ChunkType = "function" | "method" | "class" | "module" | "type" | "constant";

export interface RawChunk {
  chunkType: ChunkType;
  symbolName: string | null;
  parentSymbol: string | null;
  content: string;
  contentHash: string;
  startLine: number;
  endLine: number;
}

/** Hash chunk content for dedup/change detection. */
function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

const DECLARATION_PATTERNS: Array<{ pattern: RegExp; type: ChunkType }> = [
  { pattern: /^(export\s+)?(default\s+)?class\s+(\w+)/m, type: "class" },
  { pattern: /^(export\s+)?(default\s+)?(?:async\s+)?function\s+(\w+)/m, type: "function" },
  { pattern: /^(export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/m, type: "function" },
  { pattern: /^(export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/m, type: "function" },
  { pattern: /^(export\s+)?(?:interface|type)\s+(\w+)/m, type: "type" },
  { pattern: /^(export\s+)?(?:enum)\s+(\w+)/m, type: "type" },
  { pattern: /^(export\s+)?(?:const|let|var)\s+(\w+)/m, type: "constant" },
  { pattern: /^def\s+(\w+)/m, type: "function" },
  { pattern: /^class\s+(\w+)/m, type: "class" },
  { pattern: /^func\s+(\w+)/m, type: "function" },
];

/** Detect chunk type and symbol name from a code snippet. */
function classifyChunk(content: string): { type: ChunkType; symbolName: string | null } {
  for (const { pattern, type } of DECLARATION_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      const name = match[3] || match[2] || match[1] || null;
      return { type, symbolName: name && name !== "export" ? name : null };
    }
  }
  return { type: "module", symbolName: null };
}

/**
 * Split source code into semantic chunks.
 * Strategy: split at blank-line-separated top-level blocks, then further split
 * oversized blocks by line count.
 */
export function chunkFile(content: string, _language: string): RawChunk[] {
  const maxChars = getMaxChunkChars();
  const lines = content.split("\n");
  const chunks: RawChunk[] = [];

  let blockStart = 0;
  let blockLines: string[] = [];

  function flushBlock() {
    if (blockLines.length === 0) return;
    const text = blockLines.join("\n").trim();
    if (!text) {
      blockLines = [];
      return;
    }
    if (text.length <= maxChars) {
      const { type, symbolName } = classifyChunk(text);
      chunks.push({
        chunkType: type,
        symbolName,
        parentSymbol: null,
        content: text,
        contentHash: hashContent(text),
        startLine: blockStart + 1,
        endLine: blockStart + blockLines.length,
      });
    } else {
      // Split oversized block into sub-chunks
      const subSize = Math.ceil(maxChars / APPROX_CHARS_PER_TOKEN);
      for (let i = 0; i < blockLines.length; i += subSize) {
        const subLines = blockLines.slice(i, i + subSize);
        const subText = subLines.join("\n").trim();
        if (!subText) continue;
        const { type, symbolName } = classifyChunk(subText);
        chunks.push({
          chunkType: type,
          symbolName,
          parentSymbol: null,
          content: subText,
          contentHash: hashContent(subText),
          startLine: blockStart + i + 1,
          endLine: blockStart + i + subLines.length,
        });
      }
    }
    blockLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBlank = line.trim() === "";
    const prevBlank = i > 0 && lines[i - 1].trim() === "";

    if (isBlank && prevBlank && blockLines.length > 0) {
      flushBlock();
      blockStart = i + 1;
      continue;
    }

    if (blockLines.length === 0) {
      blockStart = i;
    }
    blockLines.push(line);
  }
  flushBlock();

  return chunks;
}
