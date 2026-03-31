import { CrashReport } from "../types";

export function parseCrash(content: string): CrashReport {
  return JSON.parse(content) as CrashReport;
}
