import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { WorkflowState } from '@/types';
import { calculateCurrentCost, calculateFutureCost } from '@/lib/engine/calculationEngine';
import { track } from '@/lib/analytics/analytics';
import { generateExecutivePDF } from '@/lib/engine/pdfExport';
import { effectiveClassification } from '@/lib/engine/effective';
import { checkTaskDependencies } from '@/lib/engine/dependencyEngine';
import { EarlyEstimateBanner } from '@/components/common/Provenance';

interface ExecutiveViewProps {
  workflow: WorkflowState;
  onNavigate: (viewId: string) => void;
}

const outcomeLabel = { EXPAND: 'Expand', IMPROVE_AND_RETEST: 'Improve and retest', STOP: 'Stop' } as const;

/** Everything on this page is derived from the workspace. Nothing is written for a particular example. */
export const ExecutiveView: React.FC<ExecutiveViewProps> = ({ workflow, onNavigate }) => {
  const [isExporting, setIsExporting] = useState(false);

  const current = calculateCurrentCost(workflow.identity);
  const future = calculateFutureCost(workflow.identity, workflow.tasks, workflow.scenarios.find((s) => s.isSelected), workflow.assumptions);
  const scenario = workflow.scenarios.find((s) => s.isSelected);

  const counts = { YOU: 0, AI: 0, BOTH: 0, NEEDS_ASSESSMENT: 0 };
  workflow.tasks.forEach((t) => (counts[effectiveClassification(t)] += 1));
  const kept = workflow.tasks.filter((t) => effectiveClassification(t) === 'YOU');

  const plan = workflow.changePlan ?? [];
  const unmet = plan.flatMap((c) => c.prerequisites.filter((p) => !p.met));
  const risks = [
    ...plan.flatMap((c) => c.openRisks),
    ...unmet.map((p) => `Missing prerequisite: ${p.text}`),
  ].filter((r, i, a) => a.indexOf(r) === i).slice(0, 3);

  const estimates = workflow.assumptions.filter((a) => a.provenance === 'estimate').length;
  const decided = !!workflow.finalDecision.decidedAt;
  const blocked = workflow.roadmap.find((r) => checkTaskDependencies(r, workflow.roadmap).isBlocked && r.status !== 'Complete');
  const nextAction = counts.NEEDS_ASSESSMENT > 0
    ? `Complete the details for ${counts.NEEDS_ASSESSMENT} task${counts.NEEDS_ASSESSMENT > 1 ? 's' : ''} marked “needs assessment”.`
    : unmet.length > 0
    ? `Resolve the ${unmet.length} missing prerequisite${unmet.length > 1 ? 's' : ''} before set-up can start.`
    : blocked
    ? `Unblock “${blocked.title}”.`
    : decided
    ? 'Carry out the decision and record what happens.'
    : 'Run the pilot and record the results, then decide.';

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await generateExecutivePDF(workflow);
      track('report_exported');
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const card = 'p-5 rounded-xl bg-navy-50 border border-navy-100 space-y-2';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-navy-100">
        <div>
          <p className="text-sm text-navy-600">For the executive sponsor</p>
          <h1 className="font-display text-3xl font-semibold mt-1">One-page review</h1>
        </div>
        <button onClick={handleExportPDF} disabled={isExporting} className="inline-flex items-center gap-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50">
          <Download className="h-4 w-4" />
          {isExporting ? 'Preparing PDF…' : 'Download PDF'}
        </button>
      </div>

      {workflow.isEarlyEstimate && <EarlyEstimateBanner onFix={() => onNavigate('current-state')} />}

      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-navy-100 shadow-md space-y-8">
        <div className="border-b border-navy-900 pb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold">{workflow.identity.name}</h2>
            <p className="text-xs text-navy-600 mt-1">
              Owner: {workflow.identity.owner}
              {workflow.identity.businessFunction && ` · ${workflow.identity.businessFunction}`}
              {workflow.sourceDocumentName && ` · Source: ${workflow.sourceDocumentName}`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-3 py-1 bg-navy-900 text-white rounded-full">
              {decided ? `Decision: ${outcomeLabel[workflow.finalDecision.selectedOutcome]}` : 'Not decided yet'}
            </span>
            <div className="text-[11px] text-navy-600 mt-1">Prepared {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={card}>
            <h3 className="text-xs font-semibold text-navy-600">1. Today</h3>
            <div className="font-display text-2xl font-semibold">{current.weeklyHours} hrs/week</div>
            <p className="text-xs text-navy-700">
              About ${current.annualLaborCost.toLocaleString()} a year across {current.peopleCount} {current.peopleCount === 1 ? 'person' : 'people'}.
              {workflow.assumptions.some((a) => (a.id === 'current_monthly_hours' || a.id === 'hourly_cost') && a.provenance === 'estimate') && ' Hours or rate are placeholders, not measured.'}
            </p>
          </div>

          <div className={card}>
            <h3 className="text-xs font-semibold text-navy-600">2. Proposed change</h3>
            <div className="font-display text-lg font-semibold">
              {counts.AI} to AI · {counts.BOTH} shared · {counts.YOU} stay with people{counts.NEEDS_ASSESSMENT > 0 && ` · ${counts.NEEDS_ASSESSMENT} unassessed`}
            </div>
            <p className="text-xs text-navy-700">
              {kept.length > 0
                ? `People keep: ${kept.slice(0, 3).map((t) => t.name.toLowerCase()).join('; ')}${kept.length > 3 ? '…' : ''}.`
                : 'Every task has some AI involvement, with a named person accountable.'}
            </p>
          </div>

          <div className={card}>
            <h3 className="text-xs font-semibold text-navy-600">3. Investment</h3>
            <div className="font-display text-xl font-semibold">${(future.implementationCost / 1000).toFixed(0)}k one-time</div>
            <p className="text-xs text-navy-700">
              {scenario ? `${scenario.implementationEffortWeeks} weeks to implement (${scenario.name}). ` : ''}
              Then ${future.ongoingOperatingCostMonthly.toLocaleString()} a month to run.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-both-soft border border-both/30 space-y-2">
            <h3 className="text-xs font-semibold text-both-ink">4. Expected value</h3>
            <div className="font-display text-2xl font-semibold text-both-ink">
              ${(future.netAnnualBenefitMin / 1000).toFixed(0)}k to ${(future.netAnnualBenefitMax / 1000).toFixed(0)}k a year
            </div>
            <p className="text-xs text-both-ink">
              A range, not a forecast. {estimates > 0 ? `${estimates} of ${workflow.assumptions.length} inputs are product estimates you haven’t replaced.` : 'All inputs come from you or from a template.'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-gold-50 border border-gold-200 space-y-2">
            <h3 className="text-xs font-semibold text-gold-800">5. Open risks</h3>
            {risks.length === 0 ? (
              <p className="text-xs text-gold-800">No open risks recorded.</p>
            ) : (
              <ul className="text-xs text-gold-800 space-y-1">{risks.map((r) => <li key={r}>• {r}</li>)}</ul>
            )}
          </div>

          <div className="p-5 rounded-xl bg-navy-900 text-white space-y-2">
            <h3 className="text-xs font-semibold text-gold-400">6. Decision</h3>
            <div className="font-display text-2xl font-semibold text-gold-400">
              {decided ? outcomeLabel[workflow.finalDecision.selectedOutcome] : 'Not decided yet'}
            </div>
            <p className="text-xs text-white/70">
              {decided
                ? `Recorded by ${workflow.finalDecision.decidedBy || 'unnamed'} on ${new Date(workflow.finalDecision.decidedAt).toLocaleDateString()}.`
                : `Needs pilot evidence first. Current pilot evidence: ${workflow.pilotMetrics.filter((m) => m.recorded !== false).length} of ${workflow.pilotMetrics.length} measures recorded.`}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-gold-50 border border-gold-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-gold-800">7. Next action</h3>
            <p className="text-sm font-medium mt-0.5">{nextAction}</p>
          </div>
          <button onClick={() => onNavigate('governance')} className="text-sm font-semibold underline underline-offset-4">See governance and risks</button>
        </div>
      </div>
    </div>
  );
};
