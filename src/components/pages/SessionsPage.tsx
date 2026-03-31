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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: DashboardData;
}

export function SessionsPage({ data }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  const sessions = data.sessions.filter((s) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      s.dirName.toLowerCase().includes(q) ||
      (s.companyId ?? "").toLowerCase().includes(q) ||
      s.crashReports.some((c) => c.roomId.toLowerCase().includes(q)) ||
      s.sdpFiles.some((sdp) => sdp.roomId.toLowerCase().includes(q)) ||
      (s.createdAt
        ? Math.floor(s.createdAt.getTime() / 1000)
            .toString()
            .includes(q)
        : false)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sessões</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.sessions.length} sessão(ões) encontrada(s)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniCard
          icon={Users}
          label="Total de Sessões"
          value={data.sessions.length}
          color="text-blue-500"
        />
        <MiniCard
          icon={Film}
          label="Com Gravação"
          value={data.sessions.filter((s) => s.hasRecording).length}
          color="text-green-500"
        />
        <MiniCard
          icon={AlertTriangle}
          label="Com Crash"
          value={data.sessions.filter((s) => s.crashReports.length > 0).length}
          color="text-red-500"
        />
        <MiniCard
          icon={RotateCcw}
          label="Com Retry"
          value={data.sessions.filter((s) => s.retryMetadata).length}
          color="text-yellow-500"
        />
      </div>

      {/* Sessions table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Detalhes das Sessões
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar por ID ou empresa..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
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
                <TableHead>Sessão</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Gravação</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, i) => {
                const crash = session.crashReports[0];
                const participants =
                  crash?.sessionInfo?.participants ?? session.sdpFiles.length;
                const duration = crash?.sessionInfo?.duration;
                const fileSize = crash?.sessionInfo?.fileSize;

                return (
                  <>
                    <TableRow
                      key={session.dirName}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <TableCell>
                        {expanded === i ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {session.dirName}
                      </TableCell>
                      <TableCell>
                        {session.companyId ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {session.companyId}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {session.createdAt
                          ? format(session.createdAt, "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          {participants}
                        </div>
                      </TableCell>
                      <TableCell>
                        {duration ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {formatDuration(duration)}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.hasRecording ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Film className="h-3 w-3 text-green-500" />
                            {fileSize ? formatBytes(fileSize) : "Sim"}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Não
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.crashReports.length > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Crash
                          </Badge>
                        ) : session.retryMetadata ? (
                          <Badge variant="secondary" className="text-[10px]">
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Retry
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-green-600"
                          >
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded === i && (
                      <TableRow key={`${session.dirName}-detail`}>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <SessionExpandedDetail session={session} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma sessão encontrada
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

function SessionExpandedDetail({
  session,
}: {
  session: import("@/lib/types").SessionInfo;
}) {
  const crash = session.crashReports[0];
  return (
    <div className="space-y-4 text-xs">
      {/* Recording files */}
      {session.recordingFiles.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">
            Arquivos de Gravação
          </p>
          <div className="flex flex-wrap gap-2">
            {session.recordingFiles.map((f) => (
              <Badge
                key={f}
                variant="secondary"
                className="font-mono text-[10px]"
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Crash details */}
      {crash && (
        <div className="rounded-md border p-3 space-y-2">
          <p className="font-medium text-red-500">Crash: {crash.crashType}</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <KV label="Root Cause" value={crash.rootCause} />
            <KV label="Recovery" value={crash.recoveryAction} />
            <KV label="Arquivo" value={crash.sessionInfo?.filePath ?? "—"} />
            <KV
              label="Tamanho"
              value={
                crash.sessionInfo?.fileSize
                  ? formatBytes(crash.sessionInfo.fileSize)
                  : "—"
              }
            />
          </div>
          {crash.error.stack && (
            <pre className="overflow-x-auto rounded bg-muted p-2 text-[11px] leading-relaxed">
              {crash.error.stack}
            </pre>
          )}
        </div>
      )}

      {/* SDP files */}
      {session.sdpFiles.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">
            Participantes (SDP)
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {session.sdpFiles.map((sdp) => (
              <div
                key={sdp.participantId}
                className="rounded-md border p-2 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {sdp.role === "prof" ? "Profissional" : "Paciente"}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    {sdp.participantId}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {sdp.codec.toUpperCase()} {sdp.sampleRate / 1000}kHz · RTP:
                  {sdp.rtpPort} · RTCP:{sdp.rtcpPort} · {sdp.direction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry metadata */}
      {session.retryMetadata && (
        <div className="rounded-md border border-yellow-500/30 p-3 space-y-1">
          <p className="font-medium text-yellow-600">
            Retry: {session.retryMetadata.attempts} tentativa(s)
          </p>
          {session.retryMetadata.lastAttempt && (
            <p className="text-muted-foreground">
              Última:{" "}
              {format(
                new Date(session.retryMetadata.lastAttempt),
                "dd/MM/yyyy HH:mm:ss",
                { locale: ptBR },
              )}
            </p>
          )}
          {session.retryMetadata.lastError && (
            <p className="text-red-500">{session.retryMetadata.lastError}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
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
