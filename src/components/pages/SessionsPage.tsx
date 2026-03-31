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
import {
  Users,
  Clock,
  Film,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  RotateCcw,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
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

type StatusFilter = "ALL" | "crash" | "retry" | "ok";
type SortKey = "dirName" | "companyId" | "createdAt" | "participants" | "status";
type SortDir = "asc" | "desc";

export function SessionsPage({ data, initialFilter, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const getStatus = (s: typeof data.sessions[0]) =>
    s.crashReports.length > 0 ? "crash" : s.retryMetadata ? "retry" : "ok";

  const sessions = useMemo(() => {
    let list = data.sessions;
    if (statusFilter !== "ALL") {
      list = list.filter((s) => getStatus(s) === statusFilter);
    }
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter((s) =>
        s.dirName.toLowerCase().includes(q) ||
        (s.companyId ?? "").toLowerCase().includes(q) ||
        s.crashReports.some((c) => c.roomId.toLowerCase().includes(q)) ||
        s.sdpFiles.some((sdp) => sdp.roomId.toLowerCase().includes(q)) ||
        (s.createdAt ? Math.floor(s.createdAt.getTime() / 1000).toString().includes(q) : false)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "dirName": cmp = a.dirName.localeCompare(b.dirName); break;
        case "companyId": cmp = (a.companyId ?? "").localeCompare(b.companyId ?? ""); break;
        case "createdAt": cmp = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0); break;
        case "participants": {
          const ap = a.crashReports[0]?.sessionInfo?.participants ?? a.sdpFiles.length;
          const bp = b.crashReports[0]?.sessionInfo?.participants ?? b.sdpFiles.length;
          cmp = ap - bp;
          break;
        }
        case "status": cmp = getStatus(a).localeCompare(getStatus(b)); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [data.sessions, statusFilter, filter, sortKey, sortDir]);

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
  const paginated = sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusCounts = useMemo(() => ({
    ALL: data.sessions.length,
    crash: data.sessions.filter((s) => s.crashReports.length > 0).length,
    retry: data.sessions.filter((s) => !s.crashReports.length && s.retryMetadata).length,
    ok: data.sessions.filter((s) => !s.crashReports.length && !s.retryMetadata).length,
  }), [data.sessions]);

  const handleExport = () => {
    exportToCsv(
      `sessoes-${new Date().toISOString().slice(0, 10)}.csv`,
      sessions.map((s) => {
        const crash = s.crashReports[0];
        return {
          sessao: s.dirName,
          empresa: s.companyId ?? "",
          criada_em: s.createdAt?.toISOString() ?? "",
          participantes: crash?.sessionInfo?.participants ?? s.sdpFiles.length,
          duracao_s: crash?.sessionInfo?.duration ?? "",
          gravacao: s.hasRecording ? "Sim" : "Não",
          status: getStatus(s),
          crash_type: crash?.crashType ?? "",
          room_ids: [...new Set([...s.crashReports.map(c => c.roomId), ...s.sdpFiles.map(sd => sd.roomId)])].join("; "),
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Sessões</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.sessions.length} sessão(ões) encontrada(s)</p>
        </div>
        <button onClick={handleExport} disabled={sessions.length === 0}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniCard icon={Users} label="Total de Sessões" value={data.sessions.length} color="text-blue-500" />
        <MiniCard icon={Film} label="Com Gravação" value={data.sessions.filter((s) => s.hasRecording).length} color="text-green-500" />
        <MiniCard icon={AlertTriangle} label="Com Crash" value={statusCounts.crash} color="text-red-500" />
        <MiniCard icon={RotateCcw} label="Com Retry" value={data.sessions.filter((s) => s.retryMetadata).length} color="text-yellow-500" />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {([["ALL", "Todos"], ["crash", "Crash"], ["retry", "Retry"], ["ok", "OK"]] as const).map(([val, label]) => (
          <button key={val}
            onClick={() => { setStatusFilter(val as StatusFilter); setPage(0); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === val ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"
            }`}>
            {label} <span className="ml-1.5 opacity-70">({statusCounts[val]})</span>
          </button>
        ))}
      </div>

      {/* Sessions table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Detalhes das Sessões ({sessions.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Filtrar por ID, empresa, roomId..." value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("dirName")}>Sessão <SortIcon col="dirName" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("companyId")}>Empresa <SortIcon col="companyId" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("createdAt")}>Criada em <SortIcon col="createdAt" /></TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("participants")}>Participantes <SortIcon col="participants" /></TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Gravação</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>Status <SortIcon col="status" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((session, i) => {
                const globalIdx = page * PAGE_SIZE + i;
                const crash = session.crashReports[0];
                const participants = crash?.sessionInfo?.participants ?? session.sdpFiles.length;
                const duration = crash?.sessionInfo?.duration;
                const fileSize = crash?.sessionInfo?.fileSize;

                return (
                  <>
                    <TableRow key={session.dirName} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpanded(expanded === globalIdx ? null : globalIdx)}>
                      <TableCell>
                        {expanded === globalIdx ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{session.dirName}</TableCell>
                      <TableCell>
                        {session.companyId ? (
                          <button onClick={(e) => { e.stopPropagation(); onNavigate?.({ page: "logs", filter: session.companyId! }); }}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Building2 className="h-3 w-3" />{session.companyId}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {session.createdAt ? format(session.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell><div className="flex items-center gap-1 text-xs"><Users className="h-3 w-3" />{participants}</div></TableCell>
                      <TableCell>
                        {duration ? (
                          <div className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />{formatDuration(duration)}</div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {session.hasRecording ? (
                          <div className="flex items-center gap-1 text-xs"><Film className="h-3 w-3 text-green-500" />{fileSize ? formatBytes(fileSize) : "Sim"}</div>
                        ) : <span className="text-xs text-muted-foreground">Não</span>}
                      </TableCell>
                      <TableCell>
                        {session.crashReports.length > 0 ? (
                          <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="mr-1 h-3 w-3" />Crash</Badge>
                        ) : session.retryMetadata ? (
                          <Badge variant="secondary" className="text-[10px]"><RotateCcw className="mr-1 h-3 w-3" />Retry</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-green-600">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded === globalIdx && (
                      <TableRow key={`${session.dirName}-detail`}>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <SessionExpandedDetail session={session} onNavigate={onNavigate} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Nenhuma sessão encontrada</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sessions.length)} de {sessions.length}</span>
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

function SessionExpandedDetail({ session, onNavigate }: { session: import("@/lib/types").SessionInfo; onNavigate?: (opts: NavigateOptions) => void }) {
  const crash = session.crashReports[0];
  return (
    <div className="space-y-4 text-xs">
      {session.recordingFiles.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">Arquivos de Gravação</p>
          <div className="flex flex-wrap gap-2">
            {session.recordingFiles.map((f) => (
              <Badge key={f} variant="secondary" className="font-mono text-[10px]">{f}</Badge>
            ))}
          </div>
        </div>
      )}

      {crash && (
        <div className="rounded-md border p-3 space-y-2">
          <p className="font-medium text-red-500">Crash: {crash.crashType}</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Room ID: </span>
              <button onClick={() => onNavigate?.({ page: "logs", filter: crash.roomId })}
                className="font-mono text-primary hover:underline">{crash.roomId.slice(0, 12)}…</button>
            </div>
            <KV label="Root Cause" value={crash.rootCause} />
            <KV label="Recovery" value={crash.recoveryAction} />
            <KV label="Tamanho" value={crash.sessionInfo?.fileSize ? formatBytes(crash.sessionInfo.fileSize) : "—"} />
          </div>
          {crash.error.stack && (
            <pre className="overflow-x-auto rounded bg-muted p-2 text-[11px] leading-relaxed">{crash.error.stack}</pre>
          )}
        </div>
      )}

      {session.sdpFiles.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">Participantes (SDP)</p>
          <div className="grid gap-2 md:grid-cols-2">
            {session.sdpFiles.map((sdp) => (
              <div key={sdp.participantId} className="rounded-md border p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{sdp.role === "prof" ? "Profissional" : "Paciente"}</Badge>
                  <span className="font-mono text-[10px] text-muted-foreground truncate">{sdp.participantId}</span>
                </div>
                <p className="text-muted-foreground">{sdp.codec.toUpperCase()} {sdp.sampleRate / 1000}kHz · RTP:{sdp.rtpPort} · RTCP:{sdp.rtcpPort} · {sdp.direction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.retryMetadata && (
        <div className="rounded-md border border-yellow-500/30 p-3 space-y-1">
          <p className="font-medium text-yellow-600">Retry: {session.retryMetadata.attempts} tentativa(s)</p>
          {session.retryMetadata.lastAttempt && (
            <p className="text-muted-foreground">Última: {format(new Date(session.retryMetadata.lastAttempt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
          )}
          {session.retryMetadata.lastError && <p className="text-red-500">{session.retryMetadata.lastError}</p>}
        </div>
      )}
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
