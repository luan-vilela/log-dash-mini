import { RetryMetadata } from "../types";

export function parseRetry(content: string, sessionDir: string): RetryMetadata {
  const data = JSON.parse(content);
  return {
    attempts: data.attempts ?? 0,
    lastAttempt: data.lastAttempt ?? "",
    lastError: data.lastError ?? "",
    sessionDir,
  };
}
