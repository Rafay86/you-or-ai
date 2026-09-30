import React, { useEffect, useState } from 'react';
import { WorkflowState, RoadmapItem, RoadmapStatus } from '@/types';
import { checkTaskDependencies, validateStatusTransition } from '@/lib/engine/dependencyEngine';
import { StatusBadge } from '../common/Badge';
import { EarlyEstimateBanner } from '../common/Provenance';
import { roadmapIsStale } from '@/lib/engine/roadmapEngine';
import { Calendar, Lock, Unlock, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';

interface RoadmapViewProps {
  workflow: WorkflowState;
  onUpdateRoadmap: (updatedRoadmap: RoadmapItem[]) => void;
  onRebuildRoadmap?: () => void;
  onNavigate: (viewId: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  workflow,
  onUpdateRoadmap,
  onRebuildRoadmap,
  onNavigate,
}) => {
  const [items, setItems] = useState<RoadmapItem[]>(workflow.roadmap);
  useEffect(() => setItems(workflow.roadmap), [workflow.roadmap]);
  const [blockedAlertModal, setBlockedAlertModal] = useState<{
    item: RoadmapItem;
    blockingReason: string;
  } | null>(null);
  const [overrideInput, setOverrideInput] = useState('');

  const timeframes: { key: '0-30' | '31-60' | '61-90'; title: string; subtitle: string }[] = [
    { key: '0-30', title: '0–30 DAYS', subtitle: 'Discover + Prepare' },
    { key: '31-60', title: '31–60 DAYS', subtitle: 'Pilot + Test' },
    { key: '61-90', title: '61–90 DAYS', subtitle: 'Evaluate + Decide' },
  ];

  const handleStatusChange = (item: RoadmapItem, newStatus: RoadmapStatus) => {
    const validation = validateStatusTransition(item, newStatus, items);

    if (!validation.allowed) {
      const depCheck = checkTaskDependencies(item, items);
      setBlockedAlertModal({
        item,
        blockingReason: depCheck.blockingReason || 'Prerequisite tasks are incomplete.',
      });
      setOverrideInput('');
      return;
    }

    const updated = items.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i));
    setItems(updated);
    onUpdateRoadmap(updated);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedAlertModal || !overrideInput.trim()) return;

    const updated = items.map((i) =>
      i.id === blockedAlertModal.item.id
        ? {
            ...i,
            status: 'In progress' as const,
            overrideReason: overrideInput.trim(),
          }
        : i
    );

    setItems(updated);
    onUpdateRoadmap(updated);
    setBlockedAlertModal(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-600">
              Step 7 of 9
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">Roadmap: 30, 60, 90 days</h1>
          <p className="text-xs text-navy-600">
            A task stays blocked until the things it depends on are done.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
        {onRebuildRoadmap && (
          <button
            onClick={() => { if (window.confirm('Rebuild the roadmap from the current recommended changes? Your edits to roadmap items will be replaced.')) onRebuildRoadmap(); }}
            className="px-5 py-2.5 bg-white border border-navy-100 hover:border-navy-900 text-navy-900 font-semibold rounded-xl text-xs transition whitespace-nowrap"
          >
            Rebuild from changes
          </button>
        )}
        <button
          onClick={() => onNavigate('pilot')}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-full text-sm transition shadow-xs whitespace-nowrap"
        >
          Pilot Tracking Dashboard →
        </button>
        </div>
      </div>

      {workflow.isEarlyEstimate && <EarlyEstimateBanner onFix={() => onNavigate('current-state')} />}

      {roadmapIsStale(workflow.changePlan ?? [], workflow.roadmap) && (
        <div role="status" className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">
          Tasks or decisions have changed since this roadmap was built. Use “Rebuild from changes” so it follows the current plan.
        </div>
      )}

      {/* 30/60/90 Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {timeframes.map((tf) => {
          const tfItems = items.filter((i) => i.timeframe === tf.key);

          return (
            <div key={tf.key} className="bg-navy-100/70 rounded-2xl p-4 border border-navy-100 flex flex-col space-y-4">
              {/* Column Header */}
              <div className="bg-white p-4 rounded-xl border border-navy-100 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">{tf.title}</h3>
                  <span className="text-xs font-semibold text-navy-600">{tf.subtitle}</span>
                </div>
                <span className="text-xs font-mono font-bold bg-navy-100 px-2 py-1 rounded text-navy-700">
                  {tfItems.length} tasks
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1">
                {tfItems.map((item) => {
                  const depCheck = checkTaskDependencies(item, items);
                  const isBlocked = depCheck.isBlocked;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border bg-white transition-all space-y-3 shadow-xs ${
                        isBlocked ? 'border-red-200 bg-red-50/30' : 'border-navy-100 hover:border-slate-300'
                      }`}
                    >
                      {/* Status & Blocked Badge */}
                      <div className="flex items-center justify-between">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                            <Lock className="h-3 w-3" />
                            🔒 Blocked
                          </span>
                        ) : item.overrideReason ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Unlock className="h-3 w-3" />
                            Overridden
                          </span>
                        ) : (
                          <StatusBadge status={item.status} />
                        )}

                        <span className="text-[11px] text-navy-600 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {item.dueDate}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-navy-900 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-navy-700 line-clamp-2">{item.description}</p>

                      {/* Dependency Details */}
                      {isBlocked && depCheck.blockingReason && (
                        <div className="p-2 rounded bg-red-100/80 border border-red-200 text-[11px] text-red-950 flex items-start gap-1.5 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-700 shrink-0 mt-0.5" />
                          <span>{depCheck.blockingReason}</span>
                        </div>
                      )}

                      {/* Evidence & Controls */}
                      <div className="pt-2 border-t border-navy-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-navy-600 truncate max-w-[120px]">
                          Owner: {item.owner}
                        </span>

                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value as RoadmapStatus)}
                          className="px-2 py-1 bg-navy-50 border border-slate-300 rounded text-xs font-semibold text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
                        >
                          <option value="Not started">Not started</option>
                          <option value="In progress">In progress</option>
                          <option value="Complete">Complete</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Blocked Task Explanation Modal */}
      {blockedAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveOverride}
            className="bg-white rounded-xl shadow-2xl border border-navy-100 w-full max-w-md overflow-hidden animate-in fade-in duration-200"
          >
            <div className="px-6 py-4 bg-red-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-200" />
                <h3 className="text-sm font-bold">Task Dependency Blocked</h3>
              </div>
              <button
                type="button"
                onClick={() => setBlockedAlertModal(null)}
                className="p-1 rounded-md text-red-200 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-navy-700">
              <p className="font-bold text-navy-900">
                "{blockedAlertModal.item.title}" cannot be started until prerequisites are completed.
              </p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 font-medium">
                {blockedAlertModal.blockingReason}
              </div>

              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-navy-800">
                  Provide manual override justification to proceed:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Executive waiver granted for parallel pilot setup..."
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-navy-50 border-t border-navy-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockedAlertModal(null)}
                className="px-4 py-2 text-xs font-semibold text-navy-700 hover:text-navy-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!overrideInput.trim()}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
              >
                Authorize Override & Start
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
