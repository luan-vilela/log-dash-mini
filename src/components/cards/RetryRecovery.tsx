"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RetryMetadata } from "@/lib/types";
import { RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  retries: RetryMetadata[];
}

export function RetryRecovery({ retries }: Props) {
  if (retries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Retries e Recuperação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Nenhuma tentativa de retry encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAttempts = retries.reduce((s, r) => s + r.attempts, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Retries e Recuperação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border px-3 py-2 text-center">
            <p className="text-2xl font-bold">{retries.length}</p>
            <p className="text-xs text-muted-foreground">Sessões com retry</p>
          </div>
          <div className="rounded-md border px-3 py-2 text-center">
            <p className="text-2xl font-bold">{totalAttempts}</p>
            <p className="text-xs text-muted-foreground">Total de tentativas</p>
          </div>
        </div>

        {/* Detail per retry */}
        <div className="space-y-3">
          {retries.map((retry, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-mono">{retry.sessionDir}</span>
                </div>
                <Badge variant="secondary">
                  {retry.attempts} tentativa{retry.attempts !== 1 ? "s" : ""}
                </Badge>
              </div>

              {retry.lastAttempt && (
                <p className="text-xs text-muted-foreground">
                  Última tentativa:{" "}
                  {format(new Date(retry.lastAttempt), "dd/MM/yyyy HH:mm:ss", {
                    locale: ptBR,
                  })}
                </p>
              )}

              {retry.lastError && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  <p className="text-xs text-destructive">{retry.lastError}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
