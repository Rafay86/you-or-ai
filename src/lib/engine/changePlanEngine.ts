import { ChangeItem, ControlArea, Task, WorkflowIdentity } from '@/types';
import { effectiveClassification } from './effective';

type Control = { area: ControlArea; text: string };

/**
 * Derives the people, skills and controls plan from the task decisions.
 * Every row is tied to one task; every skill and control exists because of a specific attribute of that task.
 * Deterministic and policy-neutral: these are prompts to check against the organisation's own policies,
 * not statements of regulatory compliance.
 */
export function generateChangePlan(tasks: Task[], identity: Pick<WorkflowIdentity, 'owner' | 'people'>): ChangeItem[] {
  const items: ChangeItem[] = [];

  for (const task of tasks) {
    const cls = effectiveClassification(task);
    if (cls === 'YOU') continue;

    const reviewer = identity.people?.reviewers?.[0] || task.currentOwner;
    const highStakes = task.errorImpact === 'High' || task.errorImpact === 'Critical';
    const sensitive = task.sensitivity === 'Confidential' || task.sensitivity === 'Strictly Restricted';

    if (cls === 'NEEDS_ASSESSMENT') {
      items.push({
        id: `change-${task.id}`,
        taskId: task.id,
        summary: `Not enough is known about "${task.name}" to plan a change.`,
        rolesAffected: [task.currentOwner],
        skillsNeeded: [],
        trainingActions: [],
        newResponsibilities: [`${task.currentOwner} supplies the missing details`],
        businessOwner: identity.owner,
        technicalOwner: 'To be assigned',
        controls: [],
        testingRequired: 'Not applicable until the task is assessed.',
        approvalRequired: 'Business owner confirms the task description.',
        openRisks: task.openQuestions?.length ? task.openQuestions : ['Essential information is missing.'],
        prerequisites: [{ id: `${task.id}-info`, text: 'Complete the missing details for this task', met: false }],
      });
      continue;
    }

    const skills: string[] = [];
    const training: string[] = [];
    const controls: Control[] = [];
    const prerequisites: ChangeItem['prerequisites'] = [];

    if (cls === 'BOTH') {
      skills.push('Checking AI output critically instead of trusting it');
      training.push(`Walk ${task.currentOwner} through 5 real examples where the AI output is subtly wrong`);
    } else {
      skills.push('Monitoring automated runs and handling exceptions');
      training.push(`Show ${reviewer} how to read the exception queue and when to stop a run`);
    }
    if (task.judgmentRequired === 'High') {
      skills.push('Giving the AI the context it needs to draft well');
      training.push('Agree what context and past examples the AI is given each cycle');
    }
    if (task.dataReadiness === 'Unstructured' || task.dataReadiness === 'Semi-structured') {
      skills.push('Preparing and standardising source data');
    }
    if (sensitive) {
      skills.push('Handling confidential data in AI-assisted tools');
      training.push('Brief the team on which data may and may not be given to the tool');
    }

    controls.push({ area: 'Quality', text: 'Track accuracy against today’s baseline through the pilot.' });
    if (task.dataReadiness !== 'Structured') {
      controls.push({ area: 'Data', text: 'Validate the input format before the AI processes it; reject anything malformed.' });
    }
    if (sensitive) {
      controls.push({ area: 'Privacy', text: 'Keep this data inside approved environments. Confirm your own data-handling policy allows AI processing.' });
    }
    if (task.sensitivity === 'Strictly Restricted') {
      controls.push({ area: 'Security', text: 'Restrict access to named people and keep an access log.' });
    }
    if (highStakes) {
      controls.push({ area: 'Quality', text: `A named person approves the output before it leaves the team${task.errorImpact === 'Critical' ? '; no unattended release' : ''}.` });
      controls.push({ area: 'Operational', text: 'Keep the manual process ready as a fallback.' });
    }
    if (task.outputCheckability === 'Difficult') {
      controls.push({ area: 'Quality', text: 'Output is hard to check, so review a sample every cycle.' });
    }
    if (task.exceptionRate === 'High') {
      controls.push({ area: 'Operational', text: `Route exceptions to ${reviewer}; define what counts as an exception before launch.` });
    }

    if (task.dataReadiness !== 'Structured') {
      prerequisites.push({ id: `${task.id}-data`, text: `Source data for "${task.name}" is available in a consistent, machine-readable form`, met: false });
    }
    if (!task.systems || task.systems.length === 0) {
      prerequisites.push({ id: `${task.id}-access`, text: `Confirm which systems "${task.name}" touches and that the AI can be given access`, met: false });
    }
    if (sensitive) {
      prerequisites.push({ id: `${task.id}-policy`, text: 'Your policy confirms AI processing of this data is allowed', met: false });
    }

    const risks = [...(task.riskFlags || []), ...(task.openQuestions || [])];
    if (task.confidence === 'Low') risks.push('The recommendation has low confidence; verify the task details.');

    items.push({
      id: `change-${task.id}`,
      taskId: task.id,
      summary:
        cls === 'AI'
          ? `AI performs "${task.name}" within defined limits. Exceptions go to ${reviewer}.`
          : `AI assists with "${task.name}". ${task.currentOwner} verifies and stays accountable.`,
      rolesAffected: Array.from(new Set([task.currentOwner, reviewer])),
      skillsNeeded: skills,
      trainingActions: training,
      newResponsibilities:
        cls === 'AI'
          ? [`${reviewer} reviews exceptions and a periodic quality sample`]
          : [`${task.currentOwner} verifies AI output before it moves on and owns the final call`],
      businessOwner: identity.owner,
      technicalOwner: 'To be assigned',
      controls,
      testingRequired: highStakes
        ? 'Run alongside the manual process for at least 4 cycles and compare outputs before switching over.'
        : 'Test on 2 past cycles, then spot-check the first live runs.',
      approvalRequired:
        highStakes || sensitive
          ? 'Business owner plus security or compliance sign-off.'
          : 'Business owner sign-off.',
      openRisks: risks,
      prerequisites,
    });
  }

  return items;
}

/**
 * Rebuilds the plan after tasks change, keeping what people already filled in:
 * named owners and prerequisites they have marked as met.
 */
export function refreshChangePlan(prev: ChangeItem[] | undefined, tasks: Task[], identity: Pick<WorkflowIdentity, 'owner' | 'people'>): ChangeItem[] {
  const fresh = generateChangePlan(tasks, identity);
  return fresh.map((item) => {
    const old = prev?.find((p) => p.taskId === item.taskId);
    if (!old) return item;
    return {
      ...item,
      businessOwner: old.businessOwner || item.businessOwner,
      technicalOwner: old.technicalOwner || item.technicalOwner,
      prerequisites: item.prerequisites.map((pr) => ({ ...pr, met: old.prerequisites.find((o) => o.id === pr.id)?.met ?? pr.met })),
    };
  });
}
