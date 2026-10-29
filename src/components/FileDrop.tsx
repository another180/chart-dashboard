"use client";

import { useRef, useState } from "react";

type FileDropProps = {
  onFile: (file: File) => void;
  onSample: () => void;
  disabled?: boolean;
};

export function FileDrop({ onFile, onSample, disabled }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? "border-indigo-500 bg-indigo-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <p className="text-lg font-semibold text-slate-900">Drop a data file</p>
      <p className="mt-1 text-sm text-slate-500">
        CSV, Excel (.xlsx), or JSON. Charts are chosen from the columns.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Choose file
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSample}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Load sample sales data
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.xlsx,.xls,.json"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
