export type ColumnType = "numeric" | "categorical" | "datetime";

export type Column = {
  name: string;
  type: ColumnType;
};

export type Row = Record<string, unknown>;

export type Dataset = {
  rows: Row[];
  columns: Column[];
  fileName: string;
};

export type ChartKind = "line" | "bar" | "scatter" | "pie" | "area";

export type ChartSpec = {
  id: string;
  kind: ChartKind;
  title: string;
  xKey: string;
  yKey: string;
  aggregate?: "sum" | "avg" | "count";
  histogramOf?: string;
};

export type Kpi = {
  label: string;
  value: string;
};
