"use client";

import { DashboardData, DashboardPage } from "@/lib/types";
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Cpu,
  Radio,
  FileText,
  RotateCcw,
  Upload,
} from "lucide-react";

interface Props {
  data: DashboardData;
  currentPage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  onReset: () => void;
}

const NAV_ITEMS: {
  page: DashboardPage;
  label: string;
  icon: React.ElementType;
}[] = [
  { page: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { page: "errors", label: "Erros & Crashes", icon: AlertTriangle },
  { page: "sessions", label: "Sessões", icon: Users },
  { page: "resources", label: "Recursos", icon: Cpu },
  { page: "mediasoup", label: "MediaSoup", icon: Radio },
  { page: "logs", label: "Logs", icon: FileText },
];

export function Sidebar({ data, currentPage, onNavigate, onReset }: Props) {
  const { summary } = data;

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          SV
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Log Dashboard</p>
          <p className="text-[10px] text-muted-foreground">Sala Virtual</p>
        </div>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 gap-1.5 border-b px-3 py-3">
        <MiniStat label="Logs" value={summary.totalLogs} />
        <MiniStat
          label="Crashes"
          value={summary.totalCrashes}
          color="text-orange-500"
        />
        <MiniStat
          label="Erros"
          value={summary.totalErrors}
          color="text-red-500"
        />
        <MiniStat
          label="Sessões"
          value={summary.totalSessions}
          color="text-green-500"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-2 py-2">
        <button
          onClick={onReset}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Upload className="h-4 w-4" />
          Novo upload
        </button>
      </div>
    </aside>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-md border px-2 py-1.5 text-center">
      <p className={`text-base font-bold leading-none ${color ?? ""}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
