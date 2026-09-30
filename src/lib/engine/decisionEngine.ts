import { Task, TaskClassification, ConfidenceLevel } from '@/types';

export interface TaskAssessmentResult {
  recommendation: TaskClassification;
  confidence: ConfidenceLevel;
  reasons: string[];
  riskFlags: string[];
  suggestedRoleSplit: {
    ai: string[];
    human: string[];
  };
}

/**
 * Deterministic rule-based Decision Engine for assessing task suitability.
 * Assesses repeatability, dataReadiness, judgmentRequired, sensitivity,
 * errorImpact, outputCheckability, exceptionRate, and humanRelationshipImportance.
 *
 * NOT dependent on any paid LLM API.
 */
export function assessTask(task: Partial<Task>): TaskAssessmentResult {
  const reasons: string[] = [];
  const riskFlags: string[] = [];
  const aiRoles: string[] = [];
  const humanRoles: string[] = [];

  const repeatability = task.repeatability || 'Medium';
  const dataReadiness = task.dataReadiness || 'Semi-structured';
  const judgmentRequired = task.judgmentRequired || 'Medium';
  const sensitivity = task.sensitivity || 'Internal';
  const errorImpact = task.errorImpact || 'Medium';
  const outputCheckability = task.outputCheckability || 'Moderate';
  const exceptionRate = task.exceptionRate || 'Medium';
  const humanRel = task.humanRelationshipImportance || 'Low';

  // Check for NEEDS ASSESSMENT condition
  if (dataReadiness === 'Missing') {
    return {
      recommendation: 'NEEDS_ASSESSMENT',
      confidence: 'Low',
      reasons: ['Data readiness is currently classified as Missing. Further intake is required.'],
      riskFlags: ['Insufficient information on source data structure.'],
      suggestedRoleSplit: {
        ai: ['Pending assessment'],
        human: ['Gather task input data requirements and examples'],
      },
    };
  }

  let aiScore = 0;
  let humanScore = 0;

  // 1. Repeatability
  if (repeatability === 'High') {
    aiScore += 3;
    reasons.push('High repeatability makes task routine and suitable for automated processing.');
    aiRoles.push('Execute standardized repetitive task steps');
  } else if (repeatability === 'Low') {
    humanScore += 3;
    reasons.push('Low repeatability requires custom handling for unique occurrences.');
    humanRoles.push('Lead custom step execution and design custom workflow path');
  }

  // 2. Data Readiness
  if (dataReadiness === 'Structured') {
    aiScore += 3;
    reasons.push('Structured data format enables reliable programmatic ingestion.');
    aiRoles.push('Ingest and parse structured dataset automatically');
  } else if (dataReadiness === 'Semi-structured') {
    aiScore += 1;
    humanScore += 1;
    reasons.push('Semi-structured data requires AI parsing with optional human verification.');
    aiRoles.push('Extract structured fields from semi-structured inputs');
  } else if (dataReadiness === 'Unstructured') {
    humanScore += 2;
    riskFlags.push('Unstructured input increases data extraction risk.');
    humanRoles.push('Review extracted unstructured content for contextual nuances');
  }

  // 3. Judgment Required
  if (judgmentRequired === 'Low') {
    aiScore += 3;
    reasons.push('Low cognitive judgment requirements allow rule-based/AI execution.');
  } else if (judgmentRequired === 'High') {
    humanScore += 4;
    reasons.push('High judgment requirement demands human expertise and business context.');
    humanRoles.push('Apply strategic judgment, operational context, and final decisions');
  }

  // 4. Sensitivity & Privacy
  if (sensitivity === 'Strictly Restricted' || sensitivity === 'Confidential') {
    humanScore += 3;
    riskFlags.push(`Data sensitivity level is ${sensitivity}. Data privacy controls required.`);
    humanRoles.push('Maintain strict access control and final authorization');
  }

  // 5. Consequences of Error / Error Impact
  if (errorImpact === 'Critical' || errorImpact === 'High') {
    humanScore += 3;
    riskFlags.push(`Error impact is ${errorImpact}. Human verification required prior to execution.`);
    humanRoles.push('Perform double-check approval before distributing outputs');
  }

  // 6. Output Checkability
  if (outputCheckability === 'Easy') {
    aiScore += 2;
    reasons.push('Outputs can be verified easily by human reviewers.');
    aiRoles.push('Generate initial outputs and highlight key metrics for rapid verification');
  } else if (outputCheckability === 'Difficult') {
    humanScore += 2;
    riskFlags.push('Difficult output checkability slows verification.');
  }

  // 7. Exception Rate
  if (exceptionRate === 'Low') {
    aiScore += 2;
    reasons.push('Low exception frequency allows uninterrupted automated execution.');
  } else if (exceptionRate === 'High') {
    humanScore += 3;
    riskFlags.push('High exception rate demands frequent human intervention.');
    humanRoles.push('Handle exceptions, edge cases, and missing inputs');
  }

  // 8. Human Relationship Importance
  if (humanRel === 'High') {
    humanScore += 3;
    reasons.push('Strong interpersonal or client relationship value requires human delivery.');
    humanRoles.push('Deliver communication and manage stakeholder relationship directly');
  }

  // Recommendation Determination
  let recommendation: TaskClassification = 'BOTH';
  let confidence: ConfidenceLevel = 'Medium';

  const totalScore = aiScore + humanScore;

  if (aiScore >= 7 && humanScore <= 3 && sensitivity !== 'Strictly Restricted' && errorImpact !== 'Critical') {
    recommendation = 'AI';
    confidence = aiScore >= 9 ? 'High' : 'Medium';
    if (aiRoles.length === 0) aiRoles.push('Autonomous task execution');
    humanRoles.push('Periodic audit and exception handling');
  } else if (humanScore >= 7 && aiScore <= 3) {
    recommendation = 'YOU';
    confidence = humanScore >= 9 ? 'High' : 'Medium';
    humanRoles.push('End-to-end task execution and decision making');
    aiRoles.push('Optional retrieval assistance or draft preparation');
  } else {
    recommendation = 'BOTH';
    confidence = 'High';
    if (aiRoles.length === 0) aiRoles.push('Data aggregation, initial drafting, and anomaly detection');
    if (humanRoles.length === 0) humanRoles.push('Exception validation, qualitative interpretation, and final signoff');
  }

  return {
    recommendation,
    confidence,
    reasons: Array.from(new Set(reasons)),
    riskFlags: Array.from(new Set(riskFlags)),
    suggestedRoleSplit: {
      ai: Array.from(new Set(aiRoles)),
      human: Array.from(new Set(humanRoles)),
    },
  };
}
