import {
  BusinessCaseAssumption,
  GovernanceItem,
  PilotMetric,
  Provenance,
  SCHEMA_VERSION,
  StartMode,
  Task,
  WorkflowNode,
  WorkflowState,
} from '@/types';
import { assessTask } from './decisionEngine';
import { effectiveClassification } from './effective';
import { generateChangePlan } from './changePlanEngine';
import { generateRoadmap } from './roadmapEngine';

export interface DraftTask extends Partial<Task> {
  name: string;
}

export interface DraftInput {
  id: string;
  name: string;
  purpose?: string;
  businessFunction?: string;
  owner?: string;
  frequency?: string;
  endOutcome?: string;
  painPoints?: string[];
  startMode: StartMode;
  isEarlyEstimate?: boolean;
  reviewConfirmed?: boolean;
  sourceDocumentName?: string;
  tasks: DraftTask[];
  /** Facts the user actually supplied; anything absent is filled with a labelled estimate. */
  weeklyHours?: number;
  hourlyCost?: number;
  peopleCount?: number;
}

const ESTIMATE_HOURLY = 50;

export function assessDraftTask(t: DraftTask, index: number): Task {
  const base: Task = {
    id: t.id ?? `task-${index + 1}`,
    stepNumber: index + 1,
    name: t.name,
    description: t.description ?? '',
    currentOwner: t.currentOwner ?? '',
    frequency: t.frequency ?? '',
    repeatability: t.repeatability ?? 'Medium',
    dataReadiness: t.dataReadiness ?? 'Semi-structured',
    judgmentRequired: t.judgmentRequired ?? 'Medium',
    sensitivity: t.sensitivity ?? 'Internal',
    errorImpact: t.errorImpact ?? 'Medium',
    outputCheckability: t.outputCheckability ?? 'Moderate',
    exceptionRate: t.exceptionRate ?? 'Medium',
    humanRelationshipImportance: t.humanRelationshipImportance ?? 'Low',
    recommendation: 'NEEDS_ASSESSMENT',
    confidence: 'Low',
    reasons: [],
    riskFlags: [],
    suggestedRoleSplit: { ai: [], human: [] },
    source: t.source,
    origin: t.origin ?? 'documented',
    expectedOutput: t.expectedOutput,
    systems: t.systems,
    delays: t.delays,
    handoffs: t.handoffs,
    exceptions: t.exceptions,
    openQuestions: t.openQuestions,
    needsReview: t.needsReview,
  };
  const a = assessTask(base);
  return {
    ...base,
    recommendation: a.recommendation,
    confidence: a.confidence,
    reasons: a.reasons,
    riskFlags: a.riskFlags,
    suggestedRoleSplit: a.suggestedRoleSplit,
  };
}

function nodeType(t: Task): WorkflowNode['type'] {
  const c = effectiveClassification(t);
  return c === 'AI' ? 'AI' : c === 'BOTH' ? 'Human + AI' : 'Human';
}

export function buildCanvas(tasks: Task[]): WorkflowState['canvas'] {
  const cur: WorkflowNode[] = tasks.map((t, i) => ({
    id: `c${i + 1}`,
    label: t.name,
    type: 'Human',
    owner: t.currentOwner || 'Unassigned',
    description: t.description || 'No description yet',
    exceptionPath: t.exceptionRate === 'High',
  }));
  const prop: WorkflowNode[] = tasks.map((t, i) => ({
    id: `p${i + 1}`,
    label: t.name,
    type: nodeType(t),
    owner: effectiveClassification(t) === 'AI' ? `AI (exceptions to ${t.currentOwner || 'owner'})` : t.currentOwner || 'Unassigned',
    description: t.description,
    reviewPoint: effectiveClassification(t) === 'BOTH' && (t.errorImpact === 'High' || t.errorImpact === 'Critical'),
    exceptionPath: t.exceptionRate === 'High',
  }));
  const link = (prefix: string, n: number) =>
    Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ from: `${prefix}${i + 1}`, to: `${prefix}${i + 2}` }));
  return {
    currentState: { nodes: cur, connections: link('c', cur.length) },
    proposedState: { nodes: prop, connections: link('p', prop.length) },
  };
}

function buildAssumptions(input: DraftInput, monthlyHours: number, hourly: number, example: boolean): BusinessCaseAssumption[] {
  const user: Provenance = 'user';
  const tmpl: Provenance = example ? 'template' : 'estimate';
  return [
    { id: 'hourly_cost', provenance: input.hourlyCost ? user : 'estimate', name: 'Estimated Hourly Labor Cost', category: 'Labor', value: hourly, unit: '$/hr', description: input.hourlyCost ? 'Provided by you.' : 'Placeholder. Replace with your blended hourly cost.' },
    { id: 'current_monthly_hours', provenance: input.weeklyHours ? user : 'estimate', name: 'Baseline Monthly Labor Hours', category: 'Labor', value: monthlyHours, unit: 'hrs/mo', description: input.weeklyHours ? 'Derived from the weekly hours you gave.' : 'Placeholder. Replace with measured hours.' },
    { id: 'automation_min_pct', provenance: tmpl, name: 'Expected Min Time Reduction', category: 'Automation', value: 25, unit: '%', description: 'Conservative share of time released. Product estimate.' },
    { id: 'automation_max_pct', provenance: tmpl, name: 'Expected Max Time Reduction', category: 'Automation', value: 50, unit: '%', description: 'Optimistic share of time released. Product estimate.' },
    { id: 'implementation_cost', provenance: tmpl, name: 'Estimated Implementation Cost', category: 'Implementation', value: 25000, unit: '$', description: 'One-time set-up and training. Product estimate.' },
    { id: 'operating_cost_monthly', provenance: tmpl, name: 'Ongoing Monthly Operating Cost', category: 'Operating', value: 800, unit: '$/mo', description: 'Licences, runtime and storage. Product estimate.' },
  ];
}

function buildPilotMetrics(monthlyHours: number, hourly: number): PilotMetric[] {
  const weekly = Math.round(monthlyHours / 4.33);
  const mk = (id: string, name: string, unit: string, baseline: number, min: number, max: number): PilotMetric => ({
    id, name, unit, baseline, targetMin: min, targetMax: max, actual: 0, variance: 0, status: 'Insufficient evidence', recorded: false,
  });
  return [
    mk('pilot-time', 'Weekly labor time', 'hrs/wk', weekly, Math.round(weekly * 0.5), Math.round(weekly * 0.75)),
    mk('pilot-quality', 'Output quality score', '%', 80, 90, 98),
    mk('pilot-adoption', 'Adoption by the people involved', '%', 0, 80, 100),
    mk('pilot-errors', 'Error and rework rate', '%', 15, 3, 8),
    mk('pilot-cost', 'Monthly cost', '$', Math.round(monthlyHours * hourly), Math.round(monthlyHours * hourly * 0.5), Math.round(monthlyHours * hourly * 0.75)),
  ];
}

export function buildGovernanceFromPlan(plan: WorkflowState['changePlan'] = []): GovernanceItem[] {
  const out: GovernanceItem[] = [];
  for (const c of plan) {
    c.controls.forEach((k, i) => {
      out.push({
        id: `gov-${c.taskId}-${i}`,
        taskId: c.taskId,
        category: k.area === 'Privacy' || k.area === 'Data' || k.area === 'Security' ? 'Data Sensitivity' : 'Human Oversight',
        title: k.text,
        status: 'Not assessed',
        owner: c.businessOwner,
        evidence: '',
      });
    });
    out.push({ id: `gov-${c.taskId}-test`, taskId: c.taskId, category: 'Testing Evidence', title: c.testingRequired, status: 'Not assessed', owner: c.technicalOwner, evidence: '' });
    out.push({ id: `gov-${c.taskId}-approve`, taskId: c.taskId, category: 'Approvals', title: c.approvalRequired, status: 'Not assessed', owner: c.businessOwner, evidence: '' });
  }
  return out;
}

/** Turns a set of confirmed or drafted steps into a complete workspace. One code path for Quick Start, upload and library. */
export function buildWorkflow(input: DraftInput): WorkflowState {
  const tasks = input.tasks.map(assessDraftTask);
  const owner = input.owner || 'Process owner (to name)';
  const hourly = input.hourlyCost ?? ESTIMATE_HOURLY;
  const weekly = input.weeklyHours ?? Math.max(4, tasks.length * 3);
  const monthly = Math.round(weekly * 4.33);
  const identity = {
    id: input.id,
    name: input.name,
    purpose: input.purpose ?? '',
    businessFunction: input.businessFunction ?? '',
    owner,
    frequency: input.frequency ?? 'Weekly',
    startTrigger: '',
    endOutcome: input.endOutcome ?? '',
    people: {
      teamsInvolved: [],
      numberOfPeople: input.peopleCount ?? Math.max(1, new Set(tasks.map((t) => t.currentOwner).filter(Boolean)).size),
      roles: Array.from(new Set(tasks.map((t) => t.currentOwner).filter(Boolean))),
      reviewers: [],
      approvers: [],
    },
    systems: Array.from(new Set(tasks.flatMap((t) => t.systems ?? []))),
    volume: { itemsPerWeek: 1, itemsPerMonth: 4, avgProcessingTimeHours: weekly, peakVolume: 'Unknown' },
    cost: { estimatedHourlyCost: hourly, currentWeeklyHours: weekly, currentMonthlyHours: monthly },
    performance: { avgCycleTimeDays: 0, errorReworkRatePct: 0, delayFrequency: 'Unknown', sla: 'Unknown', qualityMeasure: 'Unknown' },
    painPoints: input.painPoints ?? [],
  };
  const changePlan = generateChangePlan(tasks, identity);
  const example = input.startMode === 'library' || input.startMode === 'example';

  return {
    id: input.id,
    schemaVersion: SCHEMA_VERSION,
    startMode: input.startMode,
    isEarlyEstimate: input.isEarlyEstimate ?? false,
    reviewConfirmed: input.reviewConfirmed ?? input.startMode !== 'upload',
    sourceDocumentName: input.sourceDocumentName,
    identity,
    tasks,
    decisionTrace: [],
    canvas: buildCanvas(tasks),
    scenarios: [
      { id: 'scenario-a', name: 'Scenario A: Cautious, assisted', tagline: 'AI prepares and drafts; people check everything before it moves on.', humanEffortHoursMonthly: Math.round(monthly * 0.7), aiInvolvementPct: 35, implementationEffortWeeks: 4, operatingCostMonthly: 500, potentialTimeReleasedHoursMonthly: Math.round(monthly * 0.3), keyRisks: ['Smaller time saving', 'People may still re-do the AI’s work'], requiredControls: ['Human check on every output', 'Weekly review of errors found'], isSelected: false },
      { id: 'scenario-b', name: 'Scenario B: More automated', tagline: 'AI runs routine steps; people handle exceptions and decisions.', humanEffortHoursMonthly: Math.round(monthly * 0.4), aiInvolvementPct: 70, implementationEffortWeeks: 6, operatingCostMonthly: 1100, potentialTimeReleasedHoursMonthly: Math.round(monthly * 0.6), keyRisks: ['Depends on stable inputs', 'Errors can spread before anyone notices'], requiredControls: ['Automated input checks', 'Named person approves before release', 'Sample review every cycle'], isSelected: true },
    ],
    assumptions: buildAssumptions(input, monthly, hourly, example),
    roadmap: generateRoadmap(changePlan, tasks, identity),
    pilotMetrics: buildPilotMetrics(monthly, hourly),
    governanceItems: buildGovernanceFromPlan(changePlan),
    changePlan,
    finalDecision: {
      recommendedOutcome: 'IMPROVE_AND_RETEST',
      selectedOutcome: 'IMPROVE_AND_RETEST',
      evidenceSummary: [],
      openRisks: [],
      evidenceGaps: ['No pilot results recorded yet.'],
      decidedBy: '',
      decidedAt: '',
    },
    activeStep: 1,
    lastUpdated: new Date().toISOString(),
    isTemplateExample: example,
  };
}

/** True when the proposed workflow no longer reflects the current You / AI / Both decisions. */
export function canvasIsStale(canvas: WorkflowState['canvas'], tasks: Task[]): boolean {
  return tasks.some((t) => {
    const node = canvas.proposedState.nodes.find((n) => n.label === t.name);
    return !node || (node.type !== nodeType(t) && node.type !== 'Decision' && node.type !== 'Review');
  });
}
