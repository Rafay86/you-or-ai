import { ChangeItem, RoadmapItem, Task, WorkflowIdentity } from '@/types';

/**
 * Builds a 30/60/90-day roadmap from the change plan. Actions follow the recommended changes,
 * and anything with an unmet prerequisite depends on the item that resolves it, so it shows as blocked.
 */
export function generateRoadmap(
  changes: ChangeItem[],
  tasks: Task[],
  identity: Pick<WorkflowIdentity, 'owner'>
): RoadmapItem[] {
  const owner = identity.owner;
  const taskName = (id: string) => tasks.find((t) => t.id === id)?.name ?? id;
  const items: RoadmapItem[] = [];
  const add = (i: Omit<RoadmapItem, 'status' | 'dueDate' | 'dependencyIds'> & { dependencyIds?: string[]; dueDay: number }) => {
    const { dueDay, ...rest } = i;
    items.push({ status: 'Not started', dueDate: `Day ${dueDay}`, dependencyIds: [], ...rest });
  };

  add({
    id: 'rm-baseline',
    timeframe: '0-30',
    title: 'Confirm scope and record the baseline',
    description: 'Agree which tasks are in scope and measure how long the work takes today, so the pilot has something to beat.',
    owner,
    evidenceRequired: 'Baseline time, error rate and cycle time written down and agreed.',
    dueDay: 10,
  });

  const needsPolicy = changes.some((c) => c.controls.some((k) => k.area === 'Privacy' || k.area === 'Security'));
  if (needsPolicy) {
    add({
      id: 'rm-policy',
      timeframe: '0-30',
      title: 'Check data and security policy for the in-scope tasks',
      description: 'Confirm with security or compliance which data may be given to an AI tool, using your own policies.',
      owner: 'Security / Compliance lead',
      evidenceRequired: 'Written answer per data type.',
      dueDay: 21,
    });
  }

  const buildIds: string[] = [];
  for (const c of changes) {
    const name = taskName(c.taskId);
    const prereqIds: string[] = [];
    c.prerequisites
      .filter((p) => !p.met)
      .forEach((p) => {
        const id = `rm-pre-${p.id}`;
        prereqIds.push(id);
        add({
          id,
          timeframe: '0-30',
          title: `Prerequisite: ${p.text}`,
          description: `Needed before "${name}" can change.`,
          owner: c.technicalOwner === 'To be assigned' ? owner : c.technicalOwner,
          evidenceRequired: 'Confirmed in writing by the owner.',
          dueDay: 28,
        });
      });

    const isAssessment = c.summary.startsWith('Not enough is known');
    if (isAssessment) continue;

    const buildId = `rm-build-${c.taskId}`;
    buildIds.push(buildId);
    add({
      id: buildId,
      timeframe: '31-60',
      title: `Set up: ${name}`,
      description: c.summary,
      owner: c.technicalOwner === 'To be assigned' ? 'Technical owner (to assign)' : c.technicalOwner,
      dependencyIds: [...prereqIds, ...(needsPolicy && c.controls.some((k) => k.area === 'Privacy' || k.area === 'Security') ? ['rm-policy'] : [])],
      evidenceRequired: 'Working set-up demonstrated on a past cycle.',
      dueDay: 50,
    });
    add({
      id: `rm-train-${c.taskId}`,
      timeframe: '31-60',
      title: `Train ${c.rolesAffected.join(' and ')} for "${name}"`,
      description: c.trainingActions.join(' '),
      owner,
      dependencyIds: [buildId],
      evidenceRequired: 'Attendance and a short check that people can spot a bad output.',
      dueDay: 55,
    });
    add({
      id: `rm-test-${c.taskId}`,
      timeframe: '31-60',
      title: `Test: ${name}`,
      description: `${c.testingRequired} Approval: ${c.approvalRequired}`,
      owner,
      dependencyIds: [buildId],
      evidenceRequired: 'Test results and the named approver’s sign-off.',
      dueDay: 60,
    });
  }

  const testIds = changes.filter((c) => !c.summary.startsWith('Not enough is known')).map((c) => `rm-test-${c.taskId}`);
  add({
    id: 'rm-pilot',
    timeframe: '61-90',
    title: 'Run the pilot on the in-scope tasks',
    description: 'Run for enough cycles to see real variation. Record actual results against the baseline.',
    owner,
    dependencyIds: ['rm-baseline', ...testIds],
    evidenceRequired: 'Actual time, quality, adoption and error figures for every cycle.',
    dueDay: 80,
  });
  add({
    id: 'rm-decide',
    timeframe: '61-90',
    title: 'Decide: expand, improve and retest, or stop',
    description: 'Compare pilot results with the targets and decide with the sponsor.',
    owner,
    dependencyIds: ['rm-pilot'],
    evidenceRequired: 'Recorded decision with the evidence behind it.',
    dueDay: 90,
  });

  return items;
}

/** True when the roadmap no longer matches the recommended changes (a task was added, removed or reclassified). */
export function roadmapIsStale(changes: ChangeItem[], roadmap: RoadmapItem[]): boolean {
  const wanted = new Set(changes.filter((c) => !c.summary.startsWith('Not enough is known')).map((c) => `rm-build-${c.taskId}`));
  const have = new Set(roadmap.filter((r) => r.id.startsWith('rm-build-')).map((r) => r.id));
  if (wanted.size !== have.size) return true;
  return Array.from(wanted).some((id) => !have.has(id));
}
