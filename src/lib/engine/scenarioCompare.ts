import { Scenario, WorkflowState } from '@/types';
import { effectiveClassification } from './effective';

export interface ScenarioOutcome {
  scenario: Scenario;
  hoursReleasedMonthly: number;
  implementationCost: number;
  runCostMonthly: number;
  netAnnual: number;
  /** Net annual benefit if only 60% of the stated time saving actually happens. */
  netAnnualIfSixtyPct: number;
  paybackMonths: number | null;
}

const num = (w: WorkflowState, id: string, fallback: number) => w.assumptions.find((a) => a.id === id)?.value ?? fallback;

/**
 * Compares scenarios from their own stated figures and the workflow's hourly cost.
 * Implementation cost scales the user's implementation-cost assumption by weeks, relative to the selected scenario.
 */
export function compareScenarios(w: WorkflowState): ScenarioOutcome[] {
  const hourly = num(w, 'hourly_cost', w.identity.cost.estimatedHourlyCost || 50);
  const baseCost = num(w, 'implementation_cost', 25000);
  const ref = w.scenarios.find((s) => s.isSelected) ?? w.scenarios[0];
  const perWeek = ref && ref.implementationEffortWeeks > 0 ? baseCost / ref.implementationEffortWeeks : baseCost / 4;

  return w.scenarios.map((s) => {
    const hours = s.potentialTimeReleasedHoursMonthly;
    const impl = Math.round(perWeek * s.implementationEffortWeeks);
    const grossMonthly = hours * hourly;
    const netMonthly = grossMonthly - s.operatingCostMonthly;
    const netSixty = grossMonthly * 0.6 - s.operatingCostMonthly;
    return {
      scenario: s,
      hoursReleasedMonthly: hours,
      implementationCost: impl,
      runCostMonthly: s.operatingCostMonthly,
      netAnnual: Math.round(netMonthly * 12),
      netAnnualIfSixtyPct: Math.round(netSixty * 12),
      paybackMonths: netMonthly > 0 ? Math.round((impl / netMonthly) * 10) / 10 : null,
    };
  });
}

export interface ScenarioHint {
  toward: 'cautious' | 'automated' | 'either';
  text: string;
}

/** Facts from the workspace that argue for the cautious or the more automated option. Advice to weigh, not a verdict. */
export function scenarioHints(w: WorkflowState): ScenarioHint[] {
  const hints: ScenarioHint[] = [];
  const tasks = w.tasks;
  const total = tasks.length || 1;
  const stakes = tasks.filter((t) => t.errorImpact === 'High' || t.errorImpact === 'Critical').length;
  const sensitive = tasks.filter((t) => t.sensitivity === 'Confidential' || t.sensitivity === 'Strictly Restricted').length;
  const unstructured = tasks.filter((t) => t.dataReadiness === 'Unstructured' || t.dataReadiness === 'Semi-structured').length;
  const unmet = (w.changePlan ?? []).reduce((n, c) => n + c.prerequisites.filter((p) => !p.met).length, 0);
  const aiTasks = tasks.filter((t) => effectiveClassification(t) === 'AI').length;
  const placeholders = w.assumptions.some((a) => (a.id === 'hourly_cost' || a.id === 'current_monthly_hours') && a.provenance === 'estimate');

  if (unmet > 0) hints.push({ toward: 'cautious', text: `${unmet} prerequisite${unmet > 1 ? 's are' : ' is'} still missing. The more automated option leans on them harder.` });
  else hints.push({ toward: 'automated', text: 'All prerequisites are in place, so the more automated option is not waiting on anything.' });

  if (stakes / total >= 0.4) hints.push({ toward: 'cautious', text: `${stakes} of ${total} tasks have a high cost of error. A person checking every output is cheap insurance.` });
  if (sensitive / total >= 0.4) hints.push({ toward: 'cautious', text: `${sensitive} of ${total} tasks touch confidential data, which narrows what AI may be given.` });
  if (unstructured / total >= 0.6) hints.push({ toward: 'cautious', text: 'Most inputs are not cleanly structured, so extraction errors are likelier early on.' });
  if (aiTasks / total >= 0.5) hints.push({ toward: 'automated', text: `${aiTasks} of ${total} tasks are already rated safe for AI, which is where automation pays.` });
  if (placeholders) hints.push({ toward: 'either', text: 'Hours or hourly cost are placeholders. Replace them before trusting either saving figure.' });
  return hints;
}
