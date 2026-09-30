import { BusinessCaseAssumption, PilotMetric } from '@/types';
import { evaluatePilotMetric } from './pilotEngine';

export interface AssumptionFinding {
  label: string;
  expected: string;
  actual: string;
  verdict: 'held' | 'partly' | 'wrong' | 'no-evidence';
  note: string;
}

const isTime = (m: PilotMetric) => /labor time|hours/i.test(m.name);

/**
 * Compares what the plan assumed with what the pilot measured, so people can see which assumptions were wrong.
 */
export function checkAssumptions(metrics: PilotMetric[], assumptions: BusinessCaseAssumption[]): AssumptionFinding[] {
  const out: AssumptionFinding[] = [];
  const minA = assumptions.find((a) => a.id === 'automation_min_pct')?.value;
  const maxA = assumptions.find((a) => a.id === 'automation_max_pct')?.value;

  for (const raw of metrics) {
    const m = evaluatePilotMetric(raw);
    const target = `${m.targetMin}–${m.targetMax} ${m.unit}`;
    if (raw.recorded === false || m.status === 'Insufficient evidence') {
      out.push({ label: m.name, expected: target, actual: 'Not recorded', verdict: 'no-evidence', note: 'No pilot result yet, so this assumption is untested.' });
      continue;
    }
    if (isTime(m) && m.baseline > 0 && minA !== undefined && maxA !== undefined) {
      const saved = Math.round(((m.baseline - m.actual) / m.baseline) * 100);
      const verdict = saved < minA ? 'wrong' : 'held';
      out.push({
        label: 'Share of time released',
        expected: `${minA}–${maxA}%`,
        actual: `${saved}%`,
        verdict,
        note: saved < minA ? 'Less time was released than assumed. The business case is too optimistic.' : saved > maxA ? 'More time was released than assumed. The case may be conservative.' : 'Inside the assumed range.',
      });
      continue;
    }
    out.push({
      label: m.name,
      expected: target,
      actual: `${m.actual} ${m.unit}`,
      verdict: m.status === 'Achieved' ? 'held' : m.status === 'Partially achieved' ? 'partly' : 'wrong',
      note: m.summaryText,
    });
  }
  return out;
}
