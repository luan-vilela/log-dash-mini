"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SdpInfo } from "@/lib/types";
import { Radio, AudioLines, ArrowUpRight } from "lucide-react";

interface Props {
  sdpFiles: SdpInfo[];
}

export function MediaSoupHealth({ sdpFiles }: Props) {
  if (sdpFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Saúde do MediaSoup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum arquivo SDP encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate codec info
  const codecs = new Map<string, number>();
  const ports = new Set<number>();
  let totalParticipants = 0;

  for (const sdp of sdpFiles) {
    codecs.set(sdp.codec, (codecs.get(sdp.codec) ?? 0) + 1);
    if (sdp.rtpPort) ports.add(sdp.rtpPort);
    if (sdp.rtcpPort) ports.add(sdp.rtcpPort);
    totalParticipants++;
  }

  const roles = {
    pac: sdpFiles.filter((s) => s.role === "pac").length,
    prof: sdpFiles.filter((s) => s.role === "prof").length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Saúde do MediaSoup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Codec info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AudioLines className="h-3.5 w-3.5" />
            Codecs
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(codecs.entries()).map(([codec, count]) => (
              <Badge key={codec} variant="secondary">
                {codec.toUpperCase()} ({count}x)
              </Badge>
            ))}
          </div>
          {sdpFiles[0] && (
            <p className="text-xs text-muted-foreground">
              {sdpFiles[0].sampleRate / 1000}kHz · {sdpFiles[0].channels}ch ·{" "}
              {sdpFiles[0].fmtpParams}
            </p>
          )}
        </div>

        {/* Ports */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Radio className="h-3.5 w-3.5" />
            Portas RTP/RTCP
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sdpFiles.map((sdp) => (
              <div
                key={sdp.participantId}
                className="rounded-md border px-2 py-1 text-xs"
              >
                <span className="font-medium">
                  {sdp.role === "prof" ? "Prof" : "Pac"}
                </span>
                : RTP {sdp.rtpPort} / RTCP {sdp.rtcpPort}
              </div>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Participantes ({totalParticipants})
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border px-3 py-2 text-center">
              <p className="text-lg font-bold">{roles.prof}</p>
              <p className="text-xs text-muted-foreground">Profissionais</p>
            </div>
            <div className="rounded-md border px-3 py-2 text-center">
              <p className="text-lg font-bold">{roles.pac}</p>
              <p className="text-xs text-muted-foreground">Pacientes</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Direção: {sdpFiles[0]?.direction ?? "—"} · Tool:{" "}
            {sdpFiles[0]?.tool ?? "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
