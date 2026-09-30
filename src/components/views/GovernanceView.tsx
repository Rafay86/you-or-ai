import React, { useState } from 'react';
import { WorkflowState, GovernanceItem, GovernanceStatus } from '@/types';
import { StatusBadge } from '../common/Badge';
import { ShieldAlert, ShieldCheck, Lock, CheckSquare, Edit2, Save } from 'lucide-react';

interface GovernanceViewProps {
  workflow: WorkflowState;
  onUpdateGovernance: (updatedGov: GovernanceItem[]) => void;
  onNavigate: (viewId: string) => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  workflow,
  onUpdateGovernance,
  onNavigate,
}) => {
  const [govItems, setGovItems] = useState<GovernanceItem[]>(workflow.governanceItems);

  const categories: ('Data Sensitivity' | 'Human Oversight' | 'Testing Evidence' | 'Approvals')[] = [
    'Data Sensitivity',
    'Human Oversight',
    'Testing Evidence',
    'Approvals',
  ];

  const handleStatusChange = (id: string, newStatus: GovernanceStatus) => {
    const updated = govItems.map((g) => (g.id === id ? { ...g, status: newStatus } : g));
    setGovItems(updated);
    onUpdateGovernance(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
              Governance & Oversight
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Enterprise Risk & Security Controls
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Governance Workspace</h1>
          <p className="text-xs text-slate-500">
            Track data sensitivity, human oversight gates, synthetic test results, and multi-department owner signoffs.
          </p>
        </div>

        <button
          onClick={() => onNavigate('overview')}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
        >
          Return to Overview
        </button>
      </div>

      {/* Governance Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
          <span>
            <strong>Oversight Principle: </strong>
            Status is displayed as explicit "Review status" (Not assessed, In review, Evidence provided, Approved by owner). "Compliant" is never claimed without signed audit evidence.
          </span>
        </div>
      </div>

      {/* Open risks and missing prerequisites, per task */}
      {(() => {
        const plan = workflow.changePlan ?? [];
        const rows = plan
          .map((c) => ({ c, task: workflow.tasks.find((t) => t.id === c.taskId), open: c.prerequisites.filter((p) => !p.met) }))
          .filter((r) => r.task && (r.c.openRisks.length > 0 || r.open.length > 0));
        return (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <h2 className="font-display text-xl font-semibold">Open risks and missing prerequisites</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-slate-600">None recorded.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {rows.map(({ c, task, open }) => (
                  <li key={c.id}>
                    <p className="font-medium">Step {task!.stepNumber}: {task!.name}</p>
                    <ul className="list-disc pl-5 text-slate-700">
                      {open.map((p) => <li key={p.id} className="text-status-redText">Missing: {p.text}</li>)}
                      {c.openRisks.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })()}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const catItems = govItems.filter((g) => g.category === cat);

          return (
            <div key={cat} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold-600" />
                  {cat} ({catItems.length})
                </h3>
              </div>

              <div className="space-y-3">
                {catItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        {item.taskId && (() => { const t = workflow.tasks.find((x) => x.id === item.taskId); return t ? <p className="text-[11px] text-slate-500 mt-0.5">For step {t.stepNumber}: {t.name}</p> : null; })()}
                      </div>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as GovernanceStatus)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-900"
                      >
                        <option value="Not assessed">Not assessed</option>
                        <option value="In review">In review</option>
                        <option value="Evidence provided">Evidence provided</option>
                        <option value="Approved by owner">Approved by owner</option>
                      </select>
                    </div>

                    <p className="text-slate-600 text-[11px]">{item.evidence}</p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Owner: {item.owner}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
