import { ErrorReport, MemoryUsage } from "../types";

export function parseError(content: string, fileName: string): ErrorReport {
  const getField = (label: string): string => {
    const regex = new RegExp(`${escapeRegex(label)}\\s*(.+)`, "m");
    const match = content.match(regex);
    return match?.[1]?.trim() ?? "N/A";
  };

  const timestamp = getField("Timestamp:");
  const roomId = getField("Room ID:");
  const professional = getField("Profissional:");
  const folder = getField("Pasta:");
  const stage = getField("Etapa:");

  // Error message
  const msgMatch = content.match(/Mensagem:\s*(.+)/m);
  const errorMessage = msgMatch?.[1]?.trim() ?? "Unknown";

  // Error type - first word of stack trace (e.g. "TypeError")
  const stackSection = content.match(/Stack Trace:\s*\n([\s\S]*?)(?=\n={3,})/);
  const stackTrace = stackSection?.[1]?.trim() ?? "";
  const errorType = stackTrace.split(":")[0] ?? "Unknown";

  // Additional context - JSON block after CONTEXTO ADICIONAL
  let additionalContext: Record<string, unknown> = {};
  const ctxMatch = content.match(
    /CONTEXTO ADICIONAL\s*={3,}\s*\n([\s\S]*?)(?=\n={3,})/,
  );
  if (ctxMatch) {
    try {
      additionalContext = JSON.parse(ctxMatch[1].trim());
    } catch {
      additionalContext = { raw: ctxMatch[1].trim() };
    }
  }

  // System info
  const nodeVersion = getField("Node Version:");
  const platform = getField("Platform:");
  const uptimeMatch = content.match(/Uptime:\s*([\d.]+)/);
  const uptime = uptimeMatch ? parseFloat(uptimeMatch[1]) : 0;

  let memory: MemoryUsage = {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0,
  };
  const memMatch = content.match(/Memory Usage:\s*(\{[\s\S]*?\})\s*\n/);
  if (memMatch) {
    try {
      memory = JSON.parse(memMatch[1]);
    } catch {
      // keep defaults
    }
  }

  // Active sessions
  const totalMatch = content.match(/Total de sessões:\s*(\d+)/);
  const activeMatch = content.match(/Sessões ativas:\s*(\d+)/);
  const currentFound = !content.includes("Não encontrada");

  return {
    timestamp,
    roomId,
    professional,
    folder,
    stage,
    errorMessage,
    errorType,
    stackTrace,
    additionalContext,
    systemInfo: { nodeVersion, platform, memory, uptime },
    activeSessions: {
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      active: activeMatch ? parseInt(activeMatch[1]) : 0,
      currentFound,
    },
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
