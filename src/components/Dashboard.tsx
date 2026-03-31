"use client";

import { useState, useCallback } from "react";
import { DashboardData, DashboardPage } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { OverviewPage } from "./pages/OverviewPage";
import { ErrorsPage } from "./pages/ErrorsPage";
import { SessionsPage } from "./pages/SessionsPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { MediaSoupPage } from "./pages/MediaSoupPage";
import { LogsPage } from "./pages/LogsPage";
import { Menu, X } from "lucide-react";

interface Props {
  data: DashboardData;
  onReset: () => void;
}

export interface NavigateOptions {
  page: DashboardPage;
  filter?: string;
}

export function Dashboard({ data, onReset }: Props) {
  const [currentPage, setCurrentPage] = useState<DashboardPage>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crossFilter, setCrossFilter] = useState<string | undefined>();

  const navigateTo = useCallback((opts: NavigateOptions) => {
    setCurrentPage(opts.page);
    setCrossFilter(opts.filter);
    setSidebarOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (page: DashboardPage) => {
      navigateTo({ page });
    },
    [navigateTo],
  );

  const pageContent: Record<DashboardPage, React.ReactNode> = {
    overview: <OverviewPage data={data} onNavigate={navigateTo} />,
    errors: (
      <ErrorsPage
        data={data}
        initialFilter={crossFilter}
        onNavigate={navigateTo}
      />
    ),
    sessions: (
      <SessionsPage
        data={data}
        initialFilter={crossFilter}
        onNavigate={navigateTo}
      />
    ),
    resources: <ResourcesPage data={data} />,
    mediasoup: <MediaSoupPage data={data} onNavigate={navigateTo} />,
    logs: (
      <LogsPage
        data={data}
        initialFilter={crossFilter}
        onNavigate={navigateTo}
      />
    ),
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          data={data}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onReset={onReset}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md border p-1.5 hover:bg-muted"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
          <span className="text-sm font-semibold">Log Dashboard</span>
        </div>

        <div className="p-4 lg:p-6">{pageContent[currentPage]}</div>
      </main>
    </div>
  );
}
