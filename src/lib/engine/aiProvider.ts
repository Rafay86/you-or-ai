import { TaskAssessmentResult, assessTask } from './decisionEngine';
import { Task } from '@/types';

export interface AIProvider {
  name: string;
  isAvailable: boolean;
  suggestTaskAssessment(task: Partial<Task>): Promise<TaskAssessmentResult>;
  suggestWorkflowRefinement(workflowName: string, tasks: Task[]): Promise<string[]>;
}

/**
 * Fallback Rule-Based Provider that fulfills the AIProvider interface
 * entirely through transparent deterministic rules without paid APIs.
 */
export class DeterministicRuleProvider implements AIProvider {
  name = 'Deterministic Rule Engine (Built-in)';
  isAvailable = true;

  async suggestTaskAssessment(task: Partial<Task>): Promise<TaskAssessmentResult> {
    return assessTask(task);
  }

  async suggestWorkflowRefinement(_workflowName: string, tasks: Task[]): Promise<string[]> {
    const suggestions: string[] = [];
    const aiCount = tasks.filter((t) => t.recommendation === 'AI').length;
    const bothCount = tasks.filter((t) => t.recommendation === 'BOTH').length;

    if (aiCount > 0) {
      suggestions.push(`Automate data prep for ${aiCount} routine task(s) using scheduled jobs.`);
    }
    if (bothCount > 0) {
      suggestions.push(`Implement human-in-the-loop exception queues for ${bothCount} hybrid task(s).`);
    }
    suggestions.push('Standardize operational input schemas across department leads.');
    return suggestions;
  }
}

export const defaultAIProvider: AIProvider = new DeterministicRuleProvider();
