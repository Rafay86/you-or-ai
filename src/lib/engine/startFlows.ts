import { WorkflowState } from '@/types';
import { LibraryWorkflow } from '../data/library';
import { initialWeeklyManagementReportWorkflow } from '../data/seedData';
import { migrateWorkflow } from '../storage/migrate';
import { buildWorkflow, DraftTask } from './workflowBuilder';
import { inferTaskAttributes } from './inference';

export const newWorkflowId = () => `wf-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// ---------- Quick Start ----------

export interface QuickStartAnswers {
  work: string;
  who: string;
  steps: string;
  problem: string;
  result: string;
}

export interface QuickStartValidation {
  ok: boolean;
  errors: Partial<Record<keyof QuickStartAnswers, string>>;
  steps: string[];
}

export function parseSteps(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter(Boolean);
}

export function validateQuickStart(a: QuickStartAnswers): QuickStartValidation {
  const errors: QuickStartValidation['errors'] = {};
  const steps = parseSteps(a.steps);
  if (a.work.trim().length < 4) errors.work = 'Say what work you want to improve, in a few words.';
  if (a.who.trim().length < 2) errors.who = 'Say who does this work today.';
  if (steps.length < 3) errors.steps = 'List at least 3 steps, one per line.';
  else if (steps.length > 7) errors.steps = 'Keep it to 7 steps for now. You can add more later.';
  if (a.problem.trim().length < 4) errors.problem = 'Name the biggest delay or problem.';
  if (a.result.trim().length < 4) errors.result = 'Say what result you want to improve.';
  return { ok: Object.keys(errors).length === 0, errors, steps };
}

export function fromQuickStart(a: QuickStartAnswers): WorkflowState {
  const steps = parseSteps(a.steps);
  const tasks: DraftTask[] = steps.map((name, i) => {
    const { attrs, assumed } = inferTaskAttributes(name);
    return {
      name,
      description: name,
      currentOwner: a.who.trim(),
      ...attrs,
      source: { kind: 'user' as const },
      origin: 'documented' as const,
      needsReview: true,
      openQuestions: [
        ...assumed,
        'Frequency, systems, volume and time taken were not provided.',
        ...(i === 0 ? [] : []),
      ],
    };
  });
  return buildWorkflow({
    id: newWorkflowId(),
    name: a.work.trim(),
    owner: a.who.trim(),
    endOutcome: a.result.trim(),
    painPoints: [a.problem.trim()],
    startMode: 'quick-start',
    isEarlyEstimate: true,
    tasks,
  });
}

// ---------- Industry library ----------

export function fromLibrary(lib: LibraryWorkflow): WorkflowState {
  const id = newWorkflowId();
  if (lib.isWorkedExample) {
    const copy = migrateWorkflow(JSON.parse(JSON.stringify(initialWeeklyManagementReportWorkflow)) as WorkflowState);
    return {
      ...copy,
      id,
      identity: { ...copy.identity, id, name: `${copy.identity.name} (copy)` },
      startMode: 'library',
      guidance: guidanceOf(lib),
      lastUpdated: new Date().toISOString(),
    };
  }
  const tasks: DraftTask[] = lib.steps.map((s) => ({
    name: s.name,
    description: s.description,
    currentOwner: s.owner,
    frequency: 'Per case',
    ...s.attrs,
    systems: s.systems,
    expectedOutput: s.output,
    delays: s.delay,
    handoffs: s.handoff,
    exceptions: s.exception,
    source: { kind: 'template' as const, ref: `Library: ${lib.title}` },
    origin: 'documented' as const,
    needsReview: true,
  }));
  const w = buildWorkflow({
    id,
    name: lib.title,
    purpose: lib.summary,
    businessFunction: `${lib.industry}: ${lib.function}`,
    owner: 'Process owner (to name)',
    painPoints: lib.commonProblems,
    startMode: 'library',
    tasks,
  });
  return { ...w, guidance: guidanceOf(lib) };
}

function guidanceOf(lib: LibraryWorkflow) {
  return {
    source: `Illustrative starter: ${lib.title} (${lib.industry}, ${lib.function}). Not your actual process or a regulatory requirement.`,
    questionsToVerify: lib.questionsToVerify,
    aiOpportunities: lib.aiOpportunities,
    measures: lib.measures,
  };
}
