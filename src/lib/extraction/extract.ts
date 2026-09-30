import { DocSection, ExtractedItem, ExtractedStep, ExtractionResult } from './types';

const KNOWN_SYSTEMS = ['Excel', 'SAP', 'Salesforce', 'SharePoint', 'Outlook', 'Email', 'Slack', 'Teams', 'Jira', 'ServiceNow', 'Workday', 'Oracle', 'CRM', 'ERP', 'Zendesk', 'Power BI', 'Tableau', 'Google Sheets', 'Word', 'PDF portal'];
const STEP_MARKER = /^\s*(?:[-*•]\s+|\d+[.)]\s+|step\s+\d+[:.)-]?\s*|\(?[a-z][.)]\s+)/i;
const ACTOR = /^(?:the\s+)?((?:[A-Z][A-Za-z&/-]*)(?:\s+(?:[A-Z][A-Za-z&/-]*|of|and|&)){0,4})\s+(?:shall|must|will|should|is responsible for|are responsible for|reviews?|sends?|checks?|approves?|prepares?|collects?|submits?|verifies?|updates?|enters?|logs?|reconciles?|escalates?|files?|signs?|receives?|records?|compiles?|confirms?|assigns?|notifies?|contacts?|reports?|[a-z]{4,}(?:es|s))\b/;
const IS_DECISION = /\b(decid\w*|whether|approves?|approval (?:from|by|of)|if the|if a|if an|determin\w*|accepts?|rejects?|declin\w*)\b/i;
const IS_EXCEPTION = /\b(exception|unless|otherwise|escalat|if .* (?:not|missing|fails?|cannot|unable)|in case of|error|discrepanc)/i;
const IS_CONTROL = /\b(sign(?:s|ed|ing)?[- ]?off|four[- ]eyes|dual control|audit|approved by|approval from|must be reviewed|independent review|segregat|retain|log(?:ged)? for)/i;
const IS_HANDOFF = /\b(hand(?:s|ed)? off|forward(?:s|ed)? to|pass(?:es|ed)? to|send(?:s)? (?:it )?to|passed to|transfer(?:s|red)? to|then the [A-Z])/i;
const IS_PROCEDURAL = /\b(step|procedure|process|workflow|steps)\b/i;
const VERB_START = /^(?:the\s+)?(?:[A-Z][a-z]+\s+)*?(?:send|collect|gather|check|review|approve|prepare|submit|verify|update|enter|log|reconcile|escalate|file|sign|receive|record|compile|confirm|assign|notify|contact|report|request|open|close|create|validate|scan|match|calculate|post|archive|distribute|schedule|investigate|resolve)/i;

/** "The AP Clerk receives each invoice" -> "Receive each invoice". Falls back to the sentence as written. */
function imperative(body: string, actor: string): string {
  if (!actor) return body;
  const esc = actor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = body.match(new RegExp(`^(?:the\\s+)?${esc}\\s+(?:shall\\s+|must\\s+|will\\s+|should\\s+)?([a-z]+)\\s+(.*)$`, 'i'));
  if (!m) return body;
  let verb = m[1].toLowerCase();
  if (/(?:ches|shes|sses|xes|zes)$/.test(verb)) verb = verb.slice(0, -2);
  else if (/ies$/.test(verb)) verb = `${verb.slice(0, -3)}y`;
  else if (/s$/.test(verb) && !/ss$/.test(verb)) verb = verb.slice(0, -1);
  return `${verb.charAt(0).toUpperCase()}${verb.slice(1)} ${m[2]}`;
}

const trimName = (s: string) => {
  const first = s.split(/(?<=[.;])\s/)[0].replace(/[.;]$/, '').trim();
  return first.length > 90 ? `${first.slice(0, 87).trimEnd()}…` : first;
};

function systemsIn(text: string): string[] {
  const found = new Set<string>();
  for (const s of KNOWN_SYSTEMS) if (new RegExp(`\\b${s.replace(/ /g, '\\s')}\\b`, s === 'Email' ? 'i' : '').test(text)) found.add(s === 'Email' ? 'Email' : s);
  const m = text.match(/\b(?:in|using|via|through|into|on)\s+(?:the\s+)?([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\b/g);
  m?.forEach((x) => {
    const name = x.replace(/^\w+\s+(?:the\s+)?/, '');
    if (name.length > 2 && !/^(The|This|That|These|Section|Page|Step|If|When|Then)$/.test(name)) found.add(name);
  });
  return Array.from(found).slice(0, 5);
}

/**
 * Turns document text into a draft workflow. Deterministic heuristics only; nothing leaves the browser.
 * Every step keeps the section or page it came from, and anything unclear is flagged rather than guessed.
 */
export function extractWorkflow(sections: DocSection[]): ExtractionResult {
  const steps: ExtractedStep[] = [];
  const items: ExtractedItem[] = [];
  const warnings: string[] = [];
  let itemN = 0;
  const addItem = (kind: ExtractedItem['kind'], text: string, ref: string) => {
    itemN += 1;
    items.push({ id: `item-${itemN}`, kind, text, ref });
  };

  const hasMarkers = sections.some((s) => STEP_MARKER.test(s.text));

  for (const sec of sections) {
    const text = sec.text.trim();
    const isMarked = STEP_MARKER.test(text);
    const body = text.replace(STEP_MARKER, '').trim();
    if (body.length < 6) continue;

    const looksLikeStep = hasMarkers ? isMarked : VERB_START.test(body) || ACTOR.test(body) || IS_PROCEDURAL.test(sec.ref);
    const isSubNote = !isMarked && steps.length > 0 && (IS_EXCEPTION.test(body) || IS_CONTROL.test(body) || IS_HANDOFF.test(body)) && !looksLikeStep;

    if (looksLikeStep && !isSubNote) {
      let actor = body.match(ACTOR)?.[1] ?? '';
      // "If the invoice does not match, the AP Clerk returns it": the actor follows a clause.
      if (!actor) actor = body.match(/,\s*(?:the\s+)?((?:[A-Z][A-Za-z&/-]*)(?:\s+[A-Z][A-Za-z&/-]*){0,3})\s+(?:shall|must|will|should|[a-z]{4,}(?:es|s))\b/)?.[1] ?? '';
      // A bare imperative like "Check totals" is an instruction, not a named person.
      if (actor && !/\s/.test(actor.replace(/^the\s+/i, '')) && VERB_START.test(actor)) actor = '';
      const unclear: string[] = [];
      if (!actor) unclear.push('No responsible person or team is named for this step.');
      if (body.split(/\s+/).length < 4) unclear.push('This step is very short; the expected result is not clear.');
      const step: ExtractedStep = {
        id: `ex-${steps.length + 1}`,
        name: trimName(imperative(body, actor)),
        description: body,
        owner: actor.replace(/^the\s+/i, ''),
        systems: systemsIn(body),
        ref: sec.ref,
        excerpt: text.length > 240 ? `${text.slice(0, 237)}…` : text,
        exceptions: [],
        handoffs: [],
        controls: [],
        unclear,
        include: true,
      };
      if (IS_EXCEPTION.test(body)) { step.exceptions.push(body); addItem('exception', body, sec.ref); }
      if (IS_HANDOFF.test(body)) { step.handoffs.push(body); addItem('handoff', body, sec.ref); }
      if (IS_CONTROL.test(body)) { step.controls.push(body); addItem('control', body, sec.ref); }
      if (IS_DECISION.test(body) && body.split(/\s+/).length >= 5) addItem('decision', body, sec.ref);
      steps.push(step);
      continue;
    }

    // Supporting lines: attach to the most recent step where possible, and also list them on their own.
    const last = steps[steps.length - 1];
    const attach = last && last.ref === sec.ref ? last : undefined;
    if (IS_EXCEPTION.test(body)) {
      addItem('exception', body, sec.ref);
      attach?.exceptions.push(body);
    }
    if (IS_CONTROL.test(body)) {
      addItem('control', body, sec.ref);
      attach?.controls.push(body);
    }
    if (IS_HANDOFF.test(body)) {
      addItem('handoff', body, sec.ref);
      attach?.handoffs.push(body);
    }
    if (IS_DECISION.test(body) && !IS_EXCEPTION.test(body) && body.split(/\s+/).length >= 5) addItem('decision', body, sec.ref);
  }

  // Roles seen across the document
  const roles = new Set(steps.map((s) => s.owner).filter(Boolean));
  roles.forEach((r) => addItem('role', r, steps.find((s) => s.owner === r)?.ref ?? ''));

  if (steps.length === 0) {
    warnings.push('No clear steps were found. Try a version of the document with numbered or bulleted steps, or use Quick Start.');
  } else if (steps.length < 3) {
    warnings.push('Only a few steps were found. Check the document is the full procedure.');
  }
  const noOwner = steps.filter((s) => !s.owner).length;
  if (noOwner > 0) warnings.push(`${noOwner} step${noOwner > 1 ? 's have' : ' has'} no named owner. Add them before analysis.`);
  if (steps.length > 0 && items.every((i) => i.kind !== 'control')) warnings.push('No controls or approvals are stated in the document.');
  if (steps.length > 0 && items.every((i) => i.kind !== 'exception')) warnings.push('No exceptions or error handling are described. Real work usually has some.');

  return { steps, items, warnings };
}
