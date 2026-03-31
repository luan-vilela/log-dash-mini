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
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  AlertTriangle,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToCsv } from "@/lib/export-csv";

interface Props {
  data: DashboardData;
}

const THRESHOLDS = { cpu: 80, memory: 85, disk: 90, ports: 80 };

export function ResourcesPage({ data }: Props) {
  const { crashes } = data;

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
    .map((m) => ({ ...m, date: safeFormat(m.timestamp) }));

  const crashChartData = crashes.map((c) => ({
    label: safeFormatShort(c.timestamp),
    CPU: c.resourcesAtCrash.cpu.usagePercent,
    Memória: c.resourcesAtCrash.memory.usagePercent,
    Disco: c.resourcesAtCrash.disk.usagePercent,
    Portas: c.resourcesAtCrash.ports.usagePercent,
  }));

  const latest = crashes.length > 0 ? crashes[crashes.length - 1] : null;

  // Compute alerts
  const alerts: {
    label: string;
    value: number;
    threshold: number;
    resource: string;
  }[] = [];
  if (latest) {
    const r = latest.resourcesAtCrash;
    if (r.cpu.usagePercent >= THRESHOLDS.cpu)
      alerts.push({
        label: "CPU",
        value: r.cpu.usagePercent,
        threshold: THRESHOLDS.cpu,
        resource: "cpu",
      });
    if (r.memory.usagePercent >= THRESHOLDS.memory)
      alerts.push({
        label: "Memória",
        value: r.memory.usagePercent,
        threshold: THRESHOLDS.memory,
        resource: "memory",
      });
    if (r.disk.usagePercent >= THRESHOLDS.disk)
      alerts.push({
        label: "Disco",
        value: r.disk.usagePercent,
        threshold: THRESHOLDS.disk,
        resource: "disk",
      });
    if (r.ports.usagePercent >= THRESHOLDS.ports)
      alerts.push({
        label: "Portas",
        value: r.ports.usagePercent,
        threshold: THRESHOLDS.ports,
        resource: "ports",
      });
  }

  const handleExportMemory = () => {
    exportToCsv(
      `recursos-memoria-${new Date().toISOString().slice(0, 10)}.csv`,
      memoryTimeline.map((m) => ({
        timestamp: m.timestamp,
        fonte: m.source,
        rss_mb: m.rss.toFixed(0),
        heap_used_mb: m.heapUsed.toFixed(0),
        heap_total_mb: m.heapTotal.toFixed(0),
        uptime_h: (m.uptime / 3600).toFixed(1),
        sessoes_ativas: m.activeSessionsActive || "",
        sessoes_total: m.activeSessions || "",
      })),
    );
  };

  const handleExportCrashes = () => {
    exportToCsv(
      `recursos-crashes-${new Date().toISOString().slice(0, 10)}.csv`,
      crashes.map((c) => ({
        timestamp: c.timestamp,
        tipo: c.crashType,
        cpu_pct: c.resourcesAtCrash.cpu.usagePercent,
        cores: c.resourcesAtCrash.cpu.cores,
        ram_used_gb: (c.resourcesAtCrash.memory.usedMB / 1024).toFixed(1),
        ram_total_gb: (c.resourcesAtCrash.memory.totalMB / 1024).toFixed(1),
        disco_pct: c.resourcesAtCrash.disk.usagePercent,
        portas_used: c.resourcesAtCrash.ports.used,
        portas_total: c.resourcesAtCrash.ports.total,
      })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Recursos do Sistema</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Snapshots de recursos no momento de crashes e erros
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportMemory}
            disabled={memoryTimeline.length === 0}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Memória CSV
          </button>
          <button
            onClick={handleExportCrashes}
            disabled={crashes.length === 0}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Crashes CSV
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-500/30">
          <CardContent className="flex flex-wrap gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-500">
                Alertas de Recursos
              </p>
              {alerts.map((a) => (
                <p key={a.resource} className="text-xs text-muted-foreground">
                  <span className="text-red-500 font-medium">{a.label}</span>{" "}
                  está em{" "}
                  <span className="font-bold text-red-500">{a.value}%</span>{" "}
                  (limite: {a.threshold}%)
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current gauges */}
      {latest && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ResourceGauge
            label="CPU"
            icon={Cpu}
            value={latest.resourcesAtCrash.cpu.usagePercent}
            detail={`${latest.resourcesAtCrash.cpu.cores} cores`}
            threshold={THRESHOLDS.cpu}
          />
          <ResourceGauge
            label="Memória"
            icon={MemoryStick}
            value={latest.resourcesAtCrash.memory.usagePercent}
            detail={`${(latest.resourcesAtCrash.memory.usedMB / 1024).toFixed(1)} / ${(latest.resourcesAtCrash.memory.totalMB / 1024).toFixed(1)} GB`}
            threshold={THRESHOLDS.memory}
          />
          <ResourceGauge
            label="Disco"
            icon={HardDrive}
            value={latest.resourcesAtCrash.disk.usagePercent}
            detail={`${latest.resourcesAtCrash.disk.usedGB.toFixed(1)} / ${latest.resourcesAtCrash.disk.totalGB.toFixed(1)} GB`}
            threshold={THRESHOLDS.disk}
          />
          <ResourceGauge
            label="Portas"
            icon={Network}
            value={latest.resourcesAtCrash.ports.usagePercent}
            detail={`${latest.resourcesAtCrash.ports.used} / ${latest.resourcesAtCrash.ports.total}`}
            threshold={THRESHOLDS.ports}
          />
        </div>
      )}

      {/* Bar chart */}
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
                <BarChart data={crashChartData} barCategoryGap="30%" barGap={4}>
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
                  <Bar
                    dataKey="CPU"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="Disco"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="Memória"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="Portas"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory timeline */}
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

      {/* Crash resource details */}
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
  threshold,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  detail: string;
  threshold: number;
}) {
  const overThreshold = value >= threshold;
  return (
    <Card className={overThreshold ? "border-red-500/40" : ""}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            {overThreshold && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-sm font-bold ${getColor(value)}`}>
              {value}%
            </span>
          </div>
        </div>
        <Progress value={value} className="h-2" />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{detail}</p>
          <p className="text-[10px] text-muted-foreground">
            Limite: {threshold}%
          </p>
        </div>
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
