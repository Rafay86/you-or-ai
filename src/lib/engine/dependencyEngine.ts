import { RoadmapItem } from '@/types';

export interface DependencyCheckResult {
  isBlocked: boolean;
  unmetDependencies: { id: string; title: string; currentStatus: string }[];
  blockingReason: string | null;
}

/**
 * Checks whether a roadmap task is blocked by unfinished prerequisite tasks.
 */
export function checkTaskDependencies(
  item: RoadmapItem,
  allItems: RoadmapItem[]
): DependencyCheckResult {
  // If the task has no dependencies or has a manual override reason, evaluate accordingly
  if (!item.dependencyIds || item.dependencyIds.length === 0) {
    return { isBlocked: false, unmetDependencies: [], blockingReason: null };
  }

  const unmetDependencies = item.dependencyIds
    .map((depId) => allItems.find((i) => i.id === depId))
    .filter((dep): dep is RoadmapItem => dep !== undefined && dep.status !== 'Complete')
    .map((dep) => ({
      id: dep.id,
      title: dep.title,
      currentStatus: dep.status,
    }));

  if (unmetDependencies.length === 0) {
    return { isBlocked: false, unmetDependencies: [], blockingReason: null };
  }

  // If user has provided a manual override reason, unblock but keep record
  if (item.overrideReason && item.overrideReason.trim().length > 0) {
    return {
      isBlocked: false,
      unmetDependencies,
      blockingReason: null,
    };
  }

  const firstUnmet = unmetDependencies[0];
  const blockingReason = `Complete "${firstUnmet.title}" first. (${unmetDependencies.length} pending prerequisite${unmetDependencies.length > 1 ? 's' : ''})`;

  return {
    isBlocked: true,
    unmetDependencies,
    blockingReason,
  };
}

/**
 * Validates status transition for a roadmap item.
 * Returns { allowed: boolean, reason?: string }.
 */
export function validateStatusTransition(
  targetItem: RoadmapItem,
  newStatus: RoadmapItem['status'],
  allItems: RoadmapItem[]
): { allowed: boolean; reason?: string } {
  if (newStatus === 'Not started') {
    return { allowed: true };
  }

  const check = checkTaskDependencies(targetItem, allItems);
  if (check.isBlocked) {
    return {
      allowed: false,
      reason: check.blockingReason || 'Prerequisite tasks are incomplete.',
    };
  }

  return { allowed: true };
}
