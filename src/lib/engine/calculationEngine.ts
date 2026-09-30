import { WorkflowIdentity, Task, Scenario, BusinessCaseAssumption, ConfidenceLevel } from '@/types';

export interface CurrentCostBreakdown {
  peopleCount: number;
  weeklyHours: number;
  monthlyHours: number;
  hourlyRate: number;
  monthlyLaborCost: number;
  annualLaborCost: number;
}

export interface FutureCostEstimate {
  automationMinPct: number;
  automationMaxPct: number;
  futureMonthlyHoursMin: number;
  futureMonthlyHoursMax: number;
  futureMonthlyCostMin: number;
  futureMonthlyCostMax: number;
  monthlyHoursSavedMin: number;
  monthlyHoursSavedMax: number;
  annualHoursSavedMin: number;
  annualHoursSavedMax: number;
  grossAnnualSavingsMin: number;
  grossAnnualSavingsMax: number;
  implementationCost: number;
  ongoingOperatingCostMonthly: number;
  netAnnualBenefitMin: number;
  netAnnualBenefitMax: number;
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number; // 0 to 100
  checklist: { item: string; satisfied: boolean }[];
  missingInformation: string[];
}

/**
 * Calculates current baseline labor hours and costs deterministically.
 */
export function calculateCurrentCost(identity: WorkflowIdentity): CurrentCostBreakdown {
  const peopleCount = identity.people?.numberOfPeople || 1;
  const hourlyRate = identity.cost?.estimatedHourlyCost || 50;
  
  const weeklyHours = identity.cost?.currentWeeklyHours || (peopleCount * 8);
  const monthlyHours = identity.cost?.currentMonthlyHours || Math.round(weeklyHours * 4.33);
  
  const monthlyLaborCost = Math.round(monthlyHours * hourlyRate);
  const annualLaborCost = Math.round(monthlyLaborCost * 12);

  return {
    peopleCount,
    weeklyHours,
    monthlyHours,
    hourlyRate,
    monthlyLaborCost,
    annualLaborCost,
  };
}

/**
 * Calculates future-state ranges based on tasks, selected scenario, and editable assumptions.
 */
export function calculateFutureCost(
  identity: WorkflowIdentity,
  tasks: Task[],
  selectedScenario?: Scenario,
  assumptions: BusinessCaseAssumption[] = []
): FutureCostEstimate {
  const current = calculateCurrentCost(identity);

  // Helper to extract assumption value or fallback
  const getAssumption = (id: string, fallback: number) => {
    const found = assumptions.find((a) => a.id === id);
    return found !== undefined ? found.value : fallback;
  };

  // Base automation potential from tasks assessment
  const totalTasks = tasks.length || 1;
  const aiTasks = tasks.filter((t) => (t.override ? t.override.newClassification : t.recommendation) === 'AI').length;
  const bothTasks = tasks.filter((t) => (t.override ? t.override.newClassification : t.recommendation) === 'BOTH').length;

  // AI tasks yield ~75-90% time reduction, BOTH yield ~35-50% time reduction
  let calculatedAutomationMinPct = Math.round(((aiTasks * 0.75 + bothTasks * 0.35) / totalTasks) * 100);
  let calculatedAutomationMaxPct = Math.round(((aiTasks * 0.90 + bothTasks * 0.55) / totalTasks) * 100);

  // Bound between 10% and 85%
  calculatedAutomationMinPct = Math.max(10, Math.min(75, calculatedAutomationMinPct));
  calculatedAutomationMaxPct = Math.max(calculatedAutomationMinPct + 10, Math.min(85, calculatedAutomationMaxPct));

  // If scenario is active, adjust by scenario characteristics
  if (selectedScenario) {
    if (selectedScenario.id === 'scenario-a') {
      // Cautious human-led
      calculatedAutomationMinPct = Math.max(15, calculatedAutomationMinPct - 10);
      calculatedAutomationMaxPct = Math.max(25, calculatedAutomationMaxPct - 10);
    } else if (selectedScenario.id === 'scenario-b') {
      // More automated
      calculatedAutomationMinPct = Math.min(70, calculatedAutomationMinPct + 10);
      calculatedAutomationMaxPct = Math.min(85, calculatedAutomationMaxPct + 10);
    }
  }

  // Override by assumptions if explicitly edited
  const automationMinPct = getAssumption('automation_min_pct', calculatedAutomationMinPct);
  const automationMaxPct = getAssumption('automation_max_pct', calculatedAutomationMaxPct);
  const implementationCost = getAssumption('implementation_cost', selectedScenario ? selectedScenario.implementationEffortWeeks * 5000 : 25000);
  const ongoingOperatingCostMonthly = getAssumption('operating_cost_monthly', selectedScenario ? selectedScenario.operatingCostMonthly : 1200);

  const monthlyHoursSavedMin = Math.round(current.monthlyHours * (automationMinPct / 100));
  const monthlyHoursSavedMax = Math.round(current.monthlyHours * (automationMaxPct / 100));

  const futureMonthlyHoursMin = Math.max(0, current.monthlyHours - monthlyHoursSavedMax);
  const futureMonthlyHoursMax = Math.max(0, current.monthlyHours - monthlyHoursSavedMin);

  const futureMonthlyCostMin = Math.round(futureMonthlyHoursMin * current.hourlyRate);
  const futureMonthlyCostMax = Math.round(futureMonthlyHoursMax * current.hourlyRate);

  const annualHoursSavedMin = monthlyHoursSavedMin * 12;
  const annualHoursSavedMax = monthlyHoursSavedMax * 12;

  const grossAnnualSavingsMin = monthlyHoursSavedMin * current.hourlyRate * 12;
  const grossAnnualSavingsMax = monthlyHoursSavedMax * current.hourlyRate * 12;

  const annualOperatingCost = ongoingOperatingCostMonthly * 12;

  const netAnnualBenefitMin = Math.round(grossAnnualSavingsMin - annualOperatingCost);
  const netAnnualBenefitMax = Math.round(grossAnnualSavingsMax - annualOperatingCost);

  return {
    automationMinPct,
    automationMaxPct,
    futureMonthlyHoursMin,
    futureMonthlyHoursMax,
    futureMonthlyCostMin,
    futureMonthlyCostMax,
    monthlyHoursSavedMin,
    monthlyHoursSavedMax,
    annualHoursSavedMin,
    annualHoursSavedMax,
    grossAnnualSavingsMin,
    grossAnnualSavingsMax,
    implementationCost,
    ongoingOperatingCostMonthly,
    netAnnualBenefitMin,
    netAnnualBenefitMax,
  };
}

/**
 * Assesses calculation confidence deterministically based on data completeness.
 */
export function calculateConfidence(
  identity: WorkflowIdentity,
  tasks: Task[],
  assumptions: BusinessCaseAssumption[] = []
): ConfidenceAssessment {
  const checklist = [
    { item: 'Workflow volume & processing time defined', satisfied: (identity.volume?.itemsPerWeek ?? 0) > 0 },
    { item: 'Current labor hours and hourly rate provided', satisfied: (identity.cost?.estimatedHourlyCost ?? 0) > 0 && (identity.cost?.currentWeeklyHours ?? 0) > 0 },
    { item: 'All core workflow tasks classified', satisfied: tasks.length > 0 && tasks.every((t) => t.recommendation !== 'NEEDS_ASSESSMENT') },
    { item: 'Task overrides and decision trace reviewed', satisfied: tasks.some((t) => t.override !== undefined) },
    { item: 'Future-state business case assumptions calibrated', satisfied: assumptions.length >= 3 },
  ];

  const satisfiedCount = checklist.filter((c) => c.satisfied).length;
  const score = Math.round((satisfiedCount / checklist.length) * 100);

  let level: ConfidenceLevel = 'Low';
  if (score >= 80) level = 'High';
  else if (score >= 50) level = 'Medium';

  const missingInformation = checklist.filter((c) => !c.satisfied).map((c) => c.item);

  return {
    level,
    score,
    checklist,
    missingInformation,
  };
}
