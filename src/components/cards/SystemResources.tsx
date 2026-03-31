"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CrashReport } from "@/lib/types";
import { Cpu, HardDrive, MemoryStick, Network } from "lucide-react";

interface Props {
  crashes: CrashReport[];
}

export function SystemResources({ crashes }: Props) {
  if (crashes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recursos do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum crash report com dados de recursos encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Use the latest crash for resource info
  const latest = crashes[crashes.length - 1];
  const res = latest.resourcesAtCrash;

  const items = [
    {
      label: "CPU",
      icon: Cpu,
      value: res.cpu.usagePercent,
      detail: `${res.cpu.usagePercent}% usado · ${res.cpu.cores} cores`,
      color: getColor(res.cpu.usagePercent),
    },
    {
      label: "Memória",
      icon: MemoryStick,
      value: res.memory.usagePercent,
      detail: `${formatGB(res.memory.usedMB)} / ${formatGB(res.memory.totalMB)} GB`,
      color: getColor(res.memory.usagePercent),
    },
    {
      label: "Disco",
      icon: HardDrive,
      value: res.disk.usagePercent,
      detail: `${res.disk.usedGB.toFixed(1)} / ${res.disk.totalGB.toFixed(1)} GB`,
      color: getColor(res.disk.usagePercent),
    },
    {
      label: "Portas",
      icon: Network,
      value: res.ports.usagePercent,
      detail: `${res.ports.used} / ${res.ports.total} em uso`,
      color: getColor(res.ports.usagePercent),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Recursos do Sistema
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Snapshot no momento do último crash
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className={`text-sm font-semibold ${item.color}`}>
                {item.value}%
              </span>
            </div>
            <Progress value={item.value} className="h-2" />
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatGB(mb: number): string {
  return (mb / 1024).toFixed(1);
}

function getColor(pct: number): string {
  if (pct >= 80) return "text-red-500";
  if (pct >= 60) return "text-yellow-500";
  return "text-green-500";
}
