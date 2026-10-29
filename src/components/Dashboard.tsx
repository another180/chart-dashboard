"use client";

import { exportCsv, exportElementPdf, exportElementPng } from "@/lib/export";
import { parseCsvText, parseFile } from "@/lib/parse";
import { buildKpis, filterRows, recommendCharts } from "@/lib/recommend";
import { SAMPLE_CSV, SAMPLE_FILENAME } from "@/lib/sample-data";
import type { ChartKind, ChartSpec, Dataset } from "@/lib/types";
import { useMemo, useRef, useState } from "react";
import { DataPreview } from "./DataPreview";
import { DashboardGrid } from "./DashboardGrid";
import { FileDrop } from "./FileDrop";
import { KpiRow } from "./KpiRow";

export function Dashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [specs, setSpecs] = useState<ChartSpec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [customX, setCustomX] = useState("");
  const [customY, setCustomY] = useState("");
  const [customKind, setCustomKind] = useState<ChartKind>("bar");

  const filteredRows = useMemo(() => {
    if (!dataset) return [];
    return filterRows(dataset.rows, filterColumn, filterValue);
  }, [dataset, filterColumn, filterValue]);

  const kpis = useMemo(
    () => (dataset ? buildKpis(dataset, filteredRows) : []),
    [dataset, filteredRows],
  );

  const filterOptions = useMemo(() => {
    if (!dataset || !filterColumn) return [];
    return Array.from(
      new Set(dataset.rows.map((row) => String(row[filterColumn] ?? ""))),
    ).filter(Boolean);
  }, [dataset, filterColumn]);

  const categoricalColumns =
    dataset?.columns.filter((column) => column.type === "categorical") ?? [];

  async function loadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      applyDataset(await parseFile(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    setError(null);
    applyDataset(parseCsvText(SAMPLE_CSV, SAMPLE_FILENAME));
  }

  function applyDataset(next: Dataset) {
    if (!next.rows.length) {
      setError("The file did not contain any rows");
      setDataset(null);
      setSpecs([]);
      return;
    }
    setDataset(next);
    setSpecs(recommendCharts(next));
    setFilterColumn("");
    setFilterValue("");
    setCustomX(next.columns[0]?.name ?? "");
    setCustomY(
      next.columns.find((column) => column.type === "numeric")?.name ??
        next.columns[1]?.name ??
        "",
    );
  }

  function addCustomChart() {
    if (!customX || !customY) return;
    const spec: ChartSpec = {
      id: `custom-${Date.now()}`,
      kind: customKind,
      title: `${customY} by ${customX}`,
      xKey: customX,
      yKey: customY,
      aggregate: customKind === "scatter" || customKind === "line" || customKind === "area"
        ? undefined
        : "sum",
    };
    setSpecs((current) => [...current, spec]);
  }

  async function handleDashboardPdf() {
    if (!dashboardRef.current) return;
    setBusy(true);
    try {
      await exportElementPdf(dashboardRef.current, "dashboard.pdf");
    } catch {
      setError("PDF export failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleChartPng(element: HTMLElement, title: string) {
    const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      await exportElementPng(element, `${safe || "chart"}.png`);
    } catch {
      setError("PNG export failed");
    }
  }

  return (
    <div className="min-h-full bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Chart Dashboard</h1>
            <p className="text-sm text-slate-500">
              Upload data and export charts as PNG, CSV, or PDF
            </p>
          </div>
          {dataset ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  exportCsv(filteredRows, `${dataset.fileName.replace(/\.[^.]+$/, "")}.csv`)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Download CSV
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDashboardPdf}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Export dashboard PDF
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <FileDrop onFile={loadFile} onSample={loadSample} disabled={busy} />
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {dataset ? (
          <div ref={dashboardRef} className="space-y-6 rounded-2xl bg-slate-100">
            <KpiRow kpis={kpis} />
            <DataPreview dataset={dataset} rows={filteredRows} />

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold">Controls</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">Filter column</span>
                  <select
                    value={filterColumn}
                    onChange={(event) => {
                      setFilterColumn(event.target.value);
                      setFilterValue("");
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="">None</option>
                    {categoricalColumns.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">Filter value</span>
                  <select
                    value={filterValue}
                    disabled={!filterColumn}
                    onChange={(event) => setFilterValue(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50"
                  >
                    <option value="">All</option>
                    {filterOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">Custom X</span>
                  <select
                    value={customX}
                    onChange={(event) => setCustomX(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    {dataset.columns.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">Custom Y</span>
                  <select
                    value={customY}
                    onChange={(event) => setCustomY(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    {dataset.columns.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  value={customKind}
                  onChange={(event) => setCustomKind(event.target.value as ChartKind)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="bar">bar</option>
                  <option value="line">line</option>
                  <option value="area">area</option>
                  <option value="scatter">scatter</option>
                  <option value="pie">pie</option>
                </select>
                <button
                  type="button"
                  onClick={addCustomChart}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Add chart
                </button>
              </div>
            </section>

            <DashboardGrid
              specs={specs}
              rows={filteredRows}
              onKindChange={(id, kind) =>
                setSpecs((current) =>
                  current.map((spec) => (spec.id === id ? { ...spec, kind } : spec)),
                )
              }
              onExportPng={handleChartPng}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
