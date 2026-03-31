"use client";

import { DashboardData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorTimeline } from "@/components/cards/ErrorTimeline";
import { ErrorTypes } from "@/components/cards/ErrorTypes";
import { SystemResources } from "@/components/cards/SystemResources";
import { RetryRecovery } from "@/components/cards/RetryRecovery";
import {
  AlertTriangle,
  Zap,
  FileText,
  Users,
  CalendarDays,
  Clock,
  Server,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: DashboardData;
}

export function OverviewPage({ data }: Props) {
  const { summary } = data;

  const latestCrash = data.crashes[data.crashes.length - 1];
  const latestError = data.errors[data.errors.length - 1];

  const uptimeHours = latestError
    ? (latestError.systemInfo.uptime / 3600).toFixed(1)
    : null;

  const statCards = [
    {
      label: "Total de Logs",
      value: summary.totalLogs,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Crashes",
      value: summary.totalCrashes,
      icon: Zap,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Erros de Gravação",
      value: summary.totalErrors,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Sessões",
      value: summary.totalSessions,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Participantes",
      value: summary.totalParticipants,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Retries",
      value: data.retries.length,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold">Visão Geral</h2>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
          {summary.dateRange && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {safeFormat(summary.dateRange.start)} →{" "}
              {safeFormat(summary.dateRange.end)}
            </span>
          )}
          {uptimeHours && (
            <span className="flex items-center gap-1">
              <Server className="h-3.5 w-3.5" />
              Uptime: {uptimeHours}h
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row: Timeline + Error Types */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ErrorTimeline
          logs={data.logs}
          crashes={data.crashes}
          errors={data.errors}
        />
        <ErrorTypes crashes={data.crashes} errors={data.errors} />
      </div>

      {/* Row: System Resources + Retries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SystemResources crashes={data.crashes} />
        <RetryRecovery retries={data.retries} />
      </div>

      {/* Latest events */}
      {(latestCrash || latestError) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Últimos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestCrash && (
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    Crash: {latestCrash.crashType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {latestCrash.rootCause}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {safeFormatFull(latestCrash.timestamp)} · Room:{" "}
                    {latestCrash.roomId}
                  </p>
                </div>
              </div>
            )}
            {latestError && (
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    {latestError.errorType}: {latestError.errorMessage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Etapa: {latestError.stage} ·{" "}
                    {latestError.activeSessions.total} sessões ativas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {safeFormatFull(latestError.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function safeFormat(ts: string): string {
  try {
    return format(new Date(ts), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return ts;
  }
}

function safeFormatFull(ts: string): string {
  try {
    return format(new Date(ts), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  } catch {
    return ts;
  }
}
