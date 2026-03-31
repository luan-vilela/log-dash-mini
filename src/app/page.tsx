"use client";

import { useState, useCallback } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Dashboard } from "@/components/Dashboard";
import { DashboardData } from "@/lib/types";
import { extractZip } from "@/lib/parsers/zip-extractor";

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractZip(file);
      if (
        result.summary.totalLogs === 0 &&
        result.summary.totalCrashes === 0 &&
        result.summary.totalErrors === 0 &&
        result.sessions.length === 0
      ) {
        setError(
          "Nenhum dado reconhecido no arquivo. Verifique se o .zip contém logs da sala virtual.",
        );
      } else {
        setData(result);
      }
    } catch (e) {
      setError(
        `Erro ao processar o arquivo: ${e instanceof Error ? e.message : "Erro desconhecido"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (data) {
    return <Dashboard data={data} onReset={() => setData(null)} />;
  }

  return (
    <div>
      <FileUpload onFileLoaded={handleFile} isLoading={isLoading} />
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
