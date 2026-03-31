"use client";

import { useState, useMemo, useEffect } from "react";
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
  Server,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Zap,
  AlertTriangle,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToCsv } from "@/lib/export-csv";
import type { NavigateOptions } from "@/components/Dashboard";

interface Props {
  data: DashboardData;
  initialFilter?: string;
  onNavigate?: (opts: NavigateOptions) => void;
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

type SortKey = "timestamp" | "type" | "category" | "message" | "roomId";
type SortDir = "asc" | "desc";

export function ErrorsPage({ data, initialFilter, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "crash" | "error">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
      setPage(0);
    }
  }, [initialFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const allErrors: ErrorItem[] = useMemo(() => [
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
  ], [data.crashes, data.errors]);

  const filtered = useMemo(() => {
    let items = allErrors;
    if (typeFilter !== "ALL") items = items.filter((e) => e.type === typeFilter);
    if (filter) {
      const q = filter.toLowerCase();
      items = items.filter((e) =>
        e.message.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.roomId.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      items = items.filter((e) => new Date(e.timestamp).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59").getTime();
      items = items.filter((e) => new Date(e.timestamp).getTime() <= to);
    }
    items = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "timestamp": cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); break;
        case "type": cmp = a.type.localeCompare(b.type); break;
        case "category": cmp = a.category.localeCompare(b.category); break;
        case "message": cmp = a.message.localeCompare(b.message); break;
        case "roomId": cmp = a.roomId.localeCompare(b.roomId); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return items;
  }, [allErrors, typeFilter, filter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExport = () => {
    exportToCsv(
      `erros-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((e) => ({
        tipo: e.type,
        timestamp: e.timestamp,
        categoria: e.category,
        mensagem: e.message,
        roomId: e.roomId,
        detalhe: e.detail,
      })),
    );
  };

  const navigateToLogs = (roomId: string) => {
    onNavigate?.({ page: "logs", filter: roomId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Erros & Crashes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.crashes.length} crashes · {data.errors.length} erros de gravação
          </p>
        </div>
        <button onClick={handleExport} disabled={filtered.length === 0}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ErrorTimeline logs={data.logs} crashes={data.crashes} errors={data.errors} />
        <ErrorTypes crashes={data.crashes} errors={data.errors} />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        {([["ALL", "Todos", allErrors.length], ["crash", "Crashes", data.crashes.length], ["error", "Erros", data.errors.length]] as const).map(([val, label, count]) => (
          <button key={val}
            onClick={() => { setTypeFilter(val as "ALL" | "crash" | "error"); setPage(0); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === val ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"
            }`}>
            {label} <span className="ml-1.5 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <Card>
        <CardHeader className="pb-3">
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros avançados
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Data início</label>
                <input type="date" value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                  className="h-8 w-full rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Data fim</label>
                <input type="date" value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                  className="h-8 w-full rounded-md border bg-transparent px-3 text-xs outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline">
                Limpar filtros
              </button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Todos os Erros ({filtered.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Filtrar..." value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("type")}>Tipo <SortIcon col="type" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("category")}>Categoria <SortIcon col="category" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("message")}>Mensagem <SortIcon col="message" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("roomId")}>Room ID <SortIcon col="roomId" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("timestamp")}>Data/Hora <SortIcon col="timestamp" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item, i) => {
                const globalIdx = page * PAGE_SIZE + i;
                return (
                  <>
                    <TableRow key={globalIdx} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpanded(expanded === globalIdx ? null : globalIdx)}>
                      <TableCell className="w-8">
                        {expanded === globalIdx ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </TableCell>
                      <TableCell>
                        {item.type === "crash" ? (
                          <Badge variant="destructive" className="text-[10px]"><Zap className="mr-1 h-3 w-3" />Crash</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/30"><AlertTriangle className="mr-1 h-3 w-3" />Erro</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{item.category}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs">{item.message}</TableCell>
                      <TableCell>
                        <button onClick={(e) => { e.stopPropagation(); navigateToLogs(item.roomId); }}
                          className="flex items-center gap-1 text-xs font-mono text-primary hover:underline" title="Ver logs desta sala">
                          {item.roomId.slice(0, 8)}…
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{safeFormat(item.timestamp)}</TableCell>
                    </TableRow>
                    {expanded === globalIdx && (
                      <TableRow key={`${globalIdx}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <ExpandedDetail item={item} onNavigate={onNavigate} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhum erro encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(0)} disabled={page === 0} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted">««</button>
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted">← Anterior</button>
                <span className="flex items-center px-2">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted">Próximo →</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted">»»</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpandedDetail({ item, onNavigate }: { item: ErrorItem; onNavigate?: (opts: NavigateOptions) => void }) {
  if (item.type === "crash") {
    const c = item.raw as import("@/lib/types").CrashReport;
    return (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Room ID: </span>
            <button onClick={() => onNavigate?.({ page: "logs", filter: c.roomId })}
              className="font-mono text-primary hover:underline">{c.roomId}</button>
          </div>
          <KV label="Tipo" value={c.crashType} />
          <KV label="Participantes" value={String(c.sessionInfo?.participants ?? "—")} />
          <KV label="Duração" value={c.sessionInfo?.duration ? `${Math.floor(c.sessionInfo.duration / 60)}m ${c.sessionInfo.duration % 60}s` : "—"} />
          <KV label="Arquivo" value={c.sessionInfo?.filePath ?? "—"} mono />
          <KV label="Tamanho" value={c.sessionInfo?.fileSize ? formatBytes(c.sessionInfo.fileSize) : "—"} />
          <KV label="Root Cause" value={c.rootCause} />
          <KV label="Recovery" value={c.recoveryAction} />
        </div>
        {c.resourcesAtCrash && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4 rounded-md border p-3">
            <KV label="CPU" value={`${c.resourcesAtCrash.cpu.usagePercent}% (${c.resourcesAtCrash.cpu.cores} cores)`} />
            <KV label="Memória" value={`${c.resourcesAtCrash.memory.usagePercent}% (${(c.resourcesAtCrash.memory.usedMB / 1024).toFixed(1)} GB)`} />
            <KV label="Disco" value={`${c.resourcesAtCrash.disk.usagePercent}% (${c.resourcesAtCrash.disk.usedGB.toFixed(1)} GB)`} />
            <KV label="Portas" value={`${c.resourcesAtCrash.ports.used}/${c.resourcesAtCrash.ports.total}`} />
          </div>
        )}
        {c.error.stack && (
          <div>
            <p className="mb-1 font-medium text-muted-foreground">Stack Trace</p>
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">{c.error.stack}</pre>
          </div>
        )}
      </div>
    );
  }

  const e = item.raw as import("@/lib/types").ErrorReport;
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
        <div>
          <span className="text-muted-foreground">Room ID: </span>
          <button onClick={() => onNavigate?.({ page: "logs", filter: e.roomId })}
            className="font-mono text-primary hover:underline">{e.roomId}</button>
        </div>
        <KV label="Profissional" value={e.professional} />
        <KV label="Etapa" value={e.stage} />
        <KV label="Tipo" value={e.errorType} />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5"><Server className="h-3 w-3" /><span>Node {e.systemInfo.nodeVersion} · {e.systemInfo.platform}</span></div>
        <span>RSS: {(e.systemInfo.memory.rss / 1024 / 1024).toFixed(0)} MB · Heap: {(e.systemInfo.memory.heapUsed / 1024 / 1024).toFixed(0)} MB</span>
        <span>Uptime: {(e.systemInfo.uptime / 3600).toFixed(1)}h</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-3 w-3" />
        <span>{e.activeSessions.total} sessões total · {e.activeSessions.active} ativas</span>
        {!e.activeSessions.currentFound && <Badge variant="outline" className="text-[10px] text-yellow-600">Sessão não encontrada</Badge>}
      </div>
      {e.stackTrace && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">Stack Trace</p>
          <pre className="overflow-x-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">{e.stackTrace}</pre>
        </div>
      )}
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}

function safeFormat(ts: string): string {
  try { return format(new Date(ts), "dd/MM/yy HH:mm:ss", { locale: ptBR }); }
  catch { return ts; }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
