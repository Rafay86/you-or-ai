import { describe, it, expect } from 'vitest';
import { extractWorkflow } from '../extract';
import { readText, readPdf, readDocx } from '../readers';
import { validateUpload, UploadError, MAX_UPLOAD_BYTES } from '../limits';

const SAMPLE = `Monthly Expense Approval Procedure

Purpose:
This procedure covers how staff expenses are approved.

Procedure:
1. The Employee submits the expense claim in Concur with receipts attached.
2. The Line Manager reviews the claim and approves it if it is within budget.
3. Finance Analyst checks receipts against the claim amount. If a receipt is missing, the claim is returned to the employee.
4. The Finance Controller signs off any claim above 5,000.
5. Payroll processes the payment via SAP.

Exceptions:
Claims older than 90 days must be escalated to the Finance Controller.`;

describe('extraction from text', () => {
  const result = extractWorkflow(readText(SAMPLE));

  it('finds the numbered steps and their owners', () => {
    expect(result.steps.length).toBe(5);
    expect(result.steps[0].owner).toBe('Employee');
    expect(result.steps[1].owner).toBe('Line Manager');
    expect(result.steps[4].owner).toBe('Payroll');
  });

  it('keeps the section each step came from', () => {
    expect(result.steps[0].ref).toBe('Section: Procedure');
    expect(result.steps[0].excerpt).toContain('Concur');
  });

  it('detects systems, decisions, exceptions and controls', () => {
    expect(result.steps[0].systems).toContain('Concur');
    expect(result.steps[4].systems).toContain('SAP');
    expect(result.items.some((i) => i.kind === 'decision')).toBe(true);
    expect(result.items.some((i) => i.kind === 'exception')).toBe(true);
    expect(result.items.some((i) => i.kind === 'control')).toBe(true);
  });

  it('finds an owner that follows an opening clause, and does not attach later sections to the last step', () => {
    const r = extractWorkflow(readText('Procedure:\n1. The AP Clerk logs the invoice in SAP.\n2. If the invoice does not match the order, the AP Clerk returns it to the supplier.\n\nExceptions:\nInvoices older than 60 days must be escalated to the controller.'));
    expect(r.steps[1].owner).toBe('AP Clerk');
    expect(r.steps[1].exceptions.length).toBe(1);
    expect(r.steps[1].exceptions[0]).toMatch(/does not match/);
    expect(r.items.some((i) => i.kind === 'exception' && /60 days/.test(i.text))).toBe(true);
  });

  it('does not treat a document title as a decision', () => {
    const r = extractWorkflow(readText('Supplier Invoice Approval Procedure\n\nProcedure:\n1. The Clerk logs the invoice.\n2. The Manager approves invoices up to 10,000 in the queue.'));
    expect(r.items.filter((i) => i.kind === 'decision').every((i) => !/Approval Procedure/.test(i.text))).toBe(true);
  });

  it('flags steps with no named owner instead of guessing', () => {
    const r = extractWorkflow(readText('1. Collect the invoices.\n2. Check totals.\n3. Send for approval.'));
    expect(r.steps.every((s) => s.owner === '')).toBe(true);
    expect(r.steps[0].unclear.join(' ')).toMatch(/No responsible person/);
    expect(r.warnings.join(' ')).toMatch(/no named owner/);
  });

  it('warns and returns no steps when there is nothing procedural', () => {
    const r = extractWorkflow(readText('Lorem ipsum.'));
    expect(r.steps).toHaveLength(0);
    expect(r.warnings[0]).toMatch(/No clear steps/);
  });
});

describe('upload validation', () => {
  it('rejects unsupported types', () => {
    expect(() => validateUpload({ name: 'a.exe', size: 10 })).toThrow(UploadError);
  });
  it('rejects empty and oversized files', () => {
    expect(() => validateUpload({ name: 'a.txt', size: 0 })).toThrow(/empty/);
    expect(() => validateUpload({ name: 'a.pdf', size: MAX_UPLOAD_BYTES + 1 })).toThrow(/limit/);
  });
  it('rejects a file whose bytes do not match its extension', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(() => validateUpload({ name: 'a.pdf', size: 10 }, png)).toThrow(/not a PDF/);
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    expect(() => validateUpload({ name: 'a.txt', size: 10 }, pdf)).toThrow(/binary/);
  });
});

describe('PDF reading', () => {
  it('reads text and page numbers from a real PDF', async () => {
    const { jsPDF } = await import('jspdf');
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = new jsPDF();
    doc.text('1. The Clerk logs the request in Jira.', 10, 20);
    doc.addPage();
    doc.text('2. The Manager approves the request.', 10, 20);
    const buf = doc.output('arraybuffer');
    const sections = await readPdf(buf, pdfjs);
    expect(sections.find((s) => s.text.includes('Clerk'))?.ref).toBe('Page 1');
    expect(sections.find((s) => s.text.includes('Manager'))?.ref).toBe('Page 2');
    const r = extractWorkflow(sections);
    expect(r.steps.map((s) => s.ref)).toEqual(['Page 1', 'Page 2']);
  });

  it('gives a clear error for a damaged PDF', async () => {
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    await expect(readPdf(new TextEncoder().encode('%PDF-1.4 garbage').buffer as ArrayBuffer, pdfjs)).rejects.toThrow(/could not be opened|No text/);
  });
});

describe('DOCX reading', () => {
  it('reads headings as sections and paragraphs as steps', async () => {
    const JSZip = (await import('jszip')).default;
    const mammoth: any = await import('mammoth');
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Escalation</w:t></w:r></w:p><w:p><w:r><w:t>The Duty Manager reviews the incident in ServiceNow.</w:t></w:r></w:p></w:body></w:document>');
    const buf = await zip.generateAsync({ type: 'arraybuffer' });
    const sections = await readDocx(buf, mammoth.default ?? mammoth);
    expect(sections[0].text).toContain('Duty Manager');
    expect(sections[0].ref).toBe('Section: Escalation');
  });

  it('gives a clear error for a damaged Word file', async () => {
    const mammoth: any = await import('mammoth');
    await expect(readDocx(new TextEncoder().encode('not a zip').buffer as ArrayBuffer, mammoth.default ?? mammoth)).rejects.toThrow(/could not be read/);
  });
});

describe('step naming', () => {
  it('turns "The X does Y" into a short imperative name while keeping the original sentence', () => {
    const r = extractWorkflow(readText('Procedure:\n1. The AP Clerk receives each supplier invoice by email.\n2. The Finance Analyst processes the payment.\n3. The Manager approves the report.'));
    expect(r.steps.map((s) => s.name)).toEqual(['Receive each supplier invoice by email', 'Process the payment', 'Approve the report']);
    expect(r.steps[0].description).toMatch(/^The AP Clerk receives/);
  });
});
