import { Task } from '@/types';

export interface InferredAttributes {
  attrs: Partial<Task>;
  /** Plain-language notes on what was guessed from wording, so the UI can show them as assumptions. */
  assumed: string[];
}

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

/**
 * Guesses task attributes from a short description. These are assumptions, always shown as such, and
 * the user is asked to confirm them. Used by Quick Start and by document extraction.
 */
export function inferTaskAttributes(name: string, description = ''): InferredAttributes {
  const text = `${name} ${description}`.toLowerCase();
  const attrs: Partial<Task> = {};
  const assumed: string[] = [];

  const judgment = has(text, ['approve', 'decide', 'decision', 'escalat', 'negotiat', 'discuss', 'meeting', 'review with', 'sign off', 'sign-off', 'investigat', 'judg', 'resolve', 'interview']);
  const routine = has(text, ['send', 'collect', 'gather', 'compile', 'consolidat', 'copy', 'format', 'archive', 'file', 'log', 'enter', 'record', 'distribute', 'remind', 'schedule', 'download', 'upload', 'extract', 'reconcile', 'summari']);
  const people = has(text, ['meeting', 'conversation', 'coach', 'discuss', 'customer call', 'negotiat', 'talk', 'interview', 'feedback']);
  const sensitive = has(text, ['salary', 'payroll', 'personal', 'customer data', 'confidential', 'kyc', 'account', 'medical', 'passport', 'credit', 'loan', 'legal']);
  const highStakes = has(text, ['approve', 'sign off', 'sign-off', 'release', 'publish', 'payment', 'transfer', 'regulator', 'board', 'loan', 'credit decision', 'final']);
  const unstructured = has(text, ['email', 'free text', 'notes', 'narrative', 'commentary', 'call', 'conversation', 'document', 'pdf']);

  attrs.judgmentRequired = judgment ? 'High' : routine ? 'Low' : 'Medium';
  attrs.repeatability = routine && !judgment ? 'High' : judgment ? 'Medium' : 'Medium';
  attrs.dataReadiness = unstructured ? 'Semi-structured' : routine ? 'Structured' : 'Semi-structured';
  attrs.sensitivity = sensitive ? 'Confidential' : 'Internal';
  attrs.errorImpact = highStakes ? 'High' : 'Medium';
  attrs.outputCheckability = routine && !judgment ? 'Easy' : 'Moderate';
  attrs.exceptionRate = judgment ? 'High' : 'Low';
  attrs.humanRelationshipImportance = people ? 'High' : 'Low';

  assumed.push(
    `Judgment needed: ${attrs.judgmentRequired}, error impact: ${attrs.errorImpact}, data sensitivity: ${attrs.sensitivity}. Guessed from the wording; please confirm.`
  );
  return { attrs, assumed };
}
