/**
 * CIE (Codebase Intelligence Engine) types.
 * Rows for indexed_files, code_chunks, symbols, file_dependencies.
 */

/** Tracked source file within a project. */
export interface IndexedFile {
  id: string;
  projectId: string;
  filePath: string;
  language: string | null;
  fileSha: string;
  sizeBytes: number | null;
  chunkCount: number;
  indexedAt: string;
}

export type ChunkType = "function" | "method" | "class" | "module" | "type" | "constant";

/** Semantic code chunk with optional embedding vector. */
export interface CodeChunk {
  id: string;
  projectId: string;
  fileId: string | null;
  filePath: string;
  language: string;
  chunkType: ChunkType;
  symbolName: string | null;
  parentSymbol: string | null;
  content: string;
  contentHash: string;
  startLine: number | null;
  endLine: number | null;
  tokenCount: number | null;
  embedding?: number[];
  createdAt: string;
}

export type SymbolKind =
  | "function"
  | "method"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "constant"
  | "variable";

/** Extracted symbol from source code. */
export interface Symbol {
  id: string;
  projectId: string;
  filePath: string;
  name: string;
  kind: SymbolKind;
  parentName: string | null;
  signature: string | null;
  docstring: string | null;
  startLine: number | null;
  endLine: number | null;
  isExported: boolean;
}

/** Import edge in the dependency graph. */
export interface FileDependency {
  id: string;
  projectId: string;
  fromFile: string;
  toFile: string;
  importNames: string[];
  isTypeOnly: boolean;
}

/** CIE status values stored on the project row. */
export type CieStatus = "pending" | "indexing" | "generating" | "indexed" | "error";
