import React from 'react';
import { DecisionOverride } from '@/types';
import { RecommendationBadge } from './Badge';
import { History, UserCheck, Clock } from 'lucide-react';

interface DecisionTraceProps {
  trace: DecisionOverride[];
  filterTaskId?: string;
}

export const DecisionTraceView: React.FC<DecisionTraceProps> = ({ trace, filterTaskId }) => {
  const items = filterTaskId ? trace.filter((t) => t.taskId === filterTaskId) : trace;

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500 bg-slate-50">
        No manual overrides recorded. Recommendations are based on initial rule engine evaluation.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <History className="h-4 w-4 text-gold-600" />
        Immutable Decision Trace Log ({items.length})
      </div>

      <div className="space-y-2">
        {items.map((entry) => (
          <div
            key={entry.id}
            className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 text-xs text-slate-800 space-y-2 transition shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <UserCheck className="h-3.5 w-3.5 text-amber-700" />
                <span>{entry.user}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="h-3 w-3" />
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-500">Changed:</span>
              <RecommendationBadge type={entry.previousRecommendation} size="sm" />
              <span className="text-slate-400 font-bold">→</span>
              <RecommendationBadge type={entry.newClassification} size="sm" isOverride />
            </div>

            <div className="pt-1 text-slate-700">
              <span className="font-semibold text-slate-900">Reason: </span>
              {entry.reason}
            </div>

            {entry.note && (
              <div className="p-2 rounded bg-white border border-amber-200 text-slate-600 italic">
                "{entry.note}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
