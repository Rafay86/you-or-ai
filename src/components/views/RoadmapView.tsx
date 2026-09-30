import React, { useState } from 'react';
import { WorkflowState, RoadmapItem, RoadmapStatus } from '@/types';
import { checkTaskDependencies, validateStatusTransition } from '@/lib/engine/dependencyEngine';
import { StatusBadge } from '../common/Badge';
import { Calendar, Lock, Unlock, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';

interface RoadmapViewProps {
  workflow: WorkflowState;
  onUpdateRoadmap: (updatedRoadmap: RoadmapItem[]) => void;
  onNavigate: (viewId: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  workflow,
  onUpdateRoadmap,
  onNavigate,
}) => {
  const [items, setItems] = useState<RoadmapItem[]>(workflow.roadmap);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
              Step 5 of 7
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Dependency Graph Engine
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">30/60/90-Day Implementation Roadmap</h1>
          <p className="text-xs text-slate-500">
            Prerequisites are enforced deterministically. Tasks remain 🔒 Blocked until required evidence is produced.
          </p>
        </div>

        <button
          onClick={() => onNavigate('pilot')}
          className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
        >
          Pilot Tracking Dashboard →
        </button>
      </div>

      {/* 30/60/90 Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {timeframes.map((tf) => {
          const tfItems = items.filter((i) => i.timeframe === tf.key);

          return (
            <div key={tf.key} className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200 flex flex-col space-y-4">
              {/* Column Header */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">{tf.title}</h3>
                  <span className="text-xs font-semibold text-slate-500">{tf.subtitle}</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
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
                        isBlocked ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
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

                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {item.dueDate}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{item.description}</p>

                      {/* Dependency Details */}
                      {isBlocked && depCheck.blockingReason && (
                        <div className="p-2 rounded bg-red-100/80 border border-red-200 text-[11px] text-red-950 flex items-start gap-1.5 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-700 shrink-0 mt-0.5" />
                          <span>{depCheck.blockingReason}</span>
                        </div>
                      )}

                      {/* Evidence & Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                          Owner: {item.owner}
                        </span>

                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value as RoadmapStatus)}
                          className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
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
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200"
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

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="font-bold text-slate-900">
                "{blockedAlertModal.item.title}" cannot be started until prerequisites are completed.
              </p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 font-medium">
                {blockedAlertModal.blockingReason}
              </div>

              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
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

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockedAlertModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
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
