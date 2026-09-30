import React, { useState } from 'react';
import { Task, TaskClassification, DecisionOverride } from '@/types';
import { RecommendationBadge } from '../common/Badge';
import { DecisionTraceView } from '../common/DecisionTrace';
import { assessTask } from '@/lib/engine/decisionEngine';
import {
  CheckSquare,
  ChevronRight,
  Info,
  ShieldAlert,
  Bot,
  User,
  SlidersHorizontal,
  X,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface TaskAssessmentViewProps {
  tasks: Task[];
  decisionTrace: DecisionOverride[];
  onUpdateTasks: (updatedTasks: Task[]) => void;
  onAddDecisionTrace: (override: DecisionOverride) => void;
  onNavigate: (viewId: string) => void;
}

export const TaskAssessmentView: React.FC<TaskAssessmentViewProps> = ({
  tasks,
  decisionTrace,
  onUpdateTasks,
  onAddDecisionTrace,
  onNavigate,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [newClassification, setNewClassification] = useState<TaskClassification>('BOTH');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [overrideUser, setOverrideUser] = useState('');

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleOpenOverride = (task: Task) => {
    setSelectedTask(task);
    const currentRec = task.override ? task.override.newClassification : task.recommendation;
    setNewClassification(currentRec === 'AI' ? 'BOTH' : 'AI');
    setOverrideReason('');
    setOverrideNote('');
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !overrideReason.trim() || !overrideUser.trim()) return;

    const previousRec = selectedTask.override
      ? selectedTask.override.newClassification
      : selectedTask.recommendation;

    const newOverride: DecisionOverride = {
      id: `override-${Date.now()}`,
      taskId: selectedTask.id,
      previousRecommendation: previousRec,
      newClassification,
      user: overrideUser,
      timestamp: new Date().toISOString(),
      reason: overrideReason.trim(),
      note: overrideNote.trim() || undefined,
    };

    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id ? { ...t, override: newOverride } : t
    );

    onUpdateTasks(updatedTasks);
    onAddDecisionTrace(newOverride);
    setSelectedTask({ ...selectedTask, override: newOverride });
    setOverrideModalOpen(false);
  };

  const handleRunReassessment = (task: Task) => {
    const assessed = assessTask(task);
    const updatedTasks = tasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            recommendation: assessed.recommendation,
            confidence: assessed.confidence,
            reasons: assessed.reasons,
            riskFlags: assessed.riskFlags,
            suggestedRoleSplit: assessed.suggestedRoleSplit,
          }
        : t
    );
    onUpdateTasks(updatedTasks);
    setSelectedTask(updatedTasks.find((t) => t.id === task.id) || null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-600">
              Step 3 of 9
            </span>
            <span className="text-xs font-semibold text-navy-600">
              {tasks.length} Workflow Tasks Evaluated
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">Who should do each task</h1>
          <p className="text-xs text-navy-600">
            Classify tasks into Human (YOU), AI-led (AI), or Human+AI (BOTH) using transparent rule criteria.
          </p>
        </div>

        <button
          onClick={() => onNavigate('future-state')}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-full text-sm transition shadow-xs whitespace-nowrap"
        >
          Redesign Workflow Canvas →
        </button>
      </div>

      {/* Assessment Method Notice */}
      <div className="p-4 rounded-xl bg-gold-50 border border-gold-200 text-sm text-gold-800 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-gold-600 shrink-0 mt-0.5" />
        <span>
          <strong>How to read these verdicts:</strong> each one comes from plain rules you can inspect. It’s advice for
          you to weigh, not a decision made for you.
        </span>
      </div>

      {/* Main Table + Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Task Matrix Table */}
        <div className={selectedTask ? 'lg:col-span-7 transition-all' : 'lg:col-span-12 transition-all'}>
          <div className="bg-white rounded-xl border border-navy-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[640px]">
                <thead>
                  <tr className="bg-navy-900 text-white font-bold border-b border-navy-800">
                    <th className="py-3 px-3 w-8 text-center">#</th>
                    <th className="py-3 px-4 min-w-[160px]">Task Name</th>
                    <th className="py-3 px-3 min-w-[110px]">Current Owner</th>
                    <th className="py-3 px-3 whitespace-nowrap">Judgment</th>
                    <th className="py-3 px-3 whitespace-nowrap">Data Readiness</th>
                    <th className="py-3 px-3 whitespace-nowrap">Error Impact</th>
                    <th className="py-3 px-4 whitespace-nowrap">Recommendation</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {tasks.map((task) => {
                    const isSelected = selectedTask?.id === task.id;
                    const finalClassification = task.override
                      ? task.override.newClassification
                      : task.recommendation;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleSelectTask(task)}
                        className={`cursor-pointer transition hover:bg-navy-50 ${
                          isSelected ? 'bg-amber-50/80 border-l-4 border-gold-500' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-navy-600 font-bold">
                          {task.stepNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-navy-900">
                          <div>{task.name}</div>
                          <div className="text-[11px] text-navy-600 font-normal line-clamp-1">
                            {task.description}
                          </div>
                          {/* On a phone the Recommendation column is scrolled off, so repeat the verdict here. */}
                          <div className="mt-1.5 md:hidden">
                            <RecommendationBadge type={finalClassification} size="sm" isOverride={!!task.override} />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-navy-700 whitespace-nowrap">{task.currentOwner}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.judgmentRequired === 'High'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-navy-100 text-navy-700'
                            }`}
                          >
                            {task.judgmentRequired}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-navy-700 whitespace-nowrap">{task.dataReadiness}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.errorImpact === 'Critical' || task.errorImpact === 'High'
                                ? 'bg-red-100 text-red-900'
                                : 'bg-navy-100 text-navy-700'
                            }`}
                          >
                            {task.errorImpact}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <RecommendationBadge
                            type={finalClassification}
                            size="sm"
                            isOverride={!!task.override}
                          />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right-side Detail Drawer Panel */}
        {selectedTask && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-navy-100 shadow-md p-6 space-y-6 sticky top-20 animate-in fade-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-navy-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-navy-600">
                  Step {selectedTask.stepNumber} Details
                </span>
                <h3 className="text-lg font-bold text-navy-900 mt-0.5">{selectedTask.name}</h3>
                <p className="text-xs text-navy-700 mt-1">{selectedTask.description}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-navy-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Recommendation Display */}
            <div className="p-4 rounded-xl bg-navy-50 border border-navy-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-700 ">
                  Recommendation
                </span>
                <RecommendationBadge
                  type={
                    selectedTask.override
                      ? selectedTask.override.newClassification
                      : selectedTask.recommendation
                  }
                  size="lg"
                  isOverride={!!selectedTask.override}
                />
              </div>

              {selectedTask.override && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold">Active User Override Applied</div>
                  <div className="text-navy-700">Reason: "{selectedTask.override.reason}"</div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleOpenOverride(selectedTask)}
                  className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {selectedTask.override ? 'Update Override' : 'Override Recommendation'}
                </button>

                <button
                  onClick={() => handleRunReassessment(selectedTask)}
                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-navy-100 text-navy-700 rounded-lg text-xs font-semibold transition"
                  title="Recalculate recommendation rules"
                >
                  Re-evaluate
                </button>
              </div>
            </div>

            {/* Why? (Rationale) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-navy-700 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-600" />
                Why? (Transparent Rule Rationale)
              </h4>
              <ul className="space-y-1.5 text-xs text-navy-700 bg-navy-50 p-3 rounded-lg border border-navy-100">
                {selectedTask.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Flags */}
            {selectedTask.riskFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Identified Risk Flags
                </h4>
                <ul className="space-y-1 text-xs text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  {selectedTask.riskFlags.map((rf, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">⚠</span>
                      <span>{rf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Role Split */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-navy-900" />
                Suggested Role Split (Human + AI)
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-1.5">
                  <div className="font-bold text-blue-900 flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5" />
                    AI Execution
                  </div>
                  <ul className="space-y-1 text-blue-950 text-[11px]">
                    {selectedTask.suggestedRoleSplit.ai.map((role, i) => (
                      <li key={i}>• {role}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Human Ownership
                  </div>
                  <ul className="space-y-1 text-amber-950 text-[11px]">
                    {selectedTask.suggestedRoleSplit.human.map((role, i) => (
                      <li key={i}>• {role}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Task Trace Log */}
            <div className="pt-2">
              <DecisionTraceView trace={decisionTrace} filterTaskId={selectedTask.id} />
            </div>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {overrideModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveOverride}
            className="bg-white rounded-xl shadow-2xl border border-navy-100 w-full max-w-lg overflow-hidden animate-in fade-in duration-200"
          >
            <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Override Task Recommendation</h3>
                <p className="text-xs text-slate-300">Step {selectedTask.stepNumber}: {selectedTask.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  New Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['YOU', 'AI', 'BOTH', 'NEEDS_ASSESSMENT'] as TaskClassification[]).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setNewClassification(cls)}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-left transition ${
                        newClassification === cls
                          ? 'border-navy-900 bg-navy-900 text-white shadow-xs'
                          : 'border-navy-100 bg-navy-50 hover:bg-navy-100 text-navy-800'
                      }`}
                    >
                      {cls === 'YOU' && 'YOU (Human)'}
                      {cls === 'AI' && 'AI (Automated)'}
                      {cls === 'BOTH' && 'BOTH (Human + AI)'}
                      {cls === 'NEEDS_ASSESSMENT' && 'Needs a look'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  Why are you changing this recommendation? <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Final commentary requires operational judgment and VP signoff..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  User Authorizing Change
                </label>
                <input
                  type="text"
                  value={overrideUser}
                  required
                  placeholder="Your name"
                  onChange={(e) => setOverrideUser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  Additional Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional context note..."
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-navy-50 border-t border-navy-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-navy-700 hover:text-navy-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!overrideReason.trim()}
                className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
              >
                Save Override & Record Trace
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
