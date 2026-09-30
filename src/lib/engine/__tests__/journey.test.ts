import { describe, it, expect } from 'vitest';
import { assessTask } from '../decisionEngine';
import { generateChangePlan, refreshChangePlan } from '../changePlanEngine';
import { generateRoadmap, roadmapIsStale } from '../roadmapEngine';
import { checkTaskDependencies } from '../dependencyEngine';
import { buildWorkflow, buildCanvas, canvasIsStale } from '../workflowBuilder';
import { calculateConfidence } from '../calculationEngine';
import { fromLibrary, fromQuickStart, validateQuickStart, parseSteps } from '../startFlows';
import { checkAssumptions } from '../assumptionCheck';
import { compareScenarios, scenarioHints } from '../scenarioCompare';
import { generateFinalDecisionRecommendation } from '../finalDecisionEngine';
import { evaluatePilotMetric } from '../pilotEngine';
import { migrateWorkflow } from '../../storage/migrate';
import { initialWeeklyManagementReportWorkflow as seed } from '../../data/seedData';
import { libraryWorkflows } from '../../data/library';
import { effectiveClassification } from '../effective';

describe('decision engine: missing information', () => {
  it('returns Needs Assessment when the description is too thin', () => {
    const r = assessTask({ name: 'Do it', description: 'stuff', currentOwner: 'Ana' });
    expect(r.recommendation).toBe('NEEDS_ASSESSMENT');
  });
  it('returns Needs Assessment when nobody is named as the owner', () => {
    const r = assessTask({ name: 'Check invoices', description: 'Check each invoice against the order', currentOwner: '' });
    expect(r.recommendation).toBe('NEEDS_ASSESSMENT');
    expect(r.reasons.join(' ')).toMatch(/Nobody is named/);
  });
  it('flags unconfirmed system access and never gives High confidence for AI in that case', () => {
    const r = assessTask({
      name: 'Send reminders', description: 'Send reminder emails to all owners each week', currentOwner: 'Ana',
      repeatability: 'High', dataReadiness: 'Structured', judgmentRequired: 'Low', sensitivity: 'Internal',
      errorImpact: 'Low', outputCheckability: 'Easy', exceptionRate: 'Low', humanRelationshipImportance: 'Low', systems: [],
    });
    expect(r.riskFlags.join(' ')).toMatch(/System access is unconfirmed/);
    expect(r.confidence).not.toBe('High');
  });
});

describe('acceptance example: weekly management report', () => {
  const by = (name: RegExp) => seed.tasks.find((t) => name.test(t.name))!;
  it('lets AI gather and consolidate, pairs manager and AI on delays, and keeps escalation and the team conversation with the manager', () => {
    expect(effectiveClassification(by(/Consolidate/))).toBe('AI');
    expect(effectiveClassification(by(/Investigate unusual/))).toBe('BOTH');
    expect(effectiveClassification(by(/escalate/i))).toBe('YOU');
    expect(effectiveClassification(by(/team conversation/i))).toBe('YOU');
  });
  it('produces changes, skills, controls, roadmap and pilot measures from the example', () => {
    const w = migrateWorkflow(seed);
    expect(w.changePlan!.length).toBeGreaterThan(0);
    expect(w.changePlan!.every((c) => c.skillsNeeded.length > 0 || c.summary.startsWith('Not enough'))).toBe(true);
    expect(w.roadmap.length).toBeGreaterThan(0);
    expect(w.pilotMetrics.length).toBeGreaterThan(0);
  });
  it('derives the example’s roadmap and governance from its own change plan, not hand-written items', () => {
    const w = migrateWorkflow(seed);
    const planIds = new Set(w.changePlan!.map((c) => c.taskId));
    const builds = w.roadmap.filter((r) => r.id.startsWith('rm-build-'));
    expect(builds.length).toBe(w.changePlan!.filter((c) => !c.summary.startsWith('Not enough')).length);
    expect(builds.every((r) => planIds.has(r.id.replace('rm-build-', '')))).toBe(true);
    expect(w.roadmap.some((r) => r.id.startsWith('road-'))).toBe(false);
    expect(w.governanceItems.length).toBeGreaterThan(0);
    expect(w.governanceItems.every((g) => !!g.taskId && planIds.has(g.taskId))).toBe(true);
  });
  it('shows the manager keeping the escalation decision in the proposed workflow', () => {
    const node = seed.canvas.proposedState.nodes.find((n) => /escalate/i.test(n.label));
    expect(node).toBeDefined();
    expect(node?.owner).toMatch(/Manager/);
    expect(seed.canvas.proposedState.connections.some((c) => c.to === node?.id)).toBe(true);
  });
  it('marks a replaced assumption as the user’s own fact', () => {
    // handleUpdateAssumption sets provenance to "user"; migration must preserve that.
    const w: any = migrateWorkflow(seed);
    w.assumptions = w.assumptions.map((a: any) => (a.id === 'hourly_cost' ? { ...a, value: 80, provenance: 'user' } : a));
    expect(migrateWorkflow(w).assumptions.find((a: any) => a.id === 'hourly_cost')?.provenance).toBe('user');
  });
});

describe('change plan', () => {
  const w = buildWorkflow({
    id: 't', name: 'Test', owner: 'Owner', startMode: 'library',
    tasks: [
      { name: 'Read documents', description: 'Read the incoming documents and capture figures', currentOwner: 'Processor', repeatability: 'High', dataReadiness: 'Unstructured', judgmentRequired: 'Low', sensitivity: 'Strictly Restricted', errorImpact: 'Critical', outputCheckability: 'Easy', exceptionRate: 'Medium', humanRelationshipImportance: 'Low', systems: ['Portal'] },
      { name: 'Talk to the client', description: 'Discuss the outcome with the client in person', currentOwner: 'Manager', repeatability: 'Low', dataReadiness: 'Unstructured', judgmentRequired: 'High', sensitivity: 'Confidential', errorImpact: 'High', outputCheckability: 'Difficult', exceptionRate: 'High', humanRelationshipImportance: 'High', systems: [] },
    ],
  });

  it('ties every change to a task and skips tasks that stay with people', () => {
    const ids = w.tasks.map((t) => t.id);
    expect(w.changePlan!.every((c) => ids.includes(c.taskId))).toBe(true);
    const stay = w.tasks.filter((t) => effectiveClassification(t) === 'YOU').map((t) => t.id);
    expect(w.changePlan!.some((c) => stay.includes(c.taskId))).toBe(false);
  });
  it('derives controls from the task’s own attributes, not a generic list', () => {
    const c = w.changePlan![0];
    const areas = c.controls.map((k) => k.area);
    expect(areas).toContain('Security');
    expect(areas).toContain('Privacy');
    expect(c.testingRequired).toMatch(/alongside the manual process/);
    expect(c.approvalRequired).toMatch(/security or compliance/);
    expect(c.prerequisites.some((p) => /machine-readable/.test(p.text))).toBe(true);
  });
  it('keeps named owners and met prerequisites when the plan is refreshed', () => {
    const plan = generateChangePlan(w.tasks, w.identity);
    const edited = plan.map((c) => ({ ...c, technicalOwner: 'Dana', prerequisites: c.prerequisites.map((p) => ({ ...p, met: true })) }));
    const refreshed = refreshChangePlan(edited, w.tasks, w.identity);
    expect(refreshed[0].technicalOwner).toBe('Dana');
    expect(refreshed[0].prerequisites.every((p) => p.met)).toBe(true);
  });
});

describe('roadmap follows the changes and blocks on missing prerequisites', () => {
  const w = buildWorkflow({
    id: 'r', name: 'R', owner: 'Owner', startMode: 'quick-start',
    tasks: [{ name: 'Extract figures', description: 'Extract figures from scanned documents', currentOwner: 'Clerk', repeatability: 'High', dataReadiness: 'Unstructured', judgmentRequired: 'Low', sensitivity: 'Internal', errorImpact: 'Low', outputCheckability: 'Easy', exceptionRate: 'Low', humanRelationshipImportance: 'Low', systems: ['Portal'] }],
  });
  it('creates set-up, training and test actions for each change', () => {
    const t = w.tasks[0].id;
    for (const prefix of ['rm-build-', 'rm-train-', 'rm-test-']) expect(w.roadmap.some((r) => r.id === `${prefix}${t}`)).toBe(true);
    expect(w.roadmap.some((r) => r.id === 'rm-pilot')).toBe(true);
    expect(w.roadmap.some((r) => r.id === 'rm-decide')).toBe(true);
  });
  it('flags set-up as blocked while a prerequisite is unmet, and unblocks when it is complete', () => {
    const build = w.roadmap.find((r) => r.id.startsWith('rm-build-'))!;
    expect(checkTaskDependencies(build, w.roadmap).isBlocked).toBe(true);
    const done = w.roadmap.map((r) => (r.id.startsWith('rm-pre-') ? { ...r, status: 'Complete' as const } : r));
    expect(checkTaskDependencies(done.find((r) => r.id === build.id)!, done).isBlocked).toBe(false);
  });
  it('blocks the pilot behind every test, and the decision behind the pilot', () => {
    const decide = w.roadmap.find((r) => r.id === 'rm-decide')!;
    expect(checkTaskDependencies(decide, w.roadmap).isBlocked).toBe(true);
    expect(w.roadmap.find((r) => r.id === 'rm-pilot')!.dependencyIds.some((d) => d.startsWith('rm-test-'))).toBe(true);
  });
});

describe('roadmap staleness', () => {
  it('is fresh right after building, and stale once a task’s classification changes', () => {
    const w = fromQuickStart({ work: 'Invoice approval', who: 'AP team', steps: 'Receive invoice\nMatch to order\nApprove payment', problem: 'Slow', result: 'On time' });
    expect(roadmapIsStale(w.changePlan!, w.roadmap)).toBe(false);
    const flipped = w.tasks.map((t) => ({ ...t, override: { id: 'o', taskId: t.id, previousRecommendation: t.recommendation, newClassification: 'YOU' as const, user: 'x', timestamp: '', reason: 'r' } }));
    const plan = generateChangePlan(flipped, w.identity);
    expect(roadmapIsStale(plan, w.roadmap)).toBe(true);
  });
});

describe('redesign follows decisions', () => {
  it('flags a generated canvas as stale after a task is reclassified, and fresh after a rebuild', () => {
    const w = fromQuickStart({ work: 'Invoice approval', who: 'AP team', steps: 'Receive invoice\nMatch to order\nApprove payment', problem: 'Slow', result: 'On time' });
    expect(canvasIsStale(w.canvas, w.tasks)).toBe(false);
    const flipped = w.tasks.map((t, i) => (i === 0 ? { ...t, override: { id: 'o', taskId: t.id, previousRecommendation: t.recommendation, newClassification: t.recommendation === 'YOU' ? ('AI' as const) : ('YOU' as const), user: 'x', timestamp: '', reason: 'r' } } : t));
    expect(canvasIsStale(w.canvas, flipped)).toBe(true);
    expect(canvasIsStale(buildCanvas(flipped), flipped)).toBe(false);
  });
});

describe('confidence reflects placeholders and early estimates', () => {
  it('is not High when hours and rate are placeholders', () => {
    const w = fromQuickStart({ work: 'Invoice approval', who: 'AP team', steps: 'Receive invoice\nMatch to order\nApprove payment', problem: 'Slow', result: 'On time' });
    const c = calculateConfidence(w.identity, w.tasks, w.assumptions, { earlyEstimate: true });
    expect(c.level).not.toBe('High');
    const w2 = { ...w, tasks: w.tasks.map((t) => ({ ...t, override: { id: 'o', taskId: t.id, previousRecommendation: t.recommendation, newClassification: t.recommendation, user: 'x', timestamp: '', reason: 'r' } })) };
    expect(calculateConfidence(w2.identity, w2.tasks, w2.assumptions, { earlyEstimate: false }).level).not.toBe('High'); // still placeholders
    expect(c.missingInformation.join(' ')).toMatch(/placeholders/);
    expect(c.missingInformation.join(' ')).toMatch(/early estimate/);
  });
});

describe('Quick Start', () => {
  const ok = { work: 'Invoice approval', who: 'AP team', steps: '1. Receive\n2. Match to order\n3. Approve', problem: 'Slow approvals', result: 'Pay on time' };
  it('validates required answers and the 3–7 step range', () => {
    expect(validateQuickStart(ok).ok).toBe(true);
    expect(validateQuickStart({ ...ok, steps: 'One\nTwo' }).errors.steps).toMatch(/at least 3/);
    expect(validateQuickStart({ ...ok, steps: Array(8).fill('Step').join('\n') }).errors.steps).toMatch(/7 steps/);
    expect(validateQuickStart({ ...ok, work: '' }).errors.work).toBeTruthy();
  });
  it('parses list markers', () => {
    expect(parseSteps('1. One\n- Two\n• Three\n\n')).toEqual(['One', 'Two', 'Three']);
  });
  it('builds an early-estimate draft whose steps need review and carry assumptions', () => {
    const w = fromQuickStart(ok);
    expect(w.isEarlyEstimate).toBe(true);
    expect(w.startMode).toBe('quick-start');
    expect(w.tasks.every((t) => t.needsReview && t.source?.kind === 'user')).toBe(true);
    expect(w.assumptions.find((a) => a.id === 'hourly_cost')!.provenance).toBe('estimate');
    expect(w.pilotMetrics.every((m) => m.recorded === false)).toBe(true);
  });
});

describe('library', () => {
  it('has banking, a second industry and the weekly management report', () => {
    const industries = new Set(libraryWorkflows.map((l) => l.industry));
    expect(industries.has('Banking')).toBe(true);
    expect(industries.size).toBeGreaterThanOrEqual(3);
    expect(libraryWorkflows.some((l) => l.isWorkedExample)).toBe(true);
  });
  it('every starter carries the guidance the brief asks for', () => {
    for (const l of libraryWorkflows) {
      expect(l.roles.length).toBeGreaterThan(0);
      for (const k of ['commonProblems', 'questionsToVerify', 'aiOpportunities', 'skills', 'controls', 'measures'] as const) expect(l[k].length, `${l.id}.${k}`).toBeGreaterThan(0);
      if (!l.isWorkedExample) expect(l.steps.length).toBeGreaterThanOrEqual(5);
    }
  });
  it('copies a starter into a fresh workspace labelled as a template', () => {
    const lib = libraryWorkflows.find((l) => l.id === 'lib-bank-kyc')!;
    const a = fromLibrary(lib);
    const b = fromLibrary(lib);
    expect(a.id).not.toBe(b.id);
    expect(a.tasks.every((t) => t.source?.kind === 'template')).toBe(true);
    expect(a.guidance?.source).toMatch(/Not your actual process/);
    const kinds = new Set(a.tasks.map((t) => effectiveClassification(t)));
    expect(kinds.size).toBeGreaterThan(1);
  });
});

describe('migration of old saved workspaces', () => {
  it('fills defaults for a save made before the new fields existed', () => {
    const old: any = JSON.parse(JSON.stringify(seed));
    delete old.schemaVersion; delete old.changePlan; delete old.startMode;
    old.tasks.forEach((t: any) => { delete t.source; delete t.origin; });
    old.assumptions.forEach((a: any) => delete a.provenance);
    const m = migrateWorkflow(old);
    expect(m.schemaVersion).toBe(2);
    expect(m.changePlan!.length).toBeGreaterThan(0);
    expect(m.tasks.every((t) => t.source && t.origin === 'documented')).toBe(true);
    expect(m.assumptions.every((a) => a.provenance === 'template')).toBe(true);
  });
  it('does not overwrite what the user entered', () => {
    const w: any = { ...JSON.parse(JSON.stringify(seed)), assumptions: [{ id: 'hourly_cost', name: 'x', category: 'Labor', value: 99, unit: '$', description: '', provenance: 'user' }] };
    expect(migrateWorkflow(w).assumptions[0].provenance).toBe('user');
    expect(migrateWorkflow(w).assumptions[0].value).toBe(99);
  });
});

describe('final decision with no evidence', () => {
  it('does not recommend STOP when nothing has been recorded yet', () => {
    const w = fromQuickStart({ work: 'Invoice approval', who: 'AP team', steps: 'Receive invoice\nMatch to order\nApprove payment', problem: 'Slow', result: 'On time' });
    const r = generateFinalDecisionRecommendation(w.pilotMetrics, w.governanceItems);
    expect(r.recommendedOutcome).toBe('IMPROVE_AND_RETEST');
    expect(r.rationale).toMatch(/No pilot results are recorded/);
  });
});

describe('pilot: unrecorded metrics and wrong assumptions', () => {
  const metric = { id: 'm', name: 'Weekly labor time', unit: 'hrs/wk', baseline: 40, targetMin: 20, targetMax: 30, actual: 0, variance: 0, status: 'Insufficient evidence' as const };
  it('never counts an unrecorded metric as achieved', () => {
    expect(evaluatePilotMetric({ ...metric, recorded: false }).status).toBe('Insufficient evidence');
  });
  it('reports assumptions that were wrong, held, or untested', () => {
    const assumptions: any[] = [{ id: 'automation_min_pct', value: 40 }, { id: 'automation_max_pct', value: 60 }];
    expect(checkAssumptions([{ ...metric, actual: 35, recorded: true }], assumptions)[0].verdict).toBe('wrong'); // saved 12.5% < 40%
    expect(checkAssumptions([{ ...metric, actual: 20, recorded: true }], assumptions)[0].verdict).toBe('held'); // saved 50%
    expect(checkAssumptions([{ ...metric, recorded: false }], assumptions)[0].verdict).toBe('no-evidence');
  });
});

describe('scenario comparison', () => {
  const w = migrateWorkflow(seed);
  it('gives each scenario its own outcome, so they are not identical', () => {
    const [a, b] = compareScenarios(w);
    expect(a.hoursReleasedMonthly).toBeLessThan(b.hoursReleasedMonthly);
    expect(a.netAnnual).not.toBe(b.netAnnual);
    expect(b.implementationCost).toBeGreaterThan(a.implementationCost);
  });
  it('shows the downside if only 60% of the saving happens', () => {
    const [, b] = compareScenarios(w);
    expect(b.netAnnualIfSixtyPct).toBeLessThan(b.netAnnual);
  });
  it('leans cautious while prerequisites are missing and automated when none are', () => {
    const open = fromQuickStart({ work: 'Invoice approval', who: 'AP team', steps: 'Receive invoice\nMatch to order\nApprove payment', problem: 'Slow', result: 'On time' });
    expect(scenarioHints(open).some((h) => h.toward === 'cautious' && /prerequisite/.test(h.text))).toBe(true);
    expect(scenarioHints(w).some((h) => h.toward === 'automated' && /prerequisites are in place/.test(h.text))).toBe(true);
  });
});
