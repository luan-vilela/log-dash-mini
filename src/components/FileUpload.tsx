"use client";

import { useCallback, useState } from "react";
import { Upload, FileArchive, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploadProps {
  onFileLoaded: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileLoaded, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".zip")) {
        onFileLoaded(file);
      }
    },
    [onFileLoaded],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileLoaded(file);
      }
    },
    [onFileLoaded],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="space-y-2">
          <div className="flex justify-center">
            <FileArchive className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Log Dashboard</h1>
          <p className="text-muted-foreground">
            Faça upload do arquivo .zip com os logs da sala virtual para
            visualizar o dashboard de métricas
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <label
              htmlFor="file-upload"
              className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Processando logs...</p>
                    <p className="text-xs text-muted-foreground">
                      Extraindo e analisando os arquivos
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Arraste o .zip aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aceita arquivos .zip com logs da sala virtual
                    </p>
                  </div>
                </>
              )}
              <input
                id="file-upload"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
