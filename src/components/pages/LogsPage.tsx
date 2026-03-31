"use client";

import { useState, useMemo } from "react";
import { DashboardData, LogEntry } from "@/lib/types";
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
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: DashboardData;
}

const LEVEL_COLORS: Record<string, string> = {
  STARTUP: "text-blue-500 border-blue-500/30",
  INFO: "text-green-500 border-green-500/30",
  WARN: "text-yellow-500 border-yellow-500/30",
  ERROR: "text-red-500 border-red-500/30",
};

const PAGE_SIZE = 50;

export function LogsPage({ data }: Props) {
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeunixFilter, setTimeunixFilter] = useState("");
  const [codEmpresaFilter, setCodEmpresaFilter] = useState("");
  const [idSalaFilter, setIdSalaFilter] = useState("");

  // Build a set of session dirNames matching cod_empresa filter
  const matchingSessionDirs = useMemo(() => {
    if (!codEmpresaFilter) return null;
    const q = codEmpresaFilter.trim().toLowerCase();
    const dirs = new Set<string>();
    for (const s of data.sessions) {
      if (s.companyId && s.companyId.toLowerCase().includes(q)) {
        dirs.add(s.dirName);
      }
    }
    return dirs;
  }, [data.sessions, codEmpresaFilter]);

  // Build a set of roomIds matching id_sala filter
  const matchingRoomIds = useMemo(() => {
    if (!idSalaFilter) return null;
    const q = idSalaFilter.trim().toLowerCase();
    const ids = new Set<string>();
    for (const c of data.crashes) {
      if (c.roomId && c.roomId.toLowerCase().includes(q)) ids.add(c.roomId);
    }
    for (const e of data.errors) {
      if (e.roomId && e.roomId.toLowerCase().includes(q)) ids.add(e.roomId);
    }
    for (const s of data.sdpFiles) {
      if (s.roomId && s.roomId.toLowerCase().includes(q)) ids.add(s.roomId);
    }
    return ids;
  }, [data.crashes, data.errors, data.sdpFiles, idSalaFilter]);

  // Count by level
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: data.logs.length };
    for (const log of data.logs) {
      c[log.level] = (c[log.level] ?? 0) + 1;
    }
    return c;
  }, [data.logs]);

  const filtered = useMemo(() => {
    let logs = data.logs;
    if (levelFilter !== "ALL") {
      logs = logs.filter((l) => l.level === levelFilter);
    }
    if (filter) {
      const q = filter.toLowerCase();
      logs = logs.filter((l) => {
        const full = JSON.stringify(l).toLowerCase();
        return full.includes(q);
      });
    }
    if (timeunixFilter) {
      const q = timeunixFilter.trim();
      logs = logs.filter((l) => {
        const ts = new Date(l.timestamp).getTime();
        const unixSec = Math.floor(ts / 1000).toString();
        const unixMs = ts.toString();
        return unixSec.includes(q) || unixMs.includes(q);
      });
    }
    if (codEmpresaFilter) {
      const q = codEmpresaFilter.trim().toLowerCase();
      logs = logs.filter((l) => {
        const full = JSON.stringify(l).toLowerCase();
        if (full.includes(q)) return true;
        // Cross-reference: check if log timestamp falls within any matching session timeframe
        if (matchingSessionDirs && matchingSessionDirs.size > 0) {
          return full.includes(q);
        }
        return false;
      });
    }
    if (idSalaFilter) {
      const q = idSalaFilter.trim().toLowerCase();
      logs = logs.filter((l) => {
        const full = JSON.stringify(l).toLowerCase();
        return full.includes(q);
      });
    }
    return logs;
  }, [
    data.logs,
    levelFilter,
    filter,
    timeunixFilter,
    codEmpresaFilter,
    idSalaFilter,
    matchingSessionDirs,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Logs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.logs.length} entradas de log
        </p>
      </div>

      {/* Level filter pills */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "STARTUP", "INFO", "WARN", "ERROR"].map((level) => (
          <button
            key={level}
            onClick={() => {
              setLevelFilter(level);
              setPage(0);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              levelFilter === level
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {level === "ALL" ? "Todos" : level}
            <span className="ml-1.5 opacity-70">({counts[level] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros avançados
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  TimeUnix
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1711843200"
                  value={timeunixFilter}
                  onChange={(e) => {
                    setTimeunixFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 w-full rounded-md border bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Código Empresa
                </label>
                <input
                  type="text"
                  placeholder="Ex: 139712"
                  value={codEmpresaFilter}
                  onChange={(e) => {
                    setCodEmpresaFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 w-full rounded-md border bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  ID Sala (Room ID)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 35896632-97e0-47d3-bbee-baf3ccf6474b"
                  value={idSalaFilter}
                  onChange={(e) => {
                    setIdSalaFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 w-full rounded-md border bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring font-mono"
                />
              </div>
            </div>
            {(timeunixFilter || codEmpresaFilter || idSalaFilter) && (
              <button
                onClick={() => {
                  setTimeunixFilter("");
                  setCodEmpresaFilter("");
                  setIdSalaFilter("");
                  setPage(0);
                }}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Limpar filtros avançados
              </button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Logs table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              <FileText className="mr-1.5 inline h-4 w-4" />
              Logs ({filtered.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar em todos os campos..."
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(0);
                }}
                className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring w-56"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Host</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((log, i) => {
                const globalIdx = page * PAGE_SIZE + i;
                return (
                  <>
                    <TableRow
                      key={globalIdx}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setExpanded(expanded === globalIdx ? null : globalIdx)
                      }
                    >
                      <TableCell>
                        {expanded === globalIdx ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${LEVEL_COLORS[log.level] ?? ""}`}
                        >
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {safeFormat(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-xs">{log.category}</TableCell>
                      <TableCell className="text-xs max-w-sm truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.metadata?.hostname ?? "—"}
                      </TableCell>
                    </TableRow>
                    {expanded === globalIdx && (
                      <TableRow key={`${globalIdx}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <LogExpandedDetail log={log} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Mostrando {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, filtered.length)} de{" "}
                {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogExpandedDetail({ log }: { log: LogEntry }) {
  return (
    <div className="space-y-3 text-xs">
      {/* Context */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 md:grid-cols-4">
        {log.context?.nodeVersion && (
          <KV label="Node" value={log.context.nodeVersion} />
        )}
        {log.context?.platform && (
          <KV label="Platform" value={log.context.platform} />
        )}
        {log.context?.pid != null && (
          <KV label="PID" value={String(log.context.pid)} />
        )}
        {log.context?.uptime != null && (
          <KV
            label="Uptime"
            value={`${(log.context.uptime / 3600).toFixed(1)}h`}
          />
        )}
        {log.context?.env && <KV label="Env" value={log.context.env} />}
        {log.context?.timezone && (
          <KV label="TZ" value={log.context.timezone} />
        )}
      </div>

      {/* Memory */}
      {log.context?.memory && (
        <div className="rounded-md border p-2">
          <p className="mb-1 font-medium text-muted-foreground">Memória</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-5">
            <KV
              label="RSS"
              value={`${(log.context.memory.rss / 1024 / 1024).toFixed(0)} MB`}
            />
            <KV
              label="Heap Used"
              value={`${(log.context.memory.heapUsed / 1024 / 1024).toFixed(0)} MB`}
            />
            <KV
              label="Heap Total"
              value={`${(log.context.memory.heapTotal / 1024 / 1024).toFixed(0)} MB`}
            />
            <KV
              label="External"
              value={`${(log.context.memory.external / 1024 / 1024).toFixed(1)} MB`}
            />
            <KV
              label="Buffers"
              value={`${(log.context.memory.arrayBuffers / 1024 / 1024).toFixed(1)} MB`}
            />
          </div>
        </div>
      )}

      {/* Extra context fields */}
      {log.context && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 md:grid-cols-4">
          {log.context.processedFiles != null && (
            <KV
              label="Arquivos Processados"
              value={String(log.context.processedFiles)}
            />
          )}
          {log.context.totalSizeMB != null && (
            <KV label="Tamanho Total" value={`${log.context.totalSizeMB} MB`} />
          )}
          {log.context.rotationDays != null && (
            <KV label="Rotação" value={`${log.context.rotationDays} dias`} />
          )}
          {log.context.archivePath && (
            <KV label="Arquivo" value={log.context.archivePath as string} />
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4 text-muted-foreground">
        {log.metadata?.version && (
          <KV label="Versão" value={log.metadata.version} />
        )}
        {log.metadata?.localTime && (
          <KV label="Hora Local" value={log.metadata.localTime} />
        )}
      </div>

      {/* Raw JSON */}
      <details className="group">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver JSON completo
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
          {JSON.stringify(log, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span>{value}</span>
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
