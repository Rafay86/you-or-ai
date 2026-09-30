import { Task, TaskClassification } from '@/types';

/** The classification that counts: a recorded human override wins over the rule engine. */
export function effectiveClassification(task: Task): TaskClassification {
  return task.override ? task.override.newClassification : task.recommendation;
}
