/** A run of text from the source document, with where it was found. */
export interface DocSection {
  /** "Page 3" for PDFs, "Section: Escalation" or "Paragraph 12" for Word and text files. */
  ref: string;
  text: string;
}

export type ItemKind = 'decision' | 'exception' | 'control' | 'handoff' | 'system' | 'role';

export interface ExtractedStep {
  id: string;
  name: string;
  description: string;
  owner: string;
  systems: string[];
  ref: string;
  excerpt: string;
  exceptions: string[];
  handoffs: string[];
  controls: string[];
  /** Plain-language notes on what is unclear or missing. */
  unclear: string[];
  include: boolean;
}

export interface ExtractedItem {
  id: string;
  kind: ItemKind;
  text: string;
  ref: string;
}

export interface ExtractionResult {
  steps: ExtractedStep[];
  items: ExtractedItem[];
  warnings: string[];
}
