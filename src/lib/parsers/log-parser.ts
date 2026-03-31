import { LogEntry } from "../types";

export function parseLogs(content: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const lines = content.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as LogEntry;
      entries.push(entry);
    } catch {
      // Skip malformed lines
    }
  }

  return entries;
}
