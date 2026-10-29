import { toNumber } from "./parse";
import type { ChartSpec, Dataset, Kpi, Row } from "./types";

function uniqueCount(rows: Row[], key: string): number {
  return new Set(rows.map((row) => String(row[key] ?? ""))).size;
}

export function recommendCharts(dataset: Dataset): ChartSpec[] {
  const specs: ChartSpec[] = [];
  const datetime = dataset.columns.filter((column) => column.type === "datetime");
  const numeric = dataset.columns.filter((column) => column.type === "numeric");
  const categorical = dataset.columns.filter(
    (column) => column.type === "categorical",
  );

  if (datetime[0] && numeric[0]) {
    specs.push({
      id: "line-time",
      kind: "line",
      title: `${numeric[0].name} over time`,
      xKey: datetime[0].name,
      yKey: numeric[0].name,
    });
    if (numeric[1]) {
      specs.push({
        id: "area-time",
        kind: "area",
        title: `${numeric[1].name} over time`,
        xKey: datetime[0].name,
        yKey: numeric[1].name,
      });
    }
  }

  if (categorical[0] && numeric[0]) {
    specs.push({
      id: "bar-cat",
      kind: "bar",
      title: `${numeric[0].name} by ${categorical[0].name}`,
      xKey: categorical[0].name,
      yKey: numeric[0].name,
      aggregate: "sum",
    });

    const cats = uniqueCount(dataset.rows, categorical[0].name);
    if (cats > 1 && cats <= 8) {
      specs.push({
        id: "pie-share",
        kind: "pie",
        title: `Share of ${numeric[0].name} by ${categorical[0].name}`,
        xKey: categorical[0].name,
        yKey: numeric[0].name,
        aggregate: "sum",
      });
    }
  }

  if (numeric.length >= 2) {
    specs.push({
      id: "scatter-xy",
      kind: "scatter",
      title: `${numeric[0].name} vs ${numeric[1].name}`,
      xKey: numeric[0].name,
      yKey: numeric[1].name,
    });
  }

  if (numeric[0] && !datetime.length) {
    specs.push({
      id: "hist-num",
      kind: "bar",
      title: `Distribution of ${numeric[0].name}`,
      xKey: "bin",
      yKey: "count",
      histogramOf: numeric[0].name,
    });
  }

  return specs.slice(0, 6);
}

export function buildKpis(dataset: Dataset, rows: Row[]): Kpi[] {
  const kpis: Kpi[] = [
    { label: "Rows", value: String(rows.length) },
    { label: "Columns", value: String(dataset.columns.length) },
  ];

  const numeric = dataset.columns.filter((column) => column.type === "numeric");
  for (const column of numeric.slice(0, 2)) {
    const values = rows
      .map((row) => toNumber(row[column.name]))
      .filter((value): value is number => value !== null);
    if (!values.length) continue;
    const sum = values.reduce((acc, value) => acc + value, 0);
    const avg = sum / values.length;
    kpis.push({
      label: `${column.name} avg`,
      value: formatNumber(avg),
    });
    kpis.push({
      label: `${column.name} min / max`,
      value: `${formatNumber(Math.min(...values))} / ${formatNumber(Math.max(...values))}`,
    });
  }

  return kpis.slice(0, 6);
}

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function prepareChartData(spec: ChartSpec, rows: Row[]): Row[] {
  if (spec.histogramOf) {
    return histogram(rows, spec.histogramOf);
  }

  if (spec.aggregate && spec.kind !== "scatter") {
    return aggregate(rows, spec.xKey, spec.yKey, spec.aggregate);
  }

  if (spec.kind === "scatter") {
    return rows
      .map((row) => ({
        [spec.xKey]: toNumber(row[spec.xKey]),
        [spec.yKey]: toNumber(row[spec.yKey]),
      }))
      .filter(
        (row) =>
          typeof row[spec.xKey] === "number" && typeof row[spec.yKey] === "number",
      );
  }

  return [...rows].sort((a, b) =>
    String(a[spec.xKey] ?? "").localeCompare(String(b[spec.xKey] ?? ""), undefined, {
      numeric: true,
    }),
  );
}

function aggregate(
  rows: Row[],
  xKey: string,
  yKey: string,
  mode: "sum" | "avg" | "count",
): Row[] {
  const groups = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const key = String(row[xKey] ?? "");
    const n = toNumber(row[yKey]) ?? 0;
    const current = groups.get(key) ?? { total: 0, count: 0 };
    current.total += n;
    current.count += 1;
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([key, stats]) => ({
    [xKey]: key,
    [yKey]:
      mode === "count"
        ? stats.count
        : mode === "avg"
          ? stats.total / Math.max(stats.count, 1)
          : stats.total,
  }));
}

function histogram(rows: Row[], column: string, bins = 8): Row[] {
  const values = rows
    .map((row) => toNumber(row[column]))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  if (!values.length) return [];

  const min = values[0];
  const max = values[values.length - 1];
  if (min === max) {
    return [{ bin: formatNumber(min), count: values.length }];
  }

  const width = (max - min) / bins;
  const counts = Array.from({ length: bins }, () => 0);
  for (const value of values) {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    counts[index] += 1;
  }

  return counts.map((count, index) => {
    const start = min + index * width;
    const end = index === bins - 1 ? max : start + width;
    return {
      bin: `${formatNumber(start)}–${formatNumber(end)}`,
      count,
    };
  });
}

export function filterRows(
  rows: Row[],
  column: string,
  value: string,
): Row[] {
  if (!column || !value) return rows;
  return rows.filter((row) => String(row[column] ?? "") === value);
}
