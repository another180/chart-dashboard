import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Column, ColumnType, Dataset, Row } from "./types";

function looksLikeDate(value: string): boolean {
  if (!/[\-/]|^\d{4}$/.test(value) && !/\d{1,2}:\d{2}/.test(value)) {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(value) && value.length <= 4) {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function inferColumnType(values: unknown[]): ColumnType {
  const nonEmpty = values.filter(
    (value) => value !== null && value !== undefined && String(value).trim() !== "",
  );
  if (nonEmpty.length === 0) return "categorical";

  const sample = nonEmpty.slice(0, 200);
  let numericCount = 0;
  let dateCount = 0;

  for (const value of sample) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      dateCount += 1;
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      numericCount += 1;
      continue;
    }
    const text = String(value).trim();
    if (/^-?\d+(\.\d+)?$/.test(text)) {
      numericCount += 1;
      continue;
    }
    if (looksLikeDate(text)) {
      dateCount += 1;
    }
  }

  const n = sample.length;
  if (numericCount / n >= 0.8) return "numeric";
  if (dateCount / n >= 0.8) return "datetime";
  return "categorical";
}

function normalizeCell(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).trim();
  if (text === "") return "";
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text);
  }
  return text;
}

function rowsToDataset(rows: Row[], fileName: string): Dataset {
  const cleaned = rows
    .map((row) => {
      const next: Row = {};
      for (const [key, value] of Object.entries(row)) {
        if (key.startsWith("__")) continue;
        next[key] = normalizeCell(value);
      }
      return next;
    })
    .filter((row) => Object.values(row).some((value) => value !== "" && value !== null));

  const names = Array.from(
    cleaned.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const columns: Column[] = names.map((name) => ({
    name,
    type: inferColumnType(cleaned.map((row) => row[name])),
  }));

  return { rows: cleaned, columns, fileName };
}

function parseCsv(text: string, fileName: string): Dataset {
  const parsed = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length && !parsed.data.length) {
    throw new Error(parsed.errors[0]?.message ?? "Could not parse CSV");
  }
  return rowsToDataset(parsed.data, fileName);
}

function parseExcel(buffer: ArrayBuffer, fileName: string): Dataset {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The spreadsheet has no sheets");
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  return rowsToDataset(rows, fileName);
}

function parseJson(text: string, fileName: string): Dataset {
  const data: unknown = JSON.parse(text);
  let rows: Row[] = [];

  if (Array.isArray(data)) {
    rows = data.map((item, index) => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        return item as Row;
      }
      return { value: item, index };
    });
  } else if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const nested = record.data ?? record.rows ?? record.records;
    if (Array.isArray(nested)) {
      rows = nested.filter(
        (item): item is Row =>
          item !== null && typeof item === "object" && !Array.isArray(item),
      );
    } else {
      rows = [record];
    }
  }

  if (!rows.length) {
    throw new Error("JSON must be an array of objects");
  }
  return rowsToDataset(rows, fileName);
}

export async function parseFile(file: File): Promise<Dataset> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseCsv(await file.text(), file.name);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(await file.arrayBuffer(), file.name);
  }
  if (name.endsWith(".json")) {
    return parseJson(await file.text(), file.name);
  }
  throw new Error("Use a CSV, Excel, or JSON file");
}

export function parseCsvText(text: string, fileName: string): Dataset {
  return parseCsv(text, fileName);
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
