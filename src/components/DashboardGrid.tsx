"use client";

import type { ChartKind, ChartSpec, Row } from "@/lib/types";
import { ChartCard } from "./ChartCard";

type DashboardGridProps = {
  specs: ChartSpec[];
  rows: Row[];
  onKindChange: (id: string, kind: ChartKind) => void;
  onExportPng: (element: HTMLElement, title: string) => void;
};

export function DashboardGrid({
  specs,
  rows,
  onKindChange,
  onExportPng,
}: DashboardGridProps) {
  if (!specs.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No charts could be inferred from this dataset. Try a file with numeric or date
        columns.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {specs.map((spec) => (
        <ChartCard
          key={spec.id}
          spec={spec}
          rows={rows}
          onKindChange={(kind) => onKindChange(spec.id, kind)}
          onExportPng={onExportPng}
        />
      ))}
    </div>
  );
}
