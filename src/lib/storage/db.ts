import { WorkflowState } from '@/types';
import { initialWeeklyManagementReportWorkflow } from '../data/seedData';
import { migrateWorkflow } from './migrate';

const STORAGE_KEY_PREFIX = 'you_ai_studio_workflow_';
const VERSIONS_KEY_PREFIX = 'you_ai_studio_versions_';
const INDEX_KEY = 'you_ai_studio_index';
const ACTIVE_WORKFLOW_KEY = 'you_ai_studio_active_id';
const SEED_ID = 'weekly-management-report';
const MAX_VERSIONS = 20;

export interface ProjectSummary {
  id: string;
  name: string;
  startMode?: string;
  isEarlyEstimate?: boolean;
  updatedAt: string;
}

export interface VersionEntry {
  versionId: string;
  label: string;
  savedAt: string;
  state: WorkflowState;
}

const canUseStorage = () => typeof window !== 'undefined';

function read<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    console.warn(`Could not read "${key}" from local storage`, e);
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  if (!canUseStorage()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Could not write "${key}" to local storage`, e);
    return false;
  }
}

class LocalDatabaseRepository {
  getActiveWorkflowId(): string {
    if (!canUseStorage()) return SEED_ID;
    try {
      return localStorage.getItem(ACTIVE_WORKFLOW_KEY) || SEED_ID;
    } catch {
      return SEED_ID;
    }
  }

  setActiveWorkflowId(id: string): void {
    if (!canUseStorage()) return;
    try {
      localStorage.setItem(ACTIVE_WORKFLOW_KEY, id);
    } catch (e) {
      console.error('Failed to set active workflow ID', e);
    }
  }

  /** Loads a workspace, migrating old saves. Unknown ids fall back to the example. */
  loadWorkflow(id: string = SEED_ID): WorkflowState {
    if (!canUseStorage()) return migrateWorkflow(initialWeeklyManagementReportWorkflow);

    const stored = read<WorkflowState>(`${STORAGE_KEY_PREFIX}${id}`);
    if (stored) {
      try {
        return migrateWorkflow(stored);
      } catch (e) {
        console.warn('Stored workspace could not be migrated; falling back to the example.', e);
      }
    }

    const seeded = migrateWorkflow(initialWeeklyManagementReportWorkflow);
    this.saveWorkflow(seeded);
    return seeded;
  }

  saveWorkflow(state: WorkflowState): boolean {
    const updated = { ...state, lastUpdated: new Date().toISOString() };
    const ok = write(`${STORAGE_KEY_PREFIX}${state.id}`, updated);
    if (ok) this.touchIndex(updated);
    return ok;
  }

  /** Adds a brand-new project (Quick Start, upload or library) and makes it active. */
  createProject(state: WorkflowState): WorkflowState {
    this.saveWorkflow(state);
    this.setActiveWorkflowId(state.id);
    return state;
  }

  listProjects(): ProjectSummary[] {
    const idx = read<ProjectSummary[]>(INDEX_KEY) ?? [];
    const hasSeed = idx.some((p) => p.id === SEED_ID);
    const list = hasSeed
      ? idx
      : [
          ...idx,
          {
            id: SEED_ID,
            name: initialWeeklyManagementReportWorkflow.identity.name,
            startMode: 'example',
            updatedAt: initialWeeklyManagementReportWorkflow.lastUpdated,
          },
        ];
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  deleteProject(id: string): void {
    if (!canUseStorage()) return;
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      localStorage.removeItem(`${VERSIONS_KEY_PREFIX}${id}`);
      write(INDEX_KEY, (read<ProjectSummary[]>(INDEX_KEY) ?? []).filter((p) => p.id !== id));
      if (this.getActiveWorkflowId() === id) this.setActiveWorkflowId(SEED_ID);
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  }

  // ---- Versions: named snapshots the user can go back to ----

  listVersions(id: string): VersionEntry[] {
    return read<VersionEntry[]>(`${VERSIONS_KEY_PREFIX}${id}`) ?? [];
  }

  saveVersion(state: WorkflowState, label: string): VersionEntry | null {
    const entry: VersionEntry = {
      versionId: `v-${Date.now()}`,
      label: label.trim() || 'Untitled version',
      savedAt: new Date().toISOString(),
      state,
    };
    const next = [entry, ...this.listVersions(state.id)].slice(0, MAX_VERSIONS);
    return write(`${VERSIONS_KEY_PREFIX}${state.id}`, next) ? entry : null;
  }

  restoreVersion(id: string, versionId: string): WorkflowState | null {
    const found = this.listVersions(id).find((v) => v.versionId === versionId);
    if (!found) return null;
    const restored = migrateWorkflow(found.state);
    this.saveWorkflow(restored);
    return restored;
  }

  /** Resets a workspace to its starting data. Only the built-in example has a fixed start. */
  resetToSeedData(id: string = SEED_ID): WorkflowState {
    if (id !== SEED_ID) return this.loadWorkflow(id);
    if (canUseStorage()) {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      } catch (e) {
        console.error('Failed to clear storage key:', e);
      }
    }
    return this.loadWorkflow(id);
  }

  private touchIndex(state: WorkflowState) {
    const idx = read<ProjectSummary[]>(INDEX_KEY) ?? [];
    const entry: ProjectSummary = {
      id: state.id,
      name: state.identity.name,
      startMode: state.startMode,
      isEarlyEstimate: state.isEarlyEstimate,
      updatedAt: state.lastUpdated,
    };
    write(INDEX_KEY, [entry, ...idx.filter((p) => p.id !== state.id)]);
  }
}

export const db = new LocalDatabaseRepository();
