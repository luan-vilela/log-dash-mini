"use client";

import { useState, useMemo } from "react";
import { DashboardData, DashboardPage } from "@/lib/types";
import { NavigateOptions } from "@/components/Dashboard";
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
  Radio,
  AudioLines,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToCsv } from "@/lib/export-csv";

interface Props {
  data: DashboardData;
  onNavigate?: (opts: NavigateOptions) => void;
}

type SdpSortKey = "role" | "participantId" | "roomId" | "codec";
type RetrySort = "sessionDir" | "attempts" | "lastAttempt";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="ml-1 inline h-3 w-3" /> : <ArrowDown className="ml-1 inline h-3 w-3" />;
}

export function MediaSoupPage({ data, onNavigate }: Props) {
  const { sdpFiles, retries } = data;

  const [search, setSearch] = useState("");
  const [sdpSort, setSdpSort] = useState<SdpSortKey>("role");
  const [sdpDir, setSdpDir] = useState<SortDir>("asc");
  const [retrySort, setRetrySort] = useState<RetrySort>("attempts");
  const [retryDir, setRetryDir] = useState<SortDir>("desc");

  const toggleSdpSort = (key: SdpSortKey) => {
    if (sdpSort === key) setSdpDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSdpSort(key); setSdpDir("asc"); }
  };
  const toggleRetrySort = (key: RetrySort) => {
    if (retrySort === key) setRetryDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setRetrySort(key); setRetryDir("asc"); }
  };

  const q = search.toLowerCase().trim();

  const filteredSdp = useMemo(() => {
    let list = sdpFiles;
    if (q) {
      list = list.filter(
        (s) =>
          s.participantId.toLowerCase().includes(q) ||
          s.roomId.toLowerCase().includes(q) ||
          s.codec.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.direction.toLowerCase().includes(q),
      );
    }
    const dir = sdpDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[sdpSort] ?? "";
      const bv = b[sdpSort] ?? "";
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return list;
  }, [sdpFiles, q, sdpSort, sdpDir]);

  const filteredRetries = useMemo(() => {
    let list = retries;
    if (q) {
      list = list.filter(
        (r) =>
          r.sessionDir.toLowerCase().includes(q) ||
          (r.lastError ?? "").toLowerCase().includes(q),
      );
    }
    const dir = retryDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (retrySort === "attempts") return (a.attempts - b.attempts) * dir;
      if (retrySort === "lastAttempt") {
        const at = new Date(a.lastAttempt ?? 0).getTime();
        const bt = new Date(b.lastAttempt ?? 0).getTime();
        return (at - bt) * dir;
      }
      const av = a[retrySort] ?? "";
      const bv = b[retrySort] ?? "";
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return list;
  }, [retries, q, retrySort, retryDir]);

  // Aggregate stats
  const codecs = new Map<string, number>();
  const rtpPorts = new Set<number>();
  for (const sdp of sdpFiles) {
    codecs.set(sdp.codec, (codecs.get(sdp.codec) ?? 0) + 1);
    if (sdp.rtpPort) rtpPorts.add(sdp.rtpPort);
    if (sdp.rtcpPort) rtpPorts.add(sdp.rtcpPort);
  }
  const roles = { pac: sdpFiles.filter((s) => s.role === "pac").length, prof: sdpFiles.filter((s) => s.role === "prof").length };
  const totalAttempts = retries.reduce((s, r) => s + r.attempts, 0);

  const handleExportSdp = () => {
    exportToCsv(
      `mediasoup-sdp-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredSdp.map((s) => ({
        role: s.role,
        participantId: s.participantId,
        roomId: s.roomId,
        codec: s.codec,
        sampleRate: s.sampleRate,
        channels: s.channels,
        rtpPort: s.rtpPort,
        rtcpPort: s.rtcpPort,
        direction: s.direction,
        fmtpParams: s.fmtpParams,
      })),
    );
  };

  const handleExportRetries = () => {
    exportToCsv(
      `mediasoup-retries-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredRetries.map((r) => ({
        sessionDir: r.sessionDir,
        attempts: r.attempts,
        lastAttempt: r.lastAttempt ?? "",
        lastError: r.lastError ?? "",
      })),
    );
  };

  const goToLogs = (filter: string) => onNavigate?.({ page: "logs" as DashboardPage, filter });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">MediaSoup & Recuperação</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sdpFiles.length} participante(s) SDP · {retries.length} sessão(ões) com retry
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportSdp} disabled={filteredSdp.length === 0}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> SDP CSV
          </button>
          <button onClick={handleExportRetries} disabled={filteredRetries.length === 0}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> Retries CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por room, participante, codec..."
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MiniCard label="Participantes" value={sdpFiles.length} icon={ArrowUpRight} />
        <MiniCard label="Profissionais" value={roles.prof} icon={ArrowUpRight} />
        <MiniCard label="Pacientes" value={roles.pac} icon={ArrowUpRight} />
        <MiniCard label="Portas RTP" value={rtpPorts.size} icon={Radio} />
        <MiniCard label="Codecs" value={codecs.size} icon={AudioLines} />
      </div>

      {/* SDP details table */}
      {filteredSdp.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Detalhes SDP dos Participantes
              {q && <span className="ml-2 text-xs font-normal text-muted-foreground">({filteredSdp.length} resultado{filteredSdp.length !== 1 && "s"})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSdpSort("role")}>Role<SortIcon active={sdpSort === "role"} dir={sdpDir} /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSdpSort("participantId")}>Participante ID<SortIcon active={sdpSort === "participantId"} dir={sdpDir} /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSdpSort("roomId")}>Room ID<SortIcon active={sdpSort === "roomId"} dir={sdpDir} /></TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSdpSort("codec")}>Codec<SortIcon active={sdpSort === "codec"} dir={sdpDir} /></TableHead>
                  <TableHead>Sample Rate</TableHead>
                  <TableHead>Canais</TableHead>
                  <TableHead>RTP Port</TableHead>
                  <TableHead>RTCP Port</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Parâmetros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSdp.map((sdp, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant={sdp.role === "prof" ? "default" : "secondary"} className="text-[10px]">
                        {sdp.role === "prof" ? "Profissional" : "Paciente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">{sdp.participantId}</TableCell>
                    <TableCell>
                      <button onClick={() => goToLogs(sdp.roomId)} className="font-mono text-xs text-blue-500 hover:underline max-w-[100px] truncate block">
                        {sdp.roomId}
                      </button>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{sdp.codec.toUpperCase()}</Badge></TableCell>
                    <TableCell className="text-xs">{sdp.sampleRate / 1000} kHz</TableCell>
                    <TableCell className="text-xs">{sdp.channels}ch</TableCell>
                    <TableCell className="text-xs font-mono">{sdp.rtpPort}</TableCell>
                    <TableCell className="text-xs font-mono">{sdp.rtcpPort}</TableCell>
                    <TableCell className="text-xs">{sdp.direction}</TableCell>
                    <TableCell className="text-xs font-mono max-w-[150px] truncate">{sdp.fmtpParams}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {q ? "Nenhum SDP encontrado para a busca" : "Nenhum arquivo SDP encontrado"}
          </CardContent>
        </Card>
      )}

      {/* Retries section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Retries e Recuperação</h3>

        {filteredRetries.length === 0 && !q ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Nenhuma tentativa de retry encontrada
            </CardContent>
          </Card>
        ) : filteredRetries.length === 0 && q ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Nenhum retry encontrado para a busca
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 mb-4">
              <MiniCard label="Sessões com Retry" value={retries.length} icon={RotateCcw} />
              <MiniCard label="Total de Tentativas" value={totalAttempts} icon={RotateCcw} />
              <MiniCard label="Média por Sessão" value={Math.round((totalAttempts / retries.length) * 10) / 10} icon={RotateCcw} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Detalhes dos Retries
                  {q && <span className="ml-2 text-xs font-normal text-muted-foreground">({filteredRetries.length} resultado{filteredRetries.length !== 1 && "s"})</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleRetrySort("sessionDir")}>Sessão<SortIcon active={retrySort === "sessionDir"} dir={retryDir} /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleRetrySort("attempts")}>Tentativas<SortIcon active={retrySort === "attempts"} dir={retryDir} /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleRetrySort("lastAttempt")}>Última Tentativa<SortIcon active={retrySort === "lastAttempt"} dir={retryDir} /></TableHead>
                      <TableHead>Último Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRetries.map((retry, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{retry.sessionDir}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{retry.attempts}x</Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {retry.lastAttempt ? format(new Date(retry.lastAttempt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "—"}
                        </TableCell>
                        <TableCell>
                          {retry.lastError ? (
                            <div className="flex items-start gap-1.5 max-w-xs">
                              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                              <span className="text-xs text-destructive">{retry.lastError}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function MiniCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
