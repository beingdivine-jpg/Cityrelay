import type { IncomingMessage, ServerResponse } from "node:http";
export function createAgentService(options?: {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
}): (
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void,
) => Promise<void>;
export function publicSourceUrl(raw: string): URL | null;
export function safeText(value: unknown, max?: number): string;
export function parseResponse(body: unknown): {
  output: string;
  citations: { url: string; title: string; start?: number; end?: number }[];
  searches: unknown[];
};
export function sourceSnapshot(
  source: { url: string; title: string },
  fetcher?: typeof fetch,
): Promise<unknown>;
