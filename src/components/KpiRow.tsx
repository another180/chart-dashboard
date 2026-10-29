"use client";

import type { Kpi } from "@/lib/types";

type KpiRowProps = {
  kpis: Kpi[];
};

export function KpiRow({ kpis }: KpiRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {kpi.label}
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
