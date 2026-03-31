"use client";

import { DashboardData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Cpu, HardDrive, MemoryStick, Network } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: DashboardData;
}

export function ResourcesPage({ data }: Props) {
  const { crashes } = data;

  // Also extract memory info from error reports
  const errorMemory = data.errors.map((e) => ({
    timestamp: e.timestamp,
    rss: e.systemInfo.memory.rss / 1024 / 1024,
    heapUsed: e.systemInfo.memory.heapUsed / 1024 / 1024,
    heapTotal: e.systemInfo.memory.heapTotal / 1024 / 1024,
    uptime: e.systemInfo.uptime,
    activeSessions: e.activeSessions.total,
    activeSessionsActive: e.activeSessions.active,
    source: "error" as const,
  }));

  // Extract memory info from logs
  const logMemory = data.logs
    .filter((l) => l.context?.memory)
    .map((l) => ({
      timestamp: l.timestamp,
      rss: (l.context.memory?.rss ?? 0) / 1024 / 1024,
      heapUsed: (l.context.memory?.heapUsed ?? 0) / 1024 / 1024,
      heapTotal: (l.context.memory?.heapTotal ?? 0) / 1024 / 1024,
      uptime: l.context.uptime ?? 0,
      activeSessions: 0,
      activeSessionsActive: 0,
      source: "log" as const,
    }));

  const memoryTimeline = [...errorMemory, ...logMemory]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    .map((m) => ({
      ...m,
      date: safeFormat(m.timestamp),
    }));

  // Chart data for crash resource snapshots
  const crashChartData = crashes.map((c) => ({
    label: safeFormatShort(c.timestamp),
    CPU: c.resourcesAtCrash.cpu.usagePercent,
    Memória: c.resourcesAtCrash.memory.usagePercent,
    Disco: c.resourcesAtCrash.disk.usagePercent,
    Portas: c.resourcesAtCrash.ports.usagePercent,
  }));

  const latest = crashes.length > 0 ? crashes[crashes.length - 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Recursos do Sistema</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Snapshots de recursos no momento de crashes e erros
        </p>
      </div>

      {/* Current gauges (latest crash) */}
      {latest && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ResourceGauge
            label="CPU"
            icon={Cpu}
            value={latest.resourcesAtCrash.cpu.usagePercent}
            detail={`${latest.resourcesAtCrash.cpu.cores} cores`}
          />
          <ResourceGauge
            label="Memória"
            icon={MemoryStick}
            value={latest.resourcesAtCrash.memory.usagePercent}
            detail={`${(latest.resourcesAtCrash.memory.usedMB / 1024).toFixed(1)} / ${(latest.resourcesAtCrash.memory.totalMB / 1024).toFixed(1)} GB`}
          />
          <ResourceGauge
            label="Disco"
            icon={HardDrive}
            value={latest.resourcesAtCrash.disk.usagePercent}
            detail={`${latest.resourcesAtCrash.disk.usedGB.toFixed(1)} / ${latest.resourcesAtCrash.disk.totalGB.toFixed(1)} GB`}
          />
          <ResourceGauge
            label="Portas"
            icon={Network}
            value={latest.resourcesAtCrash.ports.usagePercent}
            detail={`${latest.resourcesAtCrash.ports.used} / ${latest.resourcesAtCrash.ports.total}`}
          />
        </div>
      )}

      {/* Resource comparison bar chart */}
      {crashChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Uso de Recursos nos Crashes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crashChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    formatter={(v) => <span className="text-xs">{v}</span>}
                  />
                  <Bar dataKey="CPU" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Memória" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Disco" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Portas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory timeline from error reports / logs */}
      {memoryTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Uso de Memória do Processo
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Dados extraídos de error reports e logs
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Momento</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>RSS</TableHead>
                  <TableHead>Heap Usado</TableHead>
                  <TableHead>Heap Total</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Sessões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memoryTimeline.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {m.date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.source === "error" ? "destructive" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {m.source === "error" ? "Erro" : "Log"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.rss.toFixed(0)} MB
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.heapUsed.toFixed(0)} MB
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.heapTotal.toFixed(0)} MB
                    </TableCell>
                    <TableCell className="text-xs">
                      {(m.uptime / 3600).toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.activeSessions > 0
                        ? `${m.activeSessionsActive}/${m.activeSessions}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Crash resource details table */}
      {crashes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Detalhes de Recursos por Crash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPU %</TableHead>
                  <TableHead>Cores</TableHead>
                  <TableHead>RAM Usada</TableHead>
                  <TableHead>RAM Total</TableHead>
                  <TableHead>Disco %</TableHead>
                  <TableHead>Portas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crashes.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {safeFormat(c.timestamp)}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {c.crashType}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span
                        className={getColor(
                          c.resourcesAtCrash.cpu.usagePercent,
                        )}
                      >
                        {c.resourcesAtCrash.cpu.usagePercent}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.resourcesAtCrash.cpu.cores}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(c.resourcesAtCrash.memory.usedMB / 1024).toFixed(1)} GB
                    </TableCell>
                    <TableCell className="text-xs">
                      {(c.resourcesAtCrash.memory.totalMB / 1024).toFixed(1)} GB
                    </TableCell>
                    <TableCell className="text-xs">
                      <span
                        className={getColor(
                          c.resourcesAtCrash.disk.usagePercent,
                        )}
                      >
                        {c.resourcesAtCrash.disk.usagePercent}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.resourcesAtCrash.ports.used}/
                      {c.resourcesAtCrash.ports.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {crashes.length === 0 && memoryTimeline.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum dado de recursos disponível
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResourceGauge({
  label,
  icon: Icon,
  value,
  detail,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className={`text-sm font-bold ${getColor(value)}`}>
            {value}%
          </span>
        </div>
        <Progress value={value} className="h-2" />
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function getColor(pct: number): string {
  if (pct >= 80) return "text-red-500";
  if (pct >= 60) return "text-yellow-500";
  return "text-green-500";
}

function safeFormat(ts: string): string {
  try {
    return format(new Date(ts), "dd/MM/yy HH:mm:ss", { locale: ptBR });
  } catch {
    return ts;
  }
}

function safeFormatShort(ts: string): string {
  try {
    return format(new Date(ts), "dd/MM HH:mm", { locale: ptBR });
  } catch {
    return ts;
  }
}
