import React from 'react';
import { TaskClassification, ConfidenceLevel, MetricStatus } from '@/types';

interface RecommendationBadgeProps {
  type: TaskClassification;
  size?: 'sm' | 'md' | 'lg';
  isOverride?: boolean;
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  type,
  size = 'md',
  isOverride = false,
}) => {
  let bg = 'bg-slate-100 text-slate-800 border-slate-300';
  let label: string = type;

  switch (type) {
    case 'AI':
      bg = 'bg-blue-50 text-blue-900 border-blue-200';
      label = 'AI (Automated)';
      break;
    case 'YOU':
      bg = 'bg-amber-50 text-amber-900 border-amber-200';
      label = 'YOU (Human)';
      break;
    case 'BOTH':
      bg = 'bg-emerald-50 text-emerald-900 border-emerald-200';
      label = 'BOTH (Human + AI)';
      break;
    case 'NEEDS_ASSESSMENT':
      bg = 'bg-red-50 text-red-900 border-red-200';
      label = 'NEEDS ASSESSMENT';
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${bg} ${sizeClasses} transition-all`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          type === 'AI'
            ? 'bg-blue-600'
            : type === 'YOU'
            ? 'bg-amber-600'
            : type === 'BOTH'
            ? 'bg-emerald-600'
            : 'bg-red-600'
        }`}
      />
      {label}
      {isOverride && (
        <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 bg-gold-100 px-1 rounded">
          Override
        </span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: MetricStatus | string }> = ({ status }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status === 'Achieved' || status === 'Complete' || status === 'Approved by owner') {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (status === 'Partially achieved' || status === 'In progress' || status === 'In review') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (status === 'Not achieved' || status === 'Blocked') {
    style = 'bg-red-50 text-red-800 border-red-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
};
