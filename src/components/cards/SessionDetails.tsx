"use client";

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
import { SessionInfo } from "@/lib/types";
import { Clock, Users, Film, AlertTriangle } from "lucide-react";

interface Props {
  sessions: SessionInfo[];
}

export function SessionDetails({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sessões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma sessão encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Detalhes das Sessões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sessão</TableHead>
              <TableHead>Participantes</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Gravação</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const crash = session.crashReports[0];
              const participants =
                crash?.sessionInfo?.participants ?? session.sdpFiles.length;
              const duration = crash?.sessionInfo?.duration;
              const fileSize = crash?.sessionInfo?.fileSize;

              return (
                <TableRow key={session.dirName}>
                  <TableCell className="font-mono text-xs">
                    {session.dirName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {participants}
                    </div>
                  </TableCell>
                  <TableCell>
                    {duration ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(duration)}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {session.hasRecording ? (
                      <div className="flex items-center gap-1">
                        <Film className="h-3 w-3 text-green-500" />
                        <span className="text-xs">
                          {fileSize ? formatBytes(fileSize) : "Sim"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.crashReports.length > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Crash
                      </Badge>
                    ) : session.retryMetadata ? (
                      <Badge variant="secondary" className="text-xs">
                        Retry
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        OK
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
