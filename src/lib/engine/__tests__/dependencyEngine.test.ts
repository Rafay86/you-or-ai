import { describe, it, expect } from 'vitest';
import { checkTaskDependencies, validateStatusTransition } from '../dependencyEngine';
import { RoadmapItem } from '@/types';

describe('Dependency Engine', () => {
  const items: RoadmapItem[] = [
    {
      id: 'task-a',
      timeframe: '0-30',
      title: 'Prerequisite Task A',
      description: '',
      owner: 'Alice',
      dueDate: '2026-10-01',
      status: 'Not started',
      dependencyIds: [],
      evidenceRequired: '',
    },
    {
      id: 'task-b',
      timeframe: '31-60',
      title: 'Dependent Task B',
      description: '',
      owner: 'Bob',
      dueDate: '2026-11-01',
      status: 'Not started',
      dependencyIds: ['task-a'],
      evidenceRequired: '',
    },
  ];

  it('detects blocked task when prerequisite is incomplete', () => {
    const check = checkTaskDependencies(items[1], items);
    expect(check.isBlocked).toBe(true);
    expect(check.blockingReason).toContain('Prerequisite Task A');
  });

  it('unblocks task when prerequisite is marked Complete', () => {
    const updatedItems = items.map((i) => (i.id === 'task-a' ? { ...i, status: 'Complete' as const } : i));
    const check = checkTaskDependencies(updatedItems[1], updatedItems);
    expect(check.isBlocked).toBe(false);
  });

  it('prevents invalid status transition if blocked', () => {
    const res = validateStatusTransition(items[1], 'In progress', items);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Prerequisite Task A');
  });

  it('allows manual override for blocked task with recorded reason', () => {
    const overriddenTask: RoadmapItem = {
      ...items[1],
      overrideReason: 'Executive approval granted to start prototype in parallel.',
    };
    const check = checkTaskDependencies(overriddenTask, items);
    expect(check.isBlocked).toBe(false);
  });
});
