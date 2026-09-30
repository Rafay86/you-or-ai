import { describe, it, expect } from 'vitest';
import { assessTask } from '../decisionEngine';

describe('Decision Engine', () => {
  it('recommends AI for highly repetitive, structured, low-judgment tasks', () => {
    const res = assessTask({
      repeatability: 'High',
      dataReadiness: 'Structured',
      judgmentRequired: 'Low',
      sensitivity: 'Internal',
      errorImpact: 'Low',
      outputCheckability: 'Easy',
      exceptionRate: 'Low',
      humanRelationshipImportance: 'Low',
    });

    expect(res.recommendation).toBe('AI');
    expect(res.confidence).toBe('High');
    expect(res.suggestedRoleSplit.ai.length).toBeGreaterThan(0);
  });

  it('recommends YOU (Human) for high-judgment, sensitive, low-repeatability tasks', () => {
    const res = assessTask({
      repeatability: 'Low',
      dataReadiness: 'Unstructured',
      judgmentRequired: 'High',
      sensitivity: 'Confidential',
      errorImpact: 'Critical',
      outputCheckability: 'Difficult',
      exceptionRate: 'High',
      humanRelationshipImportance: 'High',
    });

    expect(res.recommendation).toBe('YOU');
    expect(res.riskFlags.length).toBeGreaterThan(0);
  });

  it('recommends BOTH for repetitive tasks with high judgment exception handling', () => {
    const res = assessTask({
      repeatability: 'High',
      dataReadiness: 'Semi-structured',
      judgmentRequired: 'High',
      sensitivity: 'Internal',
      errorImpact: 'High',
      outputCheckability: 'Moderate',
      exceptionRate: 'Medium',
      humanRelationshipImportance: 'Medium',
    });

    expect(res.recommendation).toBe('BOTH');
    expect(res.suggestedRoleSplit.ai.length).toBeGreaterThan(0);
    expect(res.suggestedRoleSplit.human.length).toBeGreaterThan(0);
  });

  it('returns NEEDS_ASSESSMENT when critical input data is missing', () => {
    const res = assessTask({
      dataReadiness: 'Missing',
    });

    expect(res.recommendation).toBe('NEEDS_ASSESSMENT');
    expect(res.confidence).toBe('Low');
  });
});
