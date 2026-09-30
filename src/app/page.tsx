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
import { TemplatesView } from '@/components/views/TemplatesView';
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

  const handleSelectTemplate = (id: string) => {
    db.setActiveWorkflowId(id);
    setActiveWorkflowId(id);
    const loaded = db.loadWorkflow(id);
    setWorkflow(loaded);
    setActiveView('overview');
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
    updateAndSaveWorkflow((prev) => ({ ...prev, tasks }));
  };

  const handleAddDecisionTrace = (override: DecisionOverride) => {
    updateAndSaveWorkflow((prev) => ({
      ...prev,
      decisionTrace: [override, ...prev.decisionTrace],
    }));
  };

  const handleUpdateCanvas = (canvas: WorkflowState['canvas']) => {
    updateAndSaveWorkflow((prev) => ({ ...prev, canvas }));
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
      assumptions: prev.assumptions.map((a) => (a.id === id ? { ...a, value } : a)),
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
          onSelectTemplate={handleSelectTemplate}
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

      {activeView === 'templates' && (
        <TemplatesView
          activeWorkflowId={activeWorkflowId}
          onSelectTemplate={handleSelectTemplate}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === 'settings' && (
        <SettingsView workflow={workflow} onResetData={handleResetData} />
      )}
    </AppShell>
  );
}
