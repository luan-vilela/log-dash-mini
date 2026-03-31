"use client";

import { useState } from "react";
import { DashboardData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorTimeline } from "@/components/cards/ErrorTimeline";
import { ErrorTypes } from "@/components/cards/ErrorTypes";
import {
  AlertCircle,
  Server,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: DashboardData;
}

type ErrorItem = {
  type: "crash" | "error";
  timestamp: string;
  category: string;
  message: string;
  roomId: string;
  detail: string;
  raw: unknown;
};

export function ErrorsPage({ data }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  // Merge crashes and errors into unified list
  const allErrors: ErrorItem[] = [
    ...data.crashes.map((c) => ({
      type: "crash" as const,
      timestamp: c.timestamp,
      category: c.crashType,
      message: c.error.message,
      roomId: c.roomId,
      detail: c.rootCause,
      raw: c,
    })),
    ...data.errors.map((e) => ({
      type: "error" as const,
      timestamp: e.timestamp,
      category: e.errorType,
      message: e.errorMessage,
      roomId: e.roomId,
      detail: `Etapa: ${e.stage}`,
      raw: e,
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const filtered = filter
    ? allErrors.filter(
        (e) =>
          e.message.toLowerCase().includes(filter.toLowerCase()) ||
          e.category.toLowerCase().includes(filter.toLowerCase()) ||
          e.roomId.toLowerCase().includes(filter.toLowerCase()),
      )
    : allErrors;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Erros & Crashes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.crashes.length} crashes · {data.errors.length} erros de gravação
        </p>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ErrorTimeline
          logs={data.logs}
          crashes={data.crashes}
          errors={data.errors}
        />
        <ErrorTypes crashes={data.crashes} errors={data.errors} />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Todos os Erros ({filtered.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Room ID</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <>
                  <TableRow
                    key={i}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    <TableCell className="w-8">
                      {expanded === i ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.type === "crash" ? (
                        <Badge variant="destructive" className="text-[10px]">
                          <Zap className="mr-1 h-3 w-3" />
                          Crash
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-red-500 border-red-500/30"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Erro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {item.category}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {item.message}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {item.roomId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {safeFormat(item.timestamp)}
                    </TableCell>
                  </TableRow>
                  {expanded === i && (
                    <TableRow key={`${i}-detail`}>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        <ExpandedDetail item={item} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    Nenhum erro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpandedDetail({ item }: { item: ErrorItem }) {
  if (item.type === "crash") {
    const c = item.raw as import("@/lib/types").CrashReport;
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
          <KV label="Room ID" value={c.roomId} mono />
          <KV label="Tipo" value={c.crashType} />
          <KV
            label="Participantes"
            value={String(c.sessionInfo?.participants ?? "—")}
          />
          <KV
            label="Duração"
            value={
              c.sessionInfo?.duration
                ? `${Math.floor(c.sessionInfo.duration / 60)}m ${c.sessionInfo.duration % 60}s`
                : "—"
            }
          />
          <KV label="Arquivo" value={c.sessionInfo?.filePath ?? "—"} mono />
          <KV
            label="Tamanho"
            value={
              c.sessionInfo?.fileSize
                ? formatBytes(c.sessionInfo.fileSize)
                : "—"
            }
          />
          <KV label="Root Cause" value={c.rootCause} />
          <KV label="Recovery" value={c.recoveryAction} />
        </div>
        {c.resourcesAtCrash && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4 rounded-md border p-3">
            <KV
              label="CPU"
              value={`${c.resourcesAtCrash.cpu.usagePercent}% (${c.resourcesAtCrash.cpu.cores} cores)`}
            />
            <KV
              label="Memória"
              value={`${c.resourcesAtCrash.memory.usagePercent}% (${(c.resourcesAtCrash.memory.usedMB / 1024).toFixed(1)} GB)`}
            />
            <KV
              label="Disco"
              value={`${c.resourcesAtCrash.disk.usagePercent}% (${c.resourcesAtCrash.disk.usedGB.toFixed(1)} GB)`}
            />
            <KV
              label="Portas"
              value={`${c.resourcesAtCrash.ports.used}/${c.resourcesAtCrash.ports.total}`}
            />
          </div>
        )}
        {c.error.stack && (
          <div>
            <p className="mb-1 font-medium text-muted-foreground">
              Stack Trace
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
              {c.error.stack}
            </pre>
          </div>
        )}
      </div>
    );
  }

  const e = item.raw as import("@/lib/types").ErrorReport;
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
        <KV label="Room ID" value={e.roomId} mono />
        <KV label="Profissional" value={e.professional} />
        <KV label="Etapa" value={e.stage} />
        <KV label="Tipo" value={e.errorType} />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <Server className="h-3 w-3" />
          <span>
            Node {e.systemInfo.nodeVersion} · {e.systemInfo.platform}
          </span>
        </div>
        <span>
          RSS: {(e.systemInfo.memory.rss / 1024 / 1024).toFixed(0)} MB · Heap:{" "}
          {(e.systemInfo.memory.heapUsed / 1024 / 1024).toFixed(0)} MB
        </span>
        <span>Uptime: {(e.systemInfo.uptime / 3600).toFixed(1)}h</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-3 w-3" />
        <span>
          {e.activeSessions.total} sessões total · {e.activeSessions.active}{" "}
          ativas
        </span>
        {!e.activeSessions.currentFound && (
          <Badge variant="outline" className="text-[10px] text-yellow-600">
            Sessão não encontrada
          </Badge>
        )}
      </div>
      {e.stackTrace && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">Stack Trace</p>
          <pre className="overflow-x-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
            {e.stackTrace}
          </pre>
        </div>
      )}
    </div>
  );
}

function KV({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}

function safeFormat(ts: string): string {
  try {
    return format(new Date(ts), "dd/MM/yy HH:mm:ss", { locale: ptBR });
  } catch {
    return ts;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
