import { SCHEMA_VERSION, WorkflowState } from '@/types';
import { generateChangePlan } from '../engine/changePlanEngine';
import { generateRoadmap } from '../engine/roadmapEngine';
import { buildGovernanceFromPlan } from '../engine/workflowBuilder';

/**
 * Brings any stored workspace up to the current schema. Old saves must never crash the app:
 * every new field is filled with a safe default, and nothing the user entered is overwritten.
 */
export function migrateWorkflow(raw: WorkflowState): WorkflowState {
  const w: WorkflowState = { ...raw };
  const example = !!w.isTemplateExample;

  w.startMode = w.startMode ?? (example ? 'example' : 'quick-start');
  w.isEarlyEstimate = w.isEarlyEstimate ?? false;
  w.canvasEdited = w.canvasEdited ?? example;
  w.reviewConfirmed = w.reviewConfirmed ?? true;

  w.tasks = (w.tasks ?? []).map((t) => ({
    ...t,
    source: t.source ?? { kind: example ? 'template' : 'user' },
    origin: t.origin ?? 'documented',
  }));

  w.assumptions = (w.assumptions ?? []).map((a) => ({
    ...a,
    provenance: a.provenance ?? (example ? 'template' : 'user'),
  }));

  w.pilotMetrics = w.pilotMetrics ?? [];
  w.governanceItems = w.governanceItems ?? [];

  if (!w.changePlan) {
    w.changePlan = generateChangePlan(w.tasks, w.identity);
  }

  // The built-in example must be produced from its own decisions like any other workspace.
  // Its story is that the pilot has run, so prerequisites and the work leading up to the pilot are done.
  if (example && (raw.schemaVersion ?? 1) < SCHEMA_VERSION) {
    w.changePlan = w.changePlan.map((c) => ({
      ...c,
      technicalOwner: 'Lead Systems Architect',
      prerequisites: c.prerequisites.map((p) => ({ ...p, met: true })),
    }));
    w.roadmap = generateRoadmap(w.changePlan, w.tasks, w.identity).map((r) => ({
      ...r,
      status: r.id === 'rm-decide' ? ('Not started' as const) : ('Complete' as const),
    }));
    w.governanceItems = buildGovernanceFromPlan(w.changePlan).map((g) => ({
      ...g,
      status: g.category === 'Approvals' || g.category === 'Testing Evidence' ? ('Evidence provided' as const) : ('In review' as const),
      evidence: g.category === 'Testing Evidence' ? 'Pilot test runs on the example data passed (illustrative).' : g.evidence,
    }));
  }

  w.schemaVersion = SCHEMA_VERSION;
  return w;
}
