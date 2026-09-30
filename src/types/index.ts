export type TaskClassification = 'YOU' | 'AI' | 'BOTH' | 'NEEDS_ASSESSMENT';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface DecisionOverride {
  id: string;
  taskId: string;
  previousRecommendation: TaskClassification;
  newClassification: TaskClassification;
  user: string;
  timestamp: string;
  reason: string;
  note?: string;
}

export interface Task {
  id: string;
  stepNumber: number;
  name: string;
  description: string;
  currentOwner: string;
  frequency: string;
  repeatability: 'Low' | 'Medium' | 'High';
  dataReadiness: 'Structured' | 'Semi-structured' | 'Unstructured' | 'Missing';
  judgmentRequired: 'Low' | 'Medium' | 'High';
  sensitivity: 'Public' | 'Internal' | 'Confidential' | 'Strictly Restricted';
  errorImpact: 'Low' | 'Medium' | 'High' | 'Critical';
  outputCheckability: 'Easy' | 'Moderate' | 'Difficult';
  exceptionRate: 'Low' | 'Medium' | 'High';
  humanRelationshipImportance: 'Low' | 'Medium' | 'High';
  recommendation: TaskClassification;
  confidence: ConfidenceLevel;
  reasons: string[];
  riskFlags: string[];
  suggestedRoleSplit: {
    ai: string[];
    human: string[];
  };
  override?: DecisionOverride;
}

export interface WorkflowIdentity {
  id: string;
  name: string;
  purpose: string;
  businessFunction: string;
  owner: string;
  frequency: string;
  startTrigger: string;
  endOutcome: string;
  people: {
    teamsInvolved: string[];
    numberOfPeople: number;
    roles: string[];
    reviewers: string[];
    approvers: string[];
  };
  systems: string[];
  volume: {
    itemsPerWeek: number;
    itemsPerMonth: number;
    avgProcessingTimeHours: number;
    peakVolume: string;
  };
  cost: {
    estimatedHourlyCost: number;
    currentWeeklyHours: number;
    currentMonthlyHours: number;
  };
  performance: {
    avgCycleTimeDays: number;
    errorReworkRatePct: number;
    delayFrequency: string;
    sla: string;
    qualityMeasure: string;
  };
  painPoints: string[];
}

export type NodeType = 'Human' | 'AI' | 'Human + AI' | 'System' | 'Decision' | 'Review' | 'Exception' | 'Output';

export interface WorkflowNode {
  id: string;
  label: string;
  type: NodeType;
  owner: string;
  description: string;
  reviewPoint?: boolean;
  exceptionPath?: boolean;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface WorkflowCanvasData {
  currentState: {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  };
  proposedState: {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  };
}

export interface Scenario {
  id: 'scenario-a' | 'scenario-b';
  name: string;
  tagline: string;
  humanEffortHoursMonthly: number;
  aiInvolvementPct: number;
  implementationEffortWeeks: number;
  operatingCostMonthly: number;
  potentialTimeReleasedHoursMonthly: number;
  keyRisks: string[];
  requiredControls: string[];
  isSelected: boolean;
}

export interface BusinessCaseAssumption {
  id: string;
  name: string;
  category: 'Labor' | 'Volume' | 'Automation' | 'Implementation' | 'Operating';
  value: number;
  unit: string;
  description: string;
}

export type RoadmapStatus = 'Not started' | 'In progress' | 'Blocked' | 'Complete';
export type Timeframe = '0-30' | '31-60' | '61-90';

export interface RoadmapItem {
  id: string;
  timeframe: Timeframe;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: RoadmapStatus;
  dependencyIds: string[];
  evidenceRequired: string;
  overrideReason?: string;
}

export type MetricStatus = 'Achieved' | 'Partially achieved' | 'Not achieved' | 'Insufficient evidence';

export interface PilotMetric {
  id: string;
  name: string;
  unit: string;
  baseline: number;
  targetMin: number;
  targetMax: number;
  actual: number;
  variance: number;
  status: MetricStatus;
}

export type GovernanceStatus = 'Not assessed' | 'In review' | 'Evidence provided' | 'Approved by owner';

export interface GovernanceItem {
  id: string;
  category: 'Data Sensitivity' | 'Human Oversight' | 'Testing Evidence' | 'Approvals';
  title: string;
  status: GovernanceStatus;
  owner: string;
  evidence: string;
  tags?: string[];
}

export type FinalDecisionOutcome = 'EXPAND' | 'IMPROVE_AND_RETEST' | 'STOP';

export interface FinalDecisionState {
  recommendedOutcome: FinalDecisionOutcome;
  selectedOutcome: FinalDecisionOutcome;
  overrideReason?: string;
  evidenceSummary: string[];
  openRisks: string[];
  evidenceGaps: string[];
  decidedBy: string;
  decidedAt: string;
}

export interface WorkflowState {
  id: string;
  identity: WorkflowIdentity;
  tasks: Task[];
  decisionTrace: DecisionOverride[];
  canvas: WorkflowCanvasData;
  scenarios: Scenario[];
  assumptions: BusinessCaseAssumption[];
  roadmap: RoadmapItem[];
  pilotMetrics: PilotMetric[];
  governanceItems: GovernanceItem[];
  finalDecision: FinalDecisionState;
  activeStep: number; // 1 to 7
  lastUpdated: string;
  isTemplateExample: boolean;
}

export interface TemplateDefinition {
  id: string;
  title: string;
  description: string;
  isImplemented: boolean;
  defaultState?: Partial<WorkflowState>;
}
