import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import Papa from "papaparse";
import type { Row } from "./types";

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(rows: Row[], fileName: string) {
  const csv = Papa.unparse(rows);
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
}

export async function exportElementPng(element: HTMLElement, fileName: string) {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
  const response = await fetch(dataUrl);
  triggerDownload(await response.blob(), fileName);
}

export async function exportElementPdf(element: HTMLElement, fileName: string) {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#f8fafc",
    cacheBust: true,
  });
  const image = new Image();
  image.src = dataUrl;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const orientation = image.width >= image.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / image.width, pageHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;
  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;
  pdf.addImage(dataUrl, "PNG", x, y, width, height);
  pdf.save(fileName);
}
