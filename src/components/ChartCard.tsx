"use client";

import { prepareChartData } from "@/lib/recommend";
import type { ChartKind, ChartSpec, Row } from "@/lib/types";
import { useRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#4f46e5", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];

const KINDS: ChartKind[] = ["line", "bar", "area", "scatter", "pie"];

type ChartCardProps = {
  spec: ChartSpec;
  rows: Row[];
  onKindChange: (kind: ChartKind) => void;
  onExportPng: (element: HTMLElement, title: string) => void;
};

export function ChartCard({ spec, rows, onKindChange, onExportPng }: ChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const data = prepareChartData(spec, rows);

  return (
    <article
      ref={cardRef}
      className="flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{spec.title}</h3>
        <div className="flex items-center gap-2">
          <select
            value={spec.kind}
            onChange={(event) => onKindChange(event.target.value as ChartKind)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (cardRef.current) onExportPng(cardRef.current, spec.title);
            }}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            PNG
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {data.length ? (
          <ChartBody spec={spec} data={data} />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">
            No values to plot for this chart.
          </p>
        )}
      </div>
    </article>
  );
}

function ChartBody({ spec, data }: { spec: ChartSpec; data: Row[] }) {
  const xKey = spec.histogramOf ? "bin" : spec.xKey;
  const yKey = spec.histogramOf ? "count" : spec.yKey;

  if (spec.kind === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (spec.kind === "scatter") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} name={xKey} type="number" />
          <YAxis dataKey={yKey} name={yKey} type="number" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (spec.kind === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (spec.kind === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={COLORS[1]}
            fill={COLORS[1]}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
