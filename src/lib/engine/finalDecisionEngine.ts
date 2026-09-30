import { PilotMetric, FinalDecisionOutcome, FinalDecisionState, GovernanceItem } from '@/types';
import { evaluateAllPilotMetrics } from './pilotEngine';

export interface FinalDecisionAssessment {
  recommendedOutcome: FinalDecisionOutcome;
  rationale: string;
  evidenceSummary: string[];
  openRisks: string[];
  evidenceGaps: string[];
}

/**
 * Generates automated neutral decision recommendation based on pilot evidence and governance status.
 */
export function generateFinalDecisionRecommendation(
  metrics: PilotMetric[],
  governanceItems: GovernanceItem[] = []
): FinalDecisionAssessment {
  const evaluated = evaluateAllPilotMetrics(metrics);

  const achievedCount = evaluated.filter((m) => m.status === 'Achieved').length;
  const partialCount = evaluated.filter((m) => m.status === 'Partially achieved').length;
  const notAchievedCount = evaluated.filter((m) => m.status === 'Not achieved').length;
  const total = evaluated.length || 1;

  const evidenceSummary: string[] = [];
  const openRisks: string[] = [];
  const evidenceGaps: string[] = [];

  evaluated.forEach((m) => {
    if (m.status === 'Achieved') {
      evidenceSummary.push(`${m.name}: ${m.summaryText}`);
    } else if (m.status === 'Partially achieved') {
      openRisks.push(`${m.name} below target range (${m.actual} vs target ${m.targetMin}–${m.targetMax} ${m.unit})`);
    } else if (m.status === 'Not achieved') {
      openRisks.push(`${m.name} failed to improve over baseline (${m.actual} vs baseline ${m.baseline} ${m.unit})`);
    } else {
      evidenceGaps.push(`${m.name}: Insufficient empirical pilot data recorded.`);
    }
  });

  // Governance check
  const unapprovedGov = governanceItems.filter(
    (g) => g.status === 'Not assessed' || g.status === 'In review'
  );

  if (unapprovedGov.length > 0) {
    openRisks.push(`${unapprovedGov.length} governance item(s) pending approval (e.g. ${unapprovedGov[0].title})`);
  }

  let recommendedOutcome: FinalDecisionOutcome = 'IMPROVE_AND_RETEST';
  let rationale = '';

  const achievedRatio = achievedCount / total;

  if (achievedRatio >= 0.75 && notAchievedCount === 0 && unapprovedGov.length === 0) {
    recommendedOutcome = 'EXPAND';
    rationale = 'Empirical evidence supports broader rollout. Primary targets achieved with verified controls.';
  } else if (achievedRatio >= 0.4 || partialCount > 0) {
    recommendedOutcome = 'IMPROVE_AND_RETEST';
    rationale = 'Value demonstrated in time/efficiency, but adoption or governance gaps require refinement before scale.';
  } else {
    recommendedOutcome = 'STOP';
    rationale = 'Pilot metrics do not currently justify investment. Critical gaps identified in baseline comparison.';
  }

  if (evidenceGaps.length === 0) {
    evidenceGaps.push('Long-term multi-quarter reliability dataset');
  }

  return {
    recommendedOutcome,
    rationale,
    evidenceSummary,
    openRisks,
    evidenceGaps,
  };
}
