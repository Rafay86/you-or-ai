import { describe, it, expect } from 'vitest';
import { calculateCurrentCost, calculateFutureCost, calculateConfidence } from '../calculationEngine';
import { initialWeeklyManagementReportWorkflow } from '../../data/seedData';

describe('Calculation Engine', () => {
  it('calculates current baseline cost deterministically', () => {
    const current = calculateCurrentCost(initialWeeklyManagementReportWorkflow.identity);
    expect(current.hourlyRate).toBe(65);
    expect(current.weeklyHours).toBe(42);
    expect(current.monthlyHours).toBe(182);
    expect(current.monthlyLaborCost).toBe(11830);
    expect(current.annualLaborCost).toBe(141960);
  });

  it('calculates future cost estimates and time released ranges', () => {
    const future = calculateFutureCost(
      initialWeeklyManagementReportWorkflow.identity,
      initialWeeklyManagementReportWorkflow.tasks,
      initialWeeklyManagementReportWorkflow.scenarios[1], // Scenario B
      initialWeeklyManagementReportWorkflow.assumptions
    );

    expect(future.monthlyHoursSavedMin).toBeGreaterThan(0);
    expect(future.monthlyHoursSavedMax).toBeGreaterThan(future.monthlyHoursSavedMin);
    expect(future.netAnnualBenefitMin).toBeGreaterThan(0);
  });

  it('evaluates calculation confidence based on data completeness checklist', () => {
    const confidence = calculateConfidence(
      initialWeeklyManagementReportWorkflow.identity,
      initialWeeklyManagementReportWorkflow.tasks,
      initialWeeklyManagementReportWorkflow.assumptions
    );

    expect(confidence.score).toBeGreaterThanOrEqual(80);
    expect(confidence.level).toBe('High');
  });
});
