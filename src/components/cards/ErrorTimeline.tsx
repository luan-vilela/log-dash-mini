"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrashReport, ErrorReport, LogEntry } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  logs: LogEntry[];
  crashes: CrashReport[];
  errors: ErrorReport[];
}

interface TimePoint {
  date: string;
  errors: number;
  crashes: number;
  warnings: number;
}

export function ErrorTimeline({ logs, crashes, errors }: Props) {
  const dateMap = new Map<string, TimePoint>();

  // Count log errors/warnings per day
  for (const log of logs) {
    const d = toDateKey(log.timestamp);
    const point = getOrCreate(dateMap, d);
    if (log.level === "ERROR") point.errors++;
    if (log.level === "WARN") point.warnings++;
  }

  // Count crashes per day
  for (const crash of crashes) {
    const d = toDateKey(crash.timestamp);
    const point = getOrCreate(dateMap, d);
    point.crashes++;
  }

  // Count error reports per day
  for (const err of errors) {
    const d = toDateKey(err.timestamp);
    const point = getOrCreate(dateMap, d);
    point.errors++;
  }

  const data = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Timeline de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Timeline de Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) =>
                  format(new Date(v), "dd/MM", { locale: ptBR })
                }
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) =>
                  format(new Date(v as string), "dd/MM/yyyy", { locale: ptBR })
                }
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="errors"
                name="Erros"
                stroke="#ef4444"
                fill="url(#errGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="crashes"
                name="Crashes"
                stroke="#f97316"
                fill="url(#crashGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="warnings"
                name="Warnings"
                stroke="#eab308"
                fill="url(#warnGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function toDateKey(ts: string): string {
  try {
    return format(new Date(ts), "yyyy-MM-dd");
  } catch {
    return "unknown";
  }
}

function getOrCreate(map: Map<string, TimePoint>, date: string): TimePoint {
  if (!map.has(date)) {
    map.set(date, { date, errors: 0, crashes: 0, warnings: 0 });
  }
  return map.get(date)!;
}
