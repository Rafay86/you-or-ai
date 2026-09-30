import React, { useState } from 'react';
import { WorkflowState, FinalDecisionOutcome, FinalDecisionState } from '@/types';
import { generateFinalDecisionRecommendation } from '@/lib/engine/finalDecisionEngine';
import { Award, AlertOctagon, CheckCircle2, RefreshCw, XCircle, ArrowRight, ShieldCheck, Edit3 } from 'lucide-react';

interface DecisionViewProps {
  workflow: WorkflowState;
  onUpdateFinalDecision: (decision: FinalDecisionState) => void;
  onNavigate: (viewId: string) => void;
}

export const DecisionView: React.FC<DecisionViewProps> = ({
  workflow,
  onUpdateFinalDecision,
  onNavigate,
}) => {
  const recommendation = generateFinalDecisionRecommendation(workflow.pilotMetrics, workflow.governanceItems);

  const [selectedOutcome, setSelectedOutcome] = useState<FinalDecisionOutcome>(
    workflow.finalDecision?.selectedOutcome || recommendation.recommendedOutcome
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    workflow.finalDecision?.overrideReason || ''
  );
  const [decidedBy, setDecidedBy] = useState<string>(
    workflow.finalDecision?.decidedBy || workflow.identity.people.approvers[0] || 'COO / Executive Committee'
  );

  const isOverride = selectedOutcome !== recommendation.recommendedOutcome;

  const handleSaveDecision = () => {
    const updatedState: FinalDecisionState = {
      recommendedOutcome: recommendation.recommendedOutcome,
      selectedOutcome,
      overrideReason: isOverride ? overrideReason : undefined,
      evidenceSummary: recommendation.evidenceSummary,
      openRisks: recommendation.openRisks,
      evidenceGaps: recommendation.evidenceGaps,
      decidedBy,
      decidedAt: new Date().toISOString(),
    };
    onUpdateFinalDecision(updatedState);
  };

  const getOutcomeBadge = (outcome: FinalDecisionOutcome) => {
    switch (outcome) {
      case 'EXPAND':
        return (
          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>EXPAND — Full Enterprise Rollout</span>
          </div>
        );
      case 'IMPROVE_AND_RETEST':
        return (
          <div className="flex items-center gap-2 text-amber-900 bg-amber-100 border border-amber-300 px-4 py-2 rounded-xl font-bold">
            <RefreshCw className="h-5 w-5 text-amber-700" />
            <span>IMPROVE & RETEST — Refine & Run 2nd Pilot</span>
          </div>
        );
      case 'STOP':
        return (
          <div className="flex items-center gap-2 text-red-900 bg-red-100 border border-red-300 px-4 py-2 rounded-xl font-bold">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>STOP — Discontinue Initiative</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-navy-100 text-navy-900 px-2.5 py-0.5 rounded">
              Phase 07 • Decision Gate
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-navy-900 mt-1">Executive Decision & Evidence Verification</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based evidence synthesis to decide whether to expand rollout, improve and retest, or stop.
          </p>
        </div>

        <button
          onClick={() => onNavigate('executive')}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2"
        >
          <span>View Executive Briefing</span>
          <ArrowRight className="h-4 w-4 text-gold-400" />
        </button>
      </div>

      {/* Decision Recommendation Banner */}
      <div className="bg-navy-900 text-white p-6 sm:p-8 rounded-2xl border border-navy-800 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gold-400 ">
              Automated Decision Recommendation Engine
            </span>
            <h2 className="text-xl font-semibold text-white">
              Recommended Gate Decision: {recommendation.recommendedOutcome.replace(/_/g, ' ')}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">{recommendation.rationale}</p>
          </div>
          <div>{getOutcomeBadge(recommendation.recommendedOutcome)}</div>
        </div>

        {/* Evidence Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Empirical Evidence */}
          <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold ">
              <CheckCircle2 className="h-4 w-4" />
              <span>Empirical Evidence</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {recommendation.evidenceSummary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Open Risks */}
          <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold ">
              <AlertOctagon className="h-4 w-4" />
              <span>Open Risks & Blockers</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {recommendation.openRisks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence Gaps */}
          <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/80 space-y-3">
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold ">
              <Award className="h-4 w-4" />
              <span>Evidence Gaps</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200">
              {recommendation.evidenceGaps.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gold-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Executive Decision Override & Signoff Workspace */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy-900">Executive Signoff & Override Controls</h3>
            <p className="text-xs text-slate-500">
              Select final decision outcome and record mandatory rationale if overriding rule-based recommendation.
            </p>
          </div>
          <ShieldCheck className="h-6 w-6 text-gold-600" />
        </div>

        {/* Outcome Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['EXPAND', 'IMPROVE_AND_RETEST', 'STOP'] as FinalDecisionOutcome[]).map((outcome) => {
            const isSelected = selectedOutcome === outcome;
            return (
              <button
                key={outcome}
                onClick={() => setSelectedOutcome(outcome)}
                className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-navy-900 bg-navy-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {outcome.replace(/_/g, ' ')}
                    </span>
                    {recommendation.recommendedOutcome === outcome && (
                      <span className="text-[10px] font-semibold bg-gold-200 text-navy-900 px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {outcome === 'EXPAND' && 'Proceed with organizational rollout and scale.'}
                    {outcome === 'IMPROVE_AND_RETEST' && 'Address adoption gaps & run 2nd pilot iteration.'}
                    {outcome === 'STOP' && 'Discontinue deployment based on current evidence.'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Override Reason Field if Override Active */}
        {isOverride && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <Edit3 className="h-4 w-4 text-amber-700" />
              <span>Mandatory Override Rationale</span>
            </div>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Why are you overriding the recommendation? (e.g. Strategic alignment priorities supersede pilot adoption metrics)..."
              className="w-full text-xs p-3 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {/* Decided By Input & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Authorized By:</label>
            <input
              type="text"
              value={decidedBy}
              onChange={(e) => setDecidedBy(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <button
            onClick={handleSaveDecision}
            className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Record Final Executive Decision</span>
          </button>
        </div>
      </div>
    </div>
  );
};
