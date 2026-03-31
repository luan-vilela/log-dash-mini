import JSZip from "jszip";
import {
  DashboardData,
  LogEntry,
  CrashReport,
  ErrorReport,
  SdpInfo,
  RetryMetadata,
  SessionInfo,
} from "../types";
import { parseLogs } from "./log-parser";
import { parseCrash } from "./crash-parser";
import { parseError } from "./error-parser";
import { parseSdp } from "./sdp-parser";
import { parseRetry } from "./retry-parser";

export async function extractZip(file: File): Promise<DashboardData> {
  const zip = await JSZip.loadAsync(file);

  const logs: LogEntry[] = [];
  const crashes: CrashReport[] = [];
  const errors: ErrorReport[] = [];
  const sdpFiles: SdpInfo[] = [];
  const retries: RetryMetadata[] = [];
  const sessionMap = new Map<string, SessionInfo>();

  const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);

  for (const [path, zipEntry] of entries) {
    const fileName = path.split("/").pop() ?? "";
    const parts = path.split("/");
    // Determine parent directory (could be nested inside zip)
    const parentDir = parts.length > 1 ? parts[parts.length - 2] : "";

    try {
      // Skip binary files
      if (/\.(webm|mp4|mkv|avi|png|jpg|gif)$/i.test(fileName)) {
        // Track recording files in their session
        if (parentDir && !parentDir.startsWith("ERRORS_")) {
          const session = getOrCreateSession(sessionMap, parentDir);
          session.hasRecording = true;
          session.recordingFiles.push(fileName);
        }
        continue;
      }

      const content = await zipEntry.async("string");

      // Daily log files: all-YYYY-MM-DD.log
      if (/^all-\d{4}-\d{2}-\d{2}\.log$/i.test(fileName)) {
        logs.push(...parseLogs(content));
        continue;
      }

      // Crash reports: CRASH_*.json
      if (fileName.startsWith("CRASH_") && fileName.endsWith(".json")) {
        const crash = parseCrash(content);
        crashes.push(crash);
        if (parentDir && !parentDir.startsWith("ERRORS_")) {
          const session = getOrCreateSession(sessionMap, parentDir);
          session.crashReports.push(crash);
        }
        continue;
      }

      // Error text files: ERROR_*.txt
      if (fileName.startsWith("ERROR_") && fileName.endsWith(".txt")) {
        errors.push(parseError(content, fileName));
        continue;
      }

      // SDP files: participant-*.sdp
      if (fileName.startsWith("participant-") && fileName.endsWith(".sdp")) {
        const sdp = parseSdp(content, fileName);
        sdpFiles.push(sdp);
        if (parentDir && !parentDir.startsWith("ERRORS_")) {
          const session = getOrCreateSession(sessionMap, parentDir);
          session.sdpFiles.push(sdp);
        }
        continue;
      }

      // Retry metadata: .retry_metadata
      if (fileName === ".retry_metadata") {
        const retry = parseRetry(content, parentDir);
        retries.push(retry);
        if (parentDir) {
          const session = getOrCreateSession(sessionMap, parentDir);
          session.retryMetadata = retry;
        }
        continue;
      }
    } catch (e) {
      console.warn(`Failed to parse ${path}:`, e);
    }
  }

  // Sort by timestamp
  logs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  crashes.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  errors.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Compute summary
  const allTimestamps = [
    ...logs.map((l) => l.timestamp),
    ...crashes.map((c) => c.timestamp),
    ...errors.map((e) => e.timestamp),
  ]
    .map((t) => new Date(t).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  const totalParticipants = crashes.reduce(
    (sum, c) => sum + (c.sessionInfo?.participants ?? 0),
    0,
  );

  return {
    logs,
    crashes,
    errors,
    sdpFiles,
    retries,
    sessions: Array.from(sessionMap.values()),
    summary: {
      totalLogs: logs.length,
      totalCrashes: crashes.length,
      totalErrors: errors.length,
      totalSessions: sessionMap.size,
      totalParticipants,
      dateRange:
        allTimestamps.length > 0
          ? {
              start: new Date(allTimestamps[0]).toISOString(),
              end: new Date(
                allTimestamps[allTimestamps.length - 1],
              ).toISOString(),
            }
          : null,
    },
  };
}

function getOrCreateSession(
  map: Map<string, SessionInfo>,
  dirName: string,
): SessionInfo {
  if (!map.has(dirName)) {
    // Parse companyId and unix timestamp from dir name (e.g. "139712_126535696")
    const match = dirName.match(/^(\d+)_(\d+)$/);
    let companyId: string | null = null;
    let createdAt: Date | null = null;
    if (match) {
      companyId = match[1];
      const ts = parseInt(match[2], 10);
      // Detect seconds vs milliseconds
      createdAt = new Date(ts > 1e12 ? ts : ts * 1000);
      if (isNaN(createdAt.getTime())) createdAt = null;
    }

    map.set(dirName, {
      dirName,
      companyId,
      createdAt,
      crashReports: [],
      sdpFiles: [],
      retryMetadata: null,
      hasRecording: false,
      recordingFiles: [],
    });
  }
  return map.get(dirName)!;
}
