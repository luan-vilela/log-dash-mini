export interface LogEntry {
  id: string;
  timestamp: string;
  level: "STARTUP" | "INFO" | "WARN" | "ERROR";
  category: string;
  message: string;
  context: {
    nodeVersion?: string;
    platform?: string;
    pid?: number;
    memory?: MemoryUsage;
    uptime?: number;
    env?: string;
    timezone?: string;
    localStartTime?: string;
    cutoffDate?: string;
    processedFiles?: number;
    totalSizeMB?: number;
    rotationDays?: number;
    archiveMode?: boolean;
    nextCleanup?: string;
    archivePath?: string;
    [key: string]: unknown;
  };
  metadata: {
    hostname: string;
    version: string;
    timezone: string;
    localTime: string;
  };
}

export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface CrashReport {
  timestamp: string;
  roomId: string;
  crashType: string;
  error: {
    message: string;
    stack: string;
  };
  sessionInfo: {
    startTime: string;
    duration: number;
    participants: number;
    filePath: string;
    fileSize: number;
  };
  resourcesAtCrash: SystemResources;
  rootCause: string;
  recoveryAction: string;
}

export interface SystemResources {
  cpu: {
    usagePercent: number;
    availablePercent: number;
    cores: number;
  };
  memory: {
    totalMB: number;
    freeMB: number;
    usedMB: number;
    availableMB: number;
    usagePercent: number;
  };
  ports: {
    total: number;
    used: number;
    available: number;
    usagePercent: number;
  };
  disk: {
    path: string;
    totalGB: number;
    freeGB: number;
    usedGB: number;
    usagePercent: number;
  };
}

export interface ErrorReport {
  timestamp: string;
  roomId: string;
  professional: string;
  folder: string;
  stage: string;
  errorMessage: string;
  errorType: string;
  stackTrace: string;
  additionalContext: Record<string, unknown>;
  systemInfo: {
    nodeVersion: string;
    platform: string;
    memory: MemoryUsage;
    uptime: number;
  };
  activeSessions: {
    total: number;
    active: number;
    currentFound: boolean;
  };
}

export interface SdpInfo {
  participantId: string;
  role: "pac" | "prof" | string;
  roomId: string;
  codec: string;
  sampleRate: number;
  channels: number;
  rtpPort: number;
  rtcpPort: number;
  direction: string;
  tool: string;
  fmtpParams: string;
}

export interface RetryMetadata {
  attempts: number;
  lastAttempt: string;
  lastError: string;
  sessionDir: string;
}

export interface SessionInfo {
  dirName: string;
  companyId: string | null;
  createdAt: Date | null;
  crashReports: CrashReport[];
  sdpFiles: SdpInfo[];
  retryMetadata: RetryMetadata | null;
  hasRecording: boolean;
  recordingFiles: string[];
}

export type DashboardPage =
  | "overview"
  | "errors"
  | "sessions"
  | "resources"
  | "mediasoup"
  | "logs";

export interface DashboardData {
  logs: LogEntry[];
  crashes: CrashReport[];
  errors: ErrorReport[];
  sdpFiles: SdpInfo[];
  retries: RetryMetadata[];
  sessions: SessionInfo[];
  summary: {
    totalLogs: number;
    totalCrashes: number;
    totalErrors: number;
    totalSessions: number;
    totalParticipants: number;
    dateRange: { start: string; end: string } | null;
  };
}
