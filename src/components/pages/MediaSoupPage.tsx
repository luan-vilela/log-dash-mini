"use client";

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
  Radio,
  AudioLines,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: DashboardData;
}

export function MediaSoupPage({ data }: Props) {
  const { sdpFiles, retries } = data;

  // Aggregate codec info
  const codecs = new Map<string, number>();
  const rtpPorts = new Set<number>();

  for (const sdp of sdpFiles) {
    codecs.set(sdp.codec, (codecs.get(sdp.codec) ?? 0) + 1);
    if (sdp.rtpPort) rtpPorts.add(sdp.rtpPort);
    if (sdp.rtcpPort) rtpPorts.add(sdp.rtcpPort);
  }

  const roles = {
    pac: sdpFiles.filter((s) => s.role === "pac").length,
    prof: sdpFiles.filter((s) => s.role === "prof").length,
  };

  const totalAttempts = retries.reduce((s, r) => s + r.attempts, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">MediaSoup & Recuperação</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {sdpFiles.length} participante(s) SDP · {retries.length} sessão(ões)
          com retry
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MiniCard
          label="Participantes"
          value={sdpFiles.length}
          icon={ArrowUpRight}
        />
        <MiniCard
          label="Profissionais"
          value={roles.prof}
          icon={ArrowUpRight}
        />
        <MiniCard label="Pacientes" value={roles.pac} icon={ArrowUpRight} />
        <MiniCard label="Portas RTP" value={rtpPorts.size} icon={Radio} />
        <MiniCard label="Codecs" value={codecs.size} icon={AudioLines} />
      </div>

      {/* SDP details table */}
      {sdpFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Detalhes SDP dos Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Participante ID</TableHead>
                  <TableHead>Room ID</TableHead>
                  <TableHead>Codec</TableHead>
                  <TableHead>Sample Rate</TableHead>
                  <TableHead>Canais</TableHead>
                  <TableHead>RTP Port</TableHead>
                  <TableHead>RTCP Port</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Parâmetros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sdpFiles.map((sdp, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge
                        variant={sdp.role === "prof" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {sdp.role === "prof" ? "Profissional" : "Paciente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">
                      {sdp.participantId}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[100px] truncate">
                      {sdp.roomId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {sdp.codec.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {sdp.sampleRate / 1000} kHz
                    </TableCell>
                    <TableCell className="text-xs">{sdp.channels}ch</TableCell>
                    <TableCell className="text-xs font-mono">
                      {sdp.rtpPort}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {sdp.rtcpPort}
                    </TableCell>
                    <TableCell className="text-xs">{sdp.direction}</TableCell>
                    <TableCell className="text-xs font-mono max-w-[150px] truncate">
                      {sdp.fmtpParams}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {sdpFiles.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum arquivo SDP encontrado
          </CardContent>
        </Card>
      )}

      {/* Retries section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Retries e Recuperação</h3>

        {retries.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Nenhuma tentativa de retry encontrada
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 mb-4">
              <MiniCard
                label="Sessões com Retry"
                value={retries.length}
                icon={RotateCcw}
              />
              <MiniCard
                label="Total de Tentativas"
                value={totalAttempts}
                icon={RotateCcw}
              />
              <MiniCard
                label="Média por Sessão"
                value={Math.round((totalAttempts / retries.length) * 10) / 10}
                icon={RotateCcw}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Detalhes dos Retries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sessão</TableHead>
                      <TableHead>Tentativas</TableHead>
                      <TableHead>Última Tentativa</TableHead>
                      <TableHead>Último Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retries.map((retry, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {retry.sessionDir}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {retry.attempts}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {retry.lastAttempt
                            ? format(
                                new Date(retry.lastAttempt),
                                "dd/MM/yyyy HH:mm:ss",
                                { locale: ptBR },
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {retry.lastError ? (
                            <div className="flex items-start gap-1.5 max-w-xs">
                              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                              <span className="text-xs text-destructive">
                                {retry.lastError}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
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

function MiniCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
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
