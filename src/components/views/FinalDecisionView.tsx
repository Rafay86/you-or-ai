import React, { useState } from 'react';
import { WorkflowState, FinalDecisionOutcome, FinalDecisionState } from '@/types';
import { generateFinalDecisionRecommendation } from '@/lib/engine/finalDecisionEngine';
import { Award, ShieldAlert, CheckCircle2, AlertTriangle, FileQuestion, ArrowRight, UserCheck } from 'lucide-react';

interface FinalDecisionViewProps {
  workflow: WorkflowState;
  onUpdateFinalDecision: (updatedDecision: FinalDecisionState) => void;
  onNavigate: (viewId: string) => void;
}

export const FinalDecisionView: React.FC<FinalDecisionViewProps> = ({
  workflow,
  onUpdateFinalDecision,
  onNavigate,
}) => {
  const assessment = generateFinalDecisionRecommendation(workflow.pilotMetrics, workflow.governanceItems);

  const [decisionState, setDecisionState] = useState<FinalDecisionState>(workflow.finalDecision);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideOutcome, setOverrideOutcome] = useState<FinalDecisionOutcome>(decisionState.selectedOutcome);
  const [overrideReason, setOverrideReason] = useState('');
  const [decidedBy, setDecidedBy] = useState(decisionState.decidedBy || 'Elena Rostova (COO)');

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;

    const updated: FinalDecisionState = {
      ...decisionState,
      selectedOutcome: overrideOutcome,
      overrideReason: overrideReason.trim(),
      decidedBy: decidedBy.trim(),
      decidedAt: new Date().toISOString(),
    };

    setDecisionState(updated);
    onUpdateFinalDecision(updated);
    setOverrideModalOpen(false);
  };

  const outcomeColors: Record<FinalDecisionOutcome, string> = {
    EXPAND: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    IMPROVE_AND_RETEST: 'bg-amber-50 text-amber-900 border-amber-300',
    STOP: 'bg-red-50 text-red-900 border-red-300',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
              Step 7 of 7
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Evidence-Based Executive Gate
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Final Executive Decision</h1>
          <p className="text-xs text-slate-500">
            Synthesize pilot empirical evidence, open risks, and governance compliance before C-suite authorization.
          </p>
        </div>

        <button
          onClick={() => onNavigate('executive')}
          className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
        >
          View Executive Summary →
        </button>
      </div>

      {/* Decision Banner Card */}
      <div className="bg-navy-900 text-white rounded-2xl p-8 border border-navy-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gold-400 ">
            <Award className="h-5 w-5" />
            Automated Evidence Recommendation: {assessment.recommendedOutcome}
          </div>

          <button
            onClick={() => {
              setOverrideOutcome(decisionState.selectedOutcome);
              setOverrideReason('');
              setOverrideModalOpen(true);
            }}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded-lg transition"
          >
            Override Decision Outcome
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-navy-800">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Authorized Outcome</span>
            <div className="text-3xl font-semibold text-gold-400 mt-1">
              {decisionState.selectedOutcome}
              {decisionState.overrideReason && (
                <span className="ml-3 text-xs font-bold px-2.5 py-1 rounded bg-gold-900 text-gold-300 border border-gold-700">
                  Leadership Override
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-xl">{assessment.rationale}</p>
          </div>

          <div className="text-xs text-slate-300 space-y-1 bg-navy-800/80 p-4 rounded-xl border border-navy-700 min-w-[220px]">
            <div className="text-slate-400 font-bold text-[10px]">Decision Metadata</div>
            <div>Decided By: <strong className="text-white">{decisionState.decidedBy}</strong></div>
            <div>Date: <strong className="text-white">{new Date(decisionState.decidedAt).toLocaleDateString()}</strong></div>
          </div>
        </div>

        {decisionState.overrideReason && (
          <div className="p-3 bg-gold-900/40 border border-gold-600/40 rounded-lg text-xs text-gold-200">
            <strong>Override Reason:</strong> "{decisionState.overrideReason}"
          </div>
        )}
      </div>

      {/* 3 Evidence Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Evidence Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Supporting Evidence ({assessment.evidenceSummary.length})
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {assessment.evidenceSummary.map((item, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-emerald-50/60 border border-emerald-100">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Open Risks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Open Operational Risks ({assessment.openRisks.length})
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {assessment.openRisks.map((item, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-amber-50/60 border border-amber-100">
                <span className="text-amber-600 font-bold">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence Gaps */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-blue-600" />
            Evidence Gaps ({assessment.evidenceGaps.length})
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {assessment.evidenceGaps.map((item, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-blue-50/60 border border-blue-100">
                <span className="text-blue-600 font-bold">?</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveOverride}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200"
          >
            <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Override Executive Decision</h3>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Executive Outcome</label>
                <div className="space-y-2">
                  {(['EXPAND', 'IMPROVE_AND_RETEST', 'STOP'] as FinalDecisionOutcome[]).map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setOverrideOutcome(outcome)}
                      className={`w-full p-3 rounded-lg border text-left font-bold transition ${
                        overrideOutcome === outcome
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {outcome === 'EXPAND' && 'EXPAND — Scale across broader organization'}
                      {outcome === 'IMPROVE_AND_RETEST' && 'IMPROVE & RETEST — Refine adoption and controls'}
                      {outcome === 'STOP' && 'STOP — Halve rollout based on current evidence'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Leadership Decision <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why leadership selected or overrode the outcome..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Authorized By</label>
                <input
                  type="text"
                  value={decidedBy}
                  onChange={(e) => setDecidedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!overrideReason.trim()}
                className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-lg text-xs disabled:opacity-50"
              >
                Confirm Executive Decision
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
