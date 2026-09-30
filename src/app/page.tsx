'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowState, WorkflowIdentity, Task, DecisionOverride, Scenario, BusinessCaseAssumption, RoadmapItem, PilotMetric, GovernanceItem, FinalDecisionState } from '@/types';
import { db } from '@/lib/storage/db';
import { AppShell } from '@/components/layout/AppShell';

import { OverviewView } from '@/components/views/OverviewView';
import { DiscoverView } from '@/components/views/DiscoverView';
import { TaskAssessmentView } from '@/components/views/TaskAssessmentView';
import { FutureStateView } from '@/components/views/FutureStateView';
import { ScenarioComparisonView } from '@/components/views/ScenarioComparisonView';
import { BusinessCaseView } from '@/components/views/BusinessCaseView';
import { RoadmapView } from '@/components/views/RoadmapView';
import { PilotView } from '@/components/views/PilotView';
import { FinalDecisionView } from '@/components/views/FinalDecisionView';
import { ExecutiveView } from '@/components/views/ExecutiveView';
import { GovernanceView } from '@/components/views/GovernanceView';
import { StartView } from '@/components/views/StartView';
import { CurrentStateView } from '@/components/views/CurrentStateView';
import { PeopleControlsView } from '@/components/views/PeopleControlsView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { refreshChangePlan } from '@/lib/engine/changePlanEngine';
import { generateRoadmap } from '@/lib/engine/roadmapEngine';
import { buildCanvas } from '@/lib/engine/workflowBuilder';
import { ChangeItem } from '@/types';
import { SettingsView } from '@/components/views/SettingsView';

export default function StudioApp() {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('weekly-management-report');
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [activeView, setActiveView] = useState<string>('overview');

  // Load active workflow on client mount
  useEffect(() => {
    const id = db.getActiveWorkflowId();
    setActiveWorkflowId(id);
    const loaded = db.loadWorkflow(id);
    setWorkflow(loaded);
  }, []);

  if (!workflow) {
    return (
      <div className="min-h-screen bg-warmwhite text-navy-900 flex items-center justify-center font-sans">
        <p className="font-display text-lg text-navy-700">Opening your workspace…</p>
      </div>
    );
  }

  const updateAndSaveWorkflow = (updater: (prev: WorkflowState) => WorkflowState) => {
    setWorkflow((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      db.saveWorkflow(updated);
      return updated;
    });
  };

  const handleNavigate = (viewId: string) => {
    setActiveView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetData = () => {
    const reset = db.resetToSeedData(activeWorkflowId);
    setWorkflow(reset);
    setActiveView('overview');
  };

  // State update handlers
  const handleSaveIdentity = (identity: WorkflowIdentity) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, identity }));
  };

  const handleUpdateTasks = (tasks: Task[]) => {
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      tasks,
      changePlan: refreshChangePlan(prev.changePlan, tasks, prev.identity),
      // The redesign follows the decisions until someone edits it by hand.
      canvas: prev.canvasEdited ? prev.canvas : buildCanvas(tasks),
    }));
  };

  const handleCreateProject = (w: WorkflowState) => {
    db.createProject(w);
    setActiveWorkflowId(w.id);
    setWorkflow(w);
    setActiveView(w.startMode === 'example' ? 'overview' : 'current-state');
    window.scrollTo({ top: 0 });
  };

  const handleOpenProject = (id: string) => {
    db.setActiveWorkflowId(id);
    setActiveWorkflowId(id);
    setWorkflow(db.loadWorkflow(id));
    setActiveView('overview');
  };

  const handleDeleteProject = (id: string) => {
    db.deleteProject(id);
    if (id === activeWorkflowId) handleOpenProject('weekly-management-report');
  };

  const handleRestoreVersion = (versionId: string) => {
    const restored = db.restoreVersion(activeWorkflowId, versionId);
    if (restored) setWorkflow(restored);
  };

  /** Marking a prerequisite as met also completes the roadmap action that was waiting on it. */
  const handleUpdateChangePlan = (changePlan: ChangeItem[]) => {
    updateAndSaveWorkflow((prev) => {
      const done = new Map<string, boolean>();
      changePlan.forEach((c) => c.prerequisites.forEach((p) => done.set(`rm-pre-${p.id}`, p.met)));
      const roadmap = prev.roadmap.map((r) => {
        const met = done.get(r.id);
        if (met === undefined) return r;
        if (met) return { ...r, status: 'Complete' as const };
        return r.status === 'Complete' ? { ...r, status: 'Not started' as const } : r;
      });
      return { ...prev, changePlan, roadmap };
    });
  };

  const handleRebuildRoadmap = () => {
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      roadmap: generateRoadmap(prev.changePlan ?? [], prev.tasks, prev.identity),
    }));
  };

  const handleAddDecisionTrace = (override: DecisionOverride) => {
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      decisionTrace: [override, ...prev.decisionTrace],
    }));
  };

  const handleUpdateCanvas = (canvas: WorkflowState['canvas']) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, canvas, canvasEdited: true }));
  };

  const handleRebuildCanvas = () => {
    updateAndSaveWorkflow((prev) => ({ ...prev, canvas: buildCanvas(prev.tasks), canvasEdited: false }));
  };

  const handleSelectScenario = (scenarioId: 'scenario-a' | 'scenario-b') => {
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      scenarios: prev.scenarios.map((s) => ({
        ...s,
        isSelected: s.id === scenarioId,
      })),
    }));
  };

  const handleUpdateAssumption = (id: string, value: number) => {
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      assumptions: prev.assumptions.map((a) => (a.id === id ? { ...a, value, provenance: 'user' as const } : a)),
    }));
  };

  const handleResetAssumptions = () => {
    const defaultWorkflow = db.resetToSeedData(activeWorkflowId);
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      assumptions: defaultWorkflow.assumptions,
    }));
  };

  const handleUpdateRoadmap = (roadmap: RoadmapItem[]) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, roadmap }));
  };

  const handleUpdatePilotMetrics = (pilotMetrics: PilotMetric[]) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, pilotMetrics }));
  };

  const handleUpdateGovernance = (governanceItems: GovernanceItem[]) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, governanceItems }));
  };

  const handleUpdateFinalDecision = (finalDecision: FinalDecisionState) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, finalDecision }));
  };

  return (
    <AppShell
      workflow={workflow}
      activeView={activeView}
      onNavigate={handleNavigate}
      onReset={handleResetData}
    >
      {activeView === 'overview' && (
        <OverviewView
          workflow={workflow}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'discover' && (
        <DiscoverView
          workflow={workflow}
          onSaveIdentity={handleSaveIdentity}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'tasks' && (
        <TaskAssessmentView
          tasks={workflow.tasks}
          decisionTrace={workflow.decisionTrace}
          onUpdateTasks={handleUpdateTasks}
          onAddDecisionTrace={handleAddDecisionTrace}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'future-state' && (
        <FutureStateView
          workflow={workflow}
          onUpdateCanvas={handleUpdateCanvas}
          onRebuildCanvas={handleRebuildCanvas}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'scenario-comparison' && (
        <ScenarioComparisonView
          workflow={workflow}
          onSelectScenario={handleSelectScenario}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'business-case' && (
        <BusinessCaseView
          workflow={workflow}
          onUpdateAssumption={handleUpdateAssumption}
          onResetAssumptions={handleResetAssumptions}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'roadmap' && (
        <RoadmapView
          workflow={workflow}
          onUpdateRoadmap={handleUpdateRoadmap}
          onRebuildRoadmap={handleRebuildRoadmap}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'pilot' && (
        <PilotView
          workflow={workflow}
          onUpdatePilotMetrics={handleUpdatePilotMetrics}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'decision' && (
        <FinalDecisionView
          workflow={workflow}
          onUpdateFinalDecision={handleUpdateFinalDecision}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'executive' && (
        <ExecutiveView workflow={workflow} onNavigate={handleNavigate} />
      )}

      {activeView === 'governance' && (
        <GovernanceView
          workflow={workflow}
          onUpdateGovernance={handleUpdateGovernance}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'start' && <StartView onCreate={handleCreateProject} onNavigate={handleNavigate} />}
      {activeView === 'templates' && <StartView key="library" initialMode="library" onCreate={handleCreateProject} onNavigate={handleNavigate} />}

      {activeView === 'current-state' && (
        <CurrentStateView workflow={workflow} onUpdateTasks={handleUpdateTasks} onNavigate={handleNavigate} />
      )}

      {activeView === 'people' && (
        <PeopleControlsView workflow={workflow} onUpdateChangePlan={handleUpdateChangePlan} onNavigate={handleNavigate} />
      )}

      {activeView === 'projects' && (
        <ProjectsView workflow={workflow} onOpen={handleOpenProject} onDelete={handleDeleteProject} onRestore={handleRestoreVersion} onNavigate={handleNavigate} />
      )}

      {activeView === 'settings' && (
        <SettingsView workflow={workflow} onResetData={handleResetData} />
      )}
    </AppShell>
  );
}
