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

export type SourceKind = 'document' | 'template' | 'user';

/** Where a piece of information came from. Uploaded items carry the page or section they were read from. */
export interface InfoSource {
  kind: SourceKind;
  /** e.g. "Page 3" or "Section 4.2 Escalation" */
  ref?: string;
  excerpt?: string;
}

export interface Task {
  id: string;
  /** Where this step came from. */
  source?: InfoSource;
  /** 'documented' = in the formal procedure; 'observed' = happens in practice but is not written down. */
  origin?: 'documented' | 'observed';
  expectedOutput?: string;
  volume?: string;
  timeHoursPerCycle?: number;
  costNote?: string;
  systems?: string[];
  delays?: string;
  handoffs?: string;
  exceptions?: string;
  /** Things the extractor or user flagged as unclear or missing. */
  openQuestions?: string[];
  /** True until the user has confirmed an extracted or drafted step. */
  needsReview?: boolean;
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

export type Provenance = 'user' | 'template' | 'estimate';

export interface BusinessCaseAssumption {
  id: string;
  /** user = a fact the user supplied; template = from a starter; estimate = the product's own guess. */
  provenance?: Provenance;
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
  /** false until the user enters a real result; unrecorded metrics never count as achieved. */
  recorded?: boolean;
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
  /** The task and change this item exists for. */
  taskId?: string;
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

export type ControlArea = 'Data' | 'Privacy' | 'Security' | 'Quality' | 'Operational';

/** One proposed change to one task, with everything needed to make it real. */
export interface ChangeItem {
  id: string;
  taskId: string;
  summary: string;
  rolesAffected: string[];
  skillsNeeded: string[];
  trainingActions: string[];
  newResponsibilities: string[];
  businessOwner: string;
  technicalOwner: string;
  controls: { area: ControlArea; text: string }[];
  testingRequired: string;
  approvalRequired: string;
  openRisks: string[];
  prerequisites: { id: string; text: string; met: boolean }[];
}

export type StartMode = 'quick-start' | 'upload' | 'library' | 'example';

export const SCHEMA_VERSION = 2;

export interface WorkflowState {
  id: string;
  schemaVersion?: number;
  startMode?: StartMode;
  /** Quick Start drafts are labelled as early estimates until more detail is supplied. */
  isEarlyEstimate?: boolean;
  /** Uploaded workflows must be reviewed and confirmed before analysis proceeds. */
  reviewConfirmed?: boolean;
  /** Name of the uploaded file, kept for provenance; the contents are never stored beyond extracted steps. */
  sourceDocumentName?: string;
  changePlan?: ChangeItem[];
  /** True once the user has hand-edited the redesign canvas, so decisions no longer rebuild it automatically. */
  canvasEdited?: boolean;
  /** Notes carried over from a library starter: things to verify, AI ideas and suggested measures. */
  guidance?: { source: string; questionsToVerify: string[]; aiOpportunities: string[]; measures: string[] };
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
