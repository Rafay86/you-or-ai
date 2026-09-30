import { DocSection } from './types';
import { UploadError, validateUpload } from './limits';

const splitLines = (t: string) => t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/** A line is a heading if it is Markdown, ends with a colon, is a multi-level number like "4.2 Escalation", or is ALL CAPS. */
function headingOf(line: string): string | null {
  const md = line.match(/^#{1,4}\s+(.*)$/);
  if (md) return md[1].trim();
  if (line.length > 70) return null;
  const colon = line.match(/^([A-Za-z][^:.]{1,60}):$/);
  if (colon) return colon[1].trim();
  const multi = line.match(/^\d+(?:\.\d+)+\s+([A-Za-z].{0,60})$/);
  if (multi) return multi[1].trim();
  if (/^[A-Z][A-Z0-9 &/,-]{3,}$/.test(line)) return line;
  return null;
}

/** Plain text and Markdown: headings become section names; other lines are numbered paragraphs. */
export function readText(text: string): DocSection[] {
  const out: DocSection[] = [];
  let section = '';
  let n = 0;
  for (const line of splitLines(text)) {
    const h = headingOf(line);
    if (h) {
      section = h;
      continue;
    }
    n += 1;
    out.push({ ref: section ? `Section: ${section}` : `Paragraph ${n}`, text: line });
  }
  return out;
}

export async function readPdf(buffer: ArrayBuffer, pdfjs: any): Promise<DocSection[]> {
  let doc: any;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: true }).promise;
  } catch {
    throw new UploadError('This PDF could not be opened. It may be damaged or password-protected.');
  }
  const out: DocSection[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Rebuild lines from text items using their vertical position.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items as any[]) {
      if (!it.str) continue;
      const y = Math.round(it.transform[5]);
      const row = rows.get(y) ?? [];
      row.push({ x: it.transform[4], s: it.str });
      rows.set(y, row);
    }
    const lines = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, r]) => r.sort((a, b) => a.x - b.x).map((c) => c.s).join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    for (const l of lines) out.push({ ref: `Page ${p}`, text: l });
  }
  if (out.length === 0) {
    throw new UploadError('No text was found in this PDF. It may be a scanned image; upload a text version or paste the steps into Quick Start.');
  }
  return out;
}

export async function readDocx(buffer: ArrayBuffer, mammoth: any): Promise<DocSection[]> {
  let html: string;
  try {
    // The browser build takes an ArrayBuffer; the Node build takes a Buffer.
    const input = typeof (globalThis as any).Buffer !== 'undefined' && !(globalThis as any).window ? { buffer: (globalThis as any).Buffer.from(buffer) } : { arrayBuffer: buffer };
    html = (await mammoth.convertToHtml(input)).value as string;
  } catch {
    throw new UploadError('This Word document could not be read. It may be damaged or password-protected.');
  }
  const out: DocSection[] = [];
  let section = '';
  let n = 0;
  const tagRe = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    const text = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    if (!text) continue;
    if (m[1].toLowerCase().startsWith('h')) {
      section = text;
      continue;
    }
    n += 1;
    out.push({ ref: section ? `Section: ${section}` : `Paragraph ${n}`, text: m[1].toLowerCase() === 'li' ? `- ${text}` : text });
  }
  if (out.length === 0) throw new UploadError('No text was found in this Word document.');
  return out;
}

/** Browser entry point. Reads the file locally; nothing is sent anywhere. */
export async function readDocumentFile(file: File): Promise<DocSection[]> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const ext = validateUpload(file, head);
  if (ext === 'txt' || ext === 'md') return readText(await file.text());
  const buffer = await file.arrayBuffer();
  if (ext === 'pdf') {
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return readPdf(buffer, pdfjs);
  }
  const mammoth: any = await import('mammoth/mammoth.browser');
  return readDocx(buffer, mammoth.default ?? mammoth);
}
