import { Task } from '@/types';

/**
 * Industry Workflow Library. Everything here is fictional and illustrative.
 * These are starting points to edit, never a claim about anyone's actual procedure or any regulation.
 */
export interface LibraryStep {
  name: string;
  description: string;
  owner: string;
  systems: string[];
  attrs: Partial<Task>;
  /** What the typical output of this step is. */
  output: string;
  delay?: string;
  handoff?: string;
  exception?: string;
}

export interface LibraryWorkflow {
  id: string;
  industry: string;
  function: string;
  title: string;
  summary: string;
  /** Loads the built-in worked example instead of building from the steps below. */
  isWorkedExample?: boolean;
  roles: string[];
  steps: LibraryStep[];
  commonProblems: string[];
  questionsToVerify: string[];
  aiOpportunities: string[];
  skills: string[];
  controls: string[];
  measures: string[];
}

type L = 'Low' | 'Medium' | 'High';
type Code = [rep: L, data: 'S' | 'M' | 'U', judg: L, sens: 'I' | 'C' | 'R', err: 'Low' | 'Medium' | 'High' | 'Critical', check: 'E' | 'M' | 'D', exc: L, rel: L];

function attrs(c: Code): Partial<Task> {
  return {
    repeatability: c[0],
    dataReadiness: { S: 'Structured', M: 'Semi-structured', U: 'Unstructured' }[c[1]] as Task['dataReadiness'],
    judgmentRequired: c[2],
    sensitivity: { I: 'Internal', C: 'Confidential', R: 'Strictly Restricted' }[c[3]] as Task['sensitivity'],
    errorImpact: c[4],
    outputCheckability: { E: 'Easy', M: 'Moderate', D: 'Difficult' }[c[5]] as Task['outputCheckability'],
    exceptionRate: c[6],
    humanRelationshipImportance: c[7],
  };
}

const step = (
  name: string, description: string, owner: string, systems: string[], code: Code,
  output: string, extra: { delay?: string; handoff?: string; exception?: string } = {}
): LibraryStep => ({ name, description, owner, systems, attrs: attrs(code), output, ...extra });

export const libraryWorkflows: LibraryWorkflow[] = [
  {
    id: 'lib-weekly-management-report',
    industry: 'Cross-industry',
    function: 'Finance & Operations',
    title: 'Weekly management report',
    summary: 'Collect updates from teams, spot what changed, explain it, agree it with department leads and send it to leadership.',
    isWorkedExample: true,
    roles: ['Operations analyst', 'Senior analyst', 'Operations manager', 'VP Operations', 'Department leads'],
    steps: [],
    commonProblems: ['Updates arrive late and in different formats', 'Numbers are re-keyed and drift', 'The commentary is rewritten from scratch every week'],
    questionsToVerify: ['Who decides what counts as a “major” change?', 'Which updates are contractually or legally sensitive?', 'Who is accountable for what the executives read?'],
    aiOpportunities: ['Gather and normalise the updates', 'Flag movements beyond agreed thresholds', 'Draft the first version of the commentary'],
    skills: ['Checking AI-drafted commentary against source numbers', 'Setting and tuning variance thresholds'],
    controls: ['Named person signs off before distribution', 'Source-to-report reconciliation each cycle'],
    measures: ['Weekly hours spent', 'Errors found after distribution', 'Department lead adoption'],
  },
  {
    id: 'lib-bank-kyc',
    industry: 'Banking',
    function: 'Operations',
    title: 'Customer onboarding and identity review',
    summary: 'A fictional retail bank checks a new customer’s documents and identity before opening an account.',
    roles: ['Onboarding officer', 'Compliance analyst', 'Branch relationship manager', 'Operations lead'],
    steps: [
      step('Receive application and documents', 'Collect the application form and supporting documents from the branch or portal.', 'Onboarding officer', ['Onboarding portal', 'Email'], ['High', 'M', 'Low', 'C', 'Medium', 'E', 'Medium', 'Low'], 'Complete application pack', { delay: 'Missing documents wait days for a reply', handoff: 'Branch to operations' }),
      step('Check documents are complete and readable', 'Confirm every required document is present, in date and legible.', 'Onboarding officer', ['Onboarding portal'], ['High', 'M', 'Low', 'C', 'Medium', 'E', 'Medium', 'Low'], 'Documents-complete flag', { exception: 'Poor scans and unusual document types' }),
      step('Extract customer details into the core system', 'Key name, address, date of birth and ID numbers into the account system.', 'Onboarding officer', ['Core banking system'], ['High', 'S', 'Low', 'R', 'High', 'E', 'Low', 'Low'], 'Customer record', { delay: 'Re-keying causes typos that are found later' }),
      step('Screen against sanctions and watch lists', 'Run the customer through the screening tool and review matches.', 'Compliance analyst', ['Screening tool'], ['High', 'S', 'Medium', 'R', 'Critical', 'M', 'Medium', 'Low'], 'Screening result', { exception: 'Name matches that need judgement' }),
      step('Assess customer risk and decide whether to proceed', 'Weigh the evidence and decide whether to approve, request more, or decline.', 'Compliance analyst', ['Core banking system'], ['Low', 'M', 'High', 'R', 'Critical', 'D', 'High', 'Medium'], 'Approve / hold / decline decision', { handoff: 'Analyst to senior compliance for unusual cases' }),
      step('Tell the customer the outcome', 'Contact the customer to confirm, ask for more, or explain a decline.', 'Branch relationship manager', ['Email', 'Phone'], ['Medium', 'U', 'High', 'C', 'High', 'M', 'High', 'High'], 'Customer informed'),
    ],
    commonProblems: ['Re-keying errors from documents', 'Long waits when a document is missing', 'Inconsistent handling of unusual cases'],
    questionsToVerify: ['Which documents does your own policy require?', 'Which steps may lawfully use automated processing under your rules?', 'Who is accountable for a decline decision?'],
    aiOpportunities: ['Read documents and pre-fill the record for a person to check', 'Chase missing documents with a standard message', 'Summarise screening matches for the analyst'],
    skills: ['Spot-checking extracted document data', 'Explaining decisions to customers without deferring to the tool'],
    controls: ['Restrict identity data to approved systems', 'A named analyst makes every approve or decline decision', 'Keep an audit trail of what the AI proposed and what the person decided'],
    measures: ['Time from application to decision', 'Re-keying error rate', 'Share of cases needing a second review'],
  },
  {
    id: 'lib-bank-loan-docs',
    industry: 'Banking',
    function: 'Lending',
    title: 'Retail loan document check',
    summary: 'A fictional lender verifies income and supporting documents before an underwriter decides.',
    roles: ['Loan processor', 'Underwriter', 'Relationship manager'],
    steps: [
      step('Collect income and identity documents', 'Ask the applicant for payslips, statements and ID, and track what has arrived.', 'Loan processor', ['Loan origination system', 'Email'], ['High', 'M', 'Low', 'C', 'Medium', 'E', 'Medium', 'Low'], 'Document checklist', { delay: 'Applicants send documents in pieces over days' }),
      step('Read documents and capture the figures', 'Read payslips and statements and capture income, employer and obligations.', 'Loan processor', ['Loan origination system'], ['High', 'U', 'Low', 'C', 'High', 'E', 'Medium', 'Low'], 'Income and obligations summary', { exception: 'Self-employed and irregular income' }),
      step('Check figures against the application', 'Compare captured figures with what the applicant declared and flag differences.', 'Loan processor', ['Loan origination system'], ['High', 'S', 'Low', 'C', 'High', 'E', 'Low', 'Low'], 'Discrepancy list'),
      step('Underwrite and decide', 'Assess affordability and risk against your lending policy and make the decision.', 'Underwriter', ['Loan origination system', 'Credit bureau'], ['Low', 'M', 'High', 'C', 'Critical', 'D', 'High', 'Medium'], 'Decision and conditions', { handoff: 'Processor to underwriter' }),
      step('Discuss the decision and next steps with the applicant', 'Explain the decision, the conditions and what happens next.', 'Relationship manager', ['Phone', 'Email'], ['Medium', 'U', 'High', 'C', 'High', 'M', 'High', 'High'], 'Applicant informed'),
    ],
    commonProblems: ['Documents arrive incomplete and out of order', 'Manual figure capture causes mistakes', 'Underwriters spend time on routine checks'],
    questionsToVerify: ['Which parts of the decision must a person make under your policy?', 'How are declined applicants’ documents retained?', 'Who reviews the AI’s discrepancy flags?'],
    aiOpportunities: ['Capture figures from documents for a person to verify', 'Flag mismatches between documents and the application', 'Draft the underwriter’s file summary'],
    skills: ['Verifying captured figures against documents', 'Reading AI-generated file summaries critically'],
    controls: ['The underwriter makes and records the decision', 'Sample-check captured figures every cycle', 'Applicant data stays in approved systems'],
    measures: ['Days from application to decision', 'Figure-capture error rate', 'Underwriter time per file'],
  },
  {
    id: 'lib-bank-complaints',
    industry: 'Banking',
    function: 'Customer service',
    title: 'Customer complaint triage',
    summary: 'A fictional bank sorts incoming complaints, finds the facts and replies to the customer.',
    roles: ['Service agent', 'Complaints handler', 'Team lead'],
    steps: [
      step('Log the complaint and categorise it', 'Record the complaint from email, phone or branch and assign a category.', 'Service agent', ['Case management system'], ['High', 'M', 'Low', 'C', 'Medium', 'E', 'Medium', 'Low'], 'Categorised case'),
      step('Gather the account history and facts', 'Pull the transactions and earlier contacts relevant to the complaint.', 'Complaints handler', ['Core banking system', 'Case management system'], ['High', 'S', 'Low', 'C', 'Medium', 'E', 'Low', 'Low'], 'Fact pack'),
      step('Decide whether the complaint is upheld and what to offer', 'Judge the case and decide on remedy within your own rules.', 'Complaints handler', ['Case management system'], ['Low', 'M', 'High', 'C', 'High', 'D', 'High', 'High'], 'Decision and remedy'),
      step('Write and send the reply', 'Draft a clear, empathetic reply and send it.', 'Complaints handler', ['Email'], ['Medium', 'U', 'Medium', 'C', 'High', 'M', 'Medium', 'High'], 'Reply to customer'),
      step('Escalate serious or repeat complaints', 'Decide which complaints go to a senior reviewer.', 'Team lead', ['Case management system'], ['Low', 'M', 'High', 'C', 'High', 'D', 'High', 'Medium'], 'Escalation decision'),
    ],
    commonProblems: ['Cases sit in a queue before anyone reads them', 'Facts are scattered across systems', 'Replies vary in quality and tone'],
    questionsToVerify: ['Which categories must a person always read?', 'What tone rules apply to replies?', 'Who owns the escalation rules?'],
    aiOpportunities: ['Categorise and route cases', 'Assemble the fact pack', 'Draft a reply for the handler to edit'],
    skills: ['Editing an AI draft so it sounds like the bank and the person', 'Spotting when a case is more serious than its category'],
    controls: ['A person sends every reply', 'Vulnerable-customer cases are always routed to a person', 'Review a sample of categorisations weekly'],
    measures: ['Time to first response', 'Share of replies edited heavily', 'Repeat-complaint rate'],
  },
  {
    id: 'lib-ins-claims',
    industry: 'Insurance',
    function: 'Claims',
    title: 'Motor claim intake and triage',
    summary: 'A fictional insurer receives a motor claim, checks cover and decides how it is handled.',
    roles: ['Claims intake agent', 'Claims adjuster', 'Fraud analyst', 'Customer care'],
    steps: [
      step('Receive the claim and collect details', 'Take the claim report, photos and police report if any.', 'Claims intake agent', ['Claims system', 'Phone', 'Email'], ['High', 'M', 'Low', 'C', 'Medium', 'E', 'Medium', 'Medium'], 'Claim file', { delay: 'Photos and reports arrive days later' }),
      step('Check the policy covers the loss', 'Confirm the policy was active and the loss type is covered.', 'Claims intake agent', ['Policy system'], ['High', 'S', 'Medium', 'C', 'High', 'E', 'Medium', 'Low'], 'Coverage check'),
      step('Estimate repair cost from photos and quotes', 'Estimate the likely cost from the evidence supplied.', 'Claims adjuster', ['Claims system'], ['Medium', 'U', 'Medium', 'I', 'High', 'M', 'High', 'Low'], 'Cost estimate'),
      step('Flag possible fraud for review', 'Look for signs that need a closer look and refer them.', 'Fraud analyst', ['Claims system'], ['Medium', 'M', 'High', 'C', 'Critical', 'D', 'High', 'Low'], 'Referral decision', { exception: 'Legitimate claims that look unusual' }),
      step('Approve, adjust or decline and speak to the customer', 'Make the decision and explain it to the policyholder.', 'Claims adjuster', ['Claims system', 'Phone'], ['Low', 'M', 'High', 'C', 'Critical', 'D', 'High', 'High'], 'Claim decision'),
    ],
    commonProblems: ['Slow first contact', 'Inconsistent estimates between adjusters', 'Fraud reviews start late'],
    questionsToVerify: ['Which decisions must be made by a person under your rules?', 'How are fraud flags explained to the customer?', 'What happens to a claim when the AI’s estimate and the adjuster disagree?'],
    aiOpportunities: ['Pre-fill the claim file from messages and attachments', 'Draft a cost estimate for the adjuster to confirm', 'Highlight patterns worth a fraud analyst’s time'],
    skills: ['Challenging an AI estimate', 'Explaining a decision without blaming a tool'],
    controls: ['A person decides on every claim that is declined or flagged', 'Fraud flags are suggestions, never a decision', 'Record the AI’s proposal next to the person’s decision'],
    measures: ['Days to first contact', 'Estimate variance vs final cost', 'Share of fraud referrals confirmed'],
  },
  {
    id: 'lib-ins-renewal',
    industry: 'Insurance',
    function: 'Underwriting',
    title: 'Policy renewal review',
    summary: 'A fictional insurer reviews policies due for renewal and decides on terms and outreach.',
    roles: ['Renewals coordinator', 'Underwriter', 'Account manager'],
    steps: [
      step('List policies due for renewal', 'Pull the policies due in the next period.', 'Renewals coordinator', ['Policy system'], ['High', 'S', 'Low', 'I', 'Low', 'E', 'Low', 'Low'], 'Renewal list'),
      step('Gather claims history and changes in risk', 'Collect claims, changes and market notes for each policy.', 'Renewals coordinator', ['Policy system', 'Claims system'], ['High', 'M', 'Low', 'C', 'Medium', 'E', 'Medium', 'Low'], 'Renewal file'),
      step('Recommend renewal terms', 'Propose keep, adjust or decline with reasons.', 'Underwriter', ['Policy system'], ['Low', 'M', 'High', 'C', 'High', 'D', 'High', 'Medium'], 'Renewal recommendation'),
      step('Agree terms with key accounts', 'Talk through changes with larger clients.', 'Account manager', ['Phone', 'Email'], ['Low', 'U', 'High', 'C', 'High', 'M', 'High', 'High'], 'Agreed terms'),
      step('Send renewal notices', 'Send the standard renewal documents.', 'Renewals coordinator', ['Policy system', 'Email'], ['High', 'S', 'Low', 'C', 'Medium', 'E', 'Low', 'Low'], 'Renewal notices sent'),
    ],
    commonProblems: ['Late renewals lose customers', 'Underwriters review low-risk policies by hand', 'Notices go out with stale details'],
    questionsToVerify: ['Which changes need an underwriter by policy?', 'How are price changes explained?', 'What is the rule for declining to renew?'],
    aiOpportunities: ['Build the renewal file automatically', 'Draft recommendations for routine renewals', 'Prepare the notice for the coordinator to check'],
    skills: ['Reviewing AI-drafted recommendations against the file', 'Explaining price changes to clients'],
    controls: ['An underwriter approves every change to terms', 'Notices are checked against the policy record before sending'],
    measures: ['Renewals completed before expiry', 'Underwriter hours per renewal', 'Errors in notices'],
  },
];

export const libraryIndustries = Array.from(new Set(libraryWorkflows.map((w) => w.industry)));
export const libraryFunctionsFor = (industry: string) =>
  Array.from(new Set(libraryWorkflows.filter((w) => w.industry === industry).map((w) => w.function)));
