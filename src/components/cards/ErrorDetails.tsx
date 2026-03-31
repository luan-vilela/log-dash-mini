"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ErrorReport } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Server, Users } from "lucide-react";
import { useState } from "react";

interface Props {
  errors: ErrorReport[];
}

export function ErrorDetails({ errors }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Detalhes dos Erros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum erro de gravação encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Detalhes dos Erros de Gravação
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {errors.length} erro{errors.length !== 1 ? "s" : ""} encontrado
          {errors.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {errors.map((err, i) => (
          <div
            key={i}
            className="rounded-lg border p-3 space-y-2 cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{err.errorMessage}</p>
                  <p className="text-xs text-muted-foreground">
                    {safeFormat(err.timestamp)} · Etapa: {err.stage}
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="shrink-0 text-xs">
                {err.errorType}
              </Badge>
            </div>

            {/* Expanded details */}
            {expanded === i && (
              <div className="space-y-3 pt-2">
                <Separator />

                {/* Room/Professional */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Room ID: </span>
                    <span className="font-mono">{err.roomId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Profissional:{" "}
                    </span>
                    <span>{err.professional}</span>
                  </div>
                </div>

                {/* Stack trace */}
                {err.stackTrace && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Stack Trace
                    </p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs leading-relaxed">
                      {err.stackTrace}
                    </pre>
                  </div>
                )}

                {/* System info */}
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    <span>
                      Node {err.systemInfo.nodeVersion} ·{" "}
                      {err.systemInfo.platform}
                    </span>
                  </div>
                  <div>
                    RSS: {(err.systemInfo.memory.rss / 1024 / 1024).toFixed(0)}{" "}
                    MB · Heap:{" "}
                    {(err.systemInfo.memory.heapUsed / 1024 / 1024).toFixed(0)}{" "}
                    MB
                  </div>
                  <div>
                    Uptime: {(err.systemInfo.uptime / 3600).toFixed(1)}h
                  </div>
                </div>

                {/* Active sessions */}
                <div className="flex items-center gap-3 text-xs">
                  <Users className="h-3 w-3" />
                  <span>
                    {err.activeSessions.total} sessões total ·{" "}
                    {err.activeSessions.active} ativas
                  </span>
                  {!err.activeSessions.currentFound && (
                    <Badge
                      variant="outline"
                      className="text-xs text-yellow-600"
                    >
                      Sessão atual não encontrada
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function safeFormat(ts: string): string {
  try {
    return format(new Date(ts), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  } catch {
    return ts;
  }
}
