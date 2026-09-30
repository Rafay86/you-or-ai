import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateExecutivePDF } from '../pdfExport';
import { fromQuickStart } from '../startFlows';
import { migrateWorkflow } from '../../storage/migrate';
import { initialWeeklyManagementReportWorkflow as seed } from '../../data/seedData';

// jsPDF's Node build writes to the working directory on save(); run from a temp dir and clean up.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'));
const cwd = process.cwd();

async function textOf(file: string): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
  let out = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent();
    out += c.items.map((i: any) => i.str).join(' ') + '\n';
  }
  return out;
}

describe('PDF report', () => {
  beforeAll(() => {
    (globalThis as any).window = {};
    process.chdir(tmp);
  });
  afterAll(() => {
    process.chdir(cwd);
    delete (globalThis as any).window;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('includes people/controls and the confirmed-vs-assumed section for the example', async () => {
    const w = migrateWorkflow(seed);
    await generateExecutivePDF(w);
    const text = await textOf(path.join(tmp, `${w.identity.id}_executive_report.pdf`));
    expect(text).toMatch(/PEOPLE, SKILLS AND CONTROLS/);
    expect(text).toMatch(/CONFIRMED, ASSUMED AND MISSING/);
    expect(text).toMatch(/regulatory compliance/);
    expect(text).not.toMatch(/EARLY ESTIMATE/);
  });

  it('labels a Quick Start draft as an early estimate', async () => {
    const w = fromQuickStart({ work: 'Invoice approval', who: 'AP team', steps: 'Receive invoice\nMatch to order\nApprove payment', problem: 'Slow', result: 'On time' });
    await generateExecutivePDF(w);
    const text = await textOf(path.join(tmp, `${w.identity.id}_executive_report.pdf`));
    expect(text).toMatch(/EARLY ESTIMATE/);
    expect(text).toMatch(/not yet decided/);
  });
});
