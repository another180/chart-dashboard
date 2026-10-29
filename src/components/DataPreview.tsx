"use client";

import type { Dataset, Row } from "@/lib/types";

type DataPreviewProps = {
  dataset: Dataset;
  rows: Row[];
};

export function DataPreview({ dataset, rows }: DataPreviewProps) {
  const preview = rows.slice(0, 6);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Data preview</h2>
          <p className="text-sm text-slate-500">{dataset.fileName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dataset.columns.map((column) => (
            <span
              key={column.name}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {column.name}
              <span className="ml-1 text-slate-400">{column.type}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {dataset.columns.map((column) => (
                <th key={column.name} className="px-4 py-2 font-medium">
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                {dataset.columns.map((column) => (
                  <td key={column.name} className="px-4 py-2 text-slate-800">
                    {String(row[column.name] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
