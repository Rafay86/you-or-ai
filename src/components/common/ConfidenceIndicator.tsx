import React, { useState } from 'react';
import { ConfidenceAssessment } from '@/lib/engine/calculationEngine';
import { ShieldCheck, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ConfidenceIndicatorProps {
  assessment: ConfidenceAssessment;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ assessment }) => {
  const [expanded, setExpanded] = useState(false);

  const { level, score, checklist, missingInformation } = assessment;

  let colorClass = 'text-red-700 bg-red-50 border-red-200';
  let barColor = 'bg-red-500';
  let Icon = AlertCircle;

  if (level === 'High') {
    colorClass = 'text-emerald-800 bg-emerald-50 border-emerald-200';
    barColor = 'bg-emerald-600';
    Icon = ShieldCheck;
  } else if (level === 'Medium') {
    colorClass = 'text-amber-800 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-500';
    Icon = Info;
  }

  return (
    <div className={`rounded-lg border p-4 transition-all ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-white/80 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Confidence Rating
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                {score}% Completeness
              </span>
            </div>
            <h4 className="text-base font-bold capitalize">Confidence: {level}</h4>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 transition"
        >
          {expanded ? 'Hide details' : 'View checklist'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900">Assumptions & Data Completeness Checklist:</p>
          <ul className="space-y-1.5">
            {checklist.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span
                  className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    item.satisfied ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {item.satisfied ? '✓' : '×'}
                </span>
                <span className={item.satisfied ? 'line-through text-slate-500' : 'font-medium text-slate-800'}>
                  {item.item}
                </span>
              </li>
            ))}
          </ul>

          {missingInformation.length > 0 && (
            <div className="mt-2 p-2.5 rounded bg-white/70 border border-slate-200">
              <span className="font-bold text-amber-900">Missing Information: </span>
              <span className="text-slate-700">{missingInformation.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
