import { WorkflowState } from '@/types';
import { initialWeeklyManagementReportWorkflow } from '../data/seedData';

const STORAGE_KEY_PREFIX = 'you_ai_studio_workflow_';
const ACTIVE_WORKFLOW_KEY = 'you_ai_studio_active_id';

class LocalDatabaseRepository {
  /**
   * Retrieves active workflow ID or defaults to 'weekly-management-report'
   */
  getActiveWorkflowId(): string {
    if (typeof window === 'undefined') return 'weekly-management-report';
    try {
      return localStorage.getItem(ACTIVE_WORKFLOW_KEY) || 'weekly-management-report';
    } catch {
      return 'weekly-management-report';
    }
  }

  /**
   * Sets active workflow ID
   */
  setActiveWorkflowId(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_WORKFLOW_KEY, id);
    } catch (e) {
      console.error('Failed to set active workflow ID', e);
    }
  }

  /**
   * Loads workflow by ID. If not found in local storage, initializes from seed data.
   */
  loadWorkflow(id: string = 'weekly-management-report'): WorkflowState {
    if (typeof window === 'undefined') {
      return initialWeeklyManagementReportWorkflow;
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (raw) {
        const parsed: WorkflowState = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored workflow, falling back to seed data:', e);
    }

    // Default seed initialization
    if (id === 'weekly-management-report') {
      this.saveWorkflow(initialWeeklyManagementReportWorkflow);
      return initialWeeklyManagementReportWorkflow;
    }

    // Generic default for new workflows
    const genericWorkflow: WorkflowState = {
      ...initialWeeklyManagementReportWorkflow,
      id,
      identity: {
        ...initialWeeklyManagementReportWorkflow.identity,
        id,
        name: `New Workflow (${id})`,
      },
      isTemplateExample: false,
      lastUpdated: new Date().toISOString(),
    };
    this.saveWorkflow(genericWorkflow);
    return genericWorkflow;
  }

  /**
   * Saves updated workflow state to local persistent storage.
   */
  saveWorkflow(state: WorkflowState): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const updatedState = {
        ...state,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${state.id}`, JSON.stringify(updatedState));
      return true;
    } catch (e) {
      console.error('Failed to save workflow state:', e);
      return false;
    }
  }

  /**
   * Resets active workflow to factory seed data.
   */
  resetToSeedData(id: string = 'weekly-management-report'): WorkflowState {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      } catch (e) {
        console.error('Failed to clear storage key:', e);
      }
    }
    return this.loadWorkflow(id);
  }
}

export const db = new LocalDatabaseRepository();
