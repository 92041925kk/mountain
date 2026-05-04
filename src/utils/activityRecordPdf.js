import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import { groupPdfTextItemsIntoRows, parseActivityRecordRows } from './activityRecordParser';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractActivityRecordFromPdf(file) {
  if (!file) throw new Error('請先選擇 PDF 檔案');
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('檔案格式不是 PDF');
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const rows = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    rows.push(...groupPdfTextItemsIntoRows(content.items, pageNumber));
  }

  return parseActivityRecordRows(rows);
}
