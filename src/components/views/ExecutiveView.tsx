import React, { useState } from 'react';
import { WorkflowState } from '@/types';
import { calculateCurrentCost, calculateFutureCost } from '@/lib/engine/calculationEngine';
import { generateExecutivePDF } from '@/lib/engine/pdfExport';
import { Download, FileText, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExecutiveViewProps {
  workflow: WorkflowState;
  onNavigate: (viewId: string) => void;
}

export const ExecutiveView: React.FC<ExecutiveViewProps> = ({ workflow, onNavigate }) => {
  const [isExporting, setIsExporting] = useState(false);

  const current = calculateCurrentCost(workflow.identity);
  const selectedScenario = workflow.scenarios.find((s) => s.isSelected);
  const future = calculateFutureCost(
    workflow.identity,
    workflow.tasks,
    selectedScenario,
    workflow.assumptions
  );

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await generateExecutivePDF(workflow);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
            Board & C-Suite Executive Summary
          </span>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">1-Page Transformation Review</h1>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-gold-400" />
          <span>{isExporting ? 'Generating PDF...' : 'Export Executive PDF'}</span>
        </button>
      </div>

      {/* Printable Executive Board Sheet Container */}
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-8 text-slate-900">
        {/* Board Header */}
        <div className="border-b border-navy-900 pb-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gold-700">
              AI Transformation Review
            </span>
            <h2 className="text-3xl font-semibold text-navy-900 mt-1">{workflow.identity.name}</h2>
            <p className="text-xs text-slate-600 mt-1">Owner: {workflow.identity.owner} | Business Unit: {workflow.identity.businessFunction}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1 bg-navy-900 text-gold-400 rounded-full">
              Status: {workflow.finalDecision.selectedOutcome}
            </span>
            <div className="text-[11px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Section 1 & 2: Opportunity & Proposed Change */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-500">1. Opportunity Scope</h3>
            <div className="text-2xl font-semibold text-navy-900">{current.weeklyHours} hrs/week</div>
            <p className="text-xs text-slate-600">
              Current baseline labor expenditure is ${current.annualLaborCost.toLocaleString()}/year across {current.peopleCount} team members. Estimated capacity release: <strong>{future.automationMinPct}%–{future.automationMaxPct}%</strong>.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-500">2. Proposed Target Architecture</h3>
            <div className="text-lg font-bold text-navy-900">Human + AI Hybrid Workflow</div>
            <p className="text-xs text-slate-600">
              Automates routine spreadsheet parsing and variance calculation while enforcing mandatory VP Operations signoff on strategic commentary.
            </p>
          </div>
        </div>

        {/* Section 3 & 4: Investment & Expected Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-500">3. Investment Required</h3>
            <div className="text-xl font-bold text-slate-900">${(future.implementationCost / 1000).toFixed(0)}k one-time</div>
            <p className="text-xs text-slate-600">
              Implementation timeframe: <strong>4–8 weeks</strong>. Ongoing operating software expense: <strong>${future.ongoingOperatingCostMonthly}/month</strong>.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <h3 className="text-xs font-bold text-emerald-800">4. Expected Value</h3>
            <div className="text-2xl font-semibold text-emerald-900">
              ${(future.netAnnualBenefitMin / 1000).toFixed(0)}k – ${(future.netAnnualBenefitMax / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-emerald-900">
              Net annual financial return range based on standard labor release assumptions.
            </p>
          </div>
        </div>

        {/* Section 5 & 6: Top Risks & Decision Required */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold text-amber-900">5. Top 3 Operational Risks</h3>
            <ul className="text-xs text-amber-950 space-y-1">
              <li>• Formatting drift in incoming department spreadsheets</li>
              <li>• Department lead adoption rate currently at 72%</li>
              <li>• Tone and strategic framing require human signoff</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-navy-900 text-white space-y-2 border border-navy-800">
            <h3 className="text-xs font-bold text-gold-400">6. Executive Decision</h3>
            <div className="text-2xl font-semibold text-gold-400">{workflow.finalDecision.selectedOutcome}</div>
            <p className="text-xs text-slate-300">
              Authorized by {workflow.finalDecision.decidedBy} on {new Date(workflow.finalDecision.decidedAt).toLocaleDateString()}.
            </p>
          </div>
        </div>

        {/* Section 7: One Clear Next Action */}
        <div className="p-5 rounded-xl bg-gold-50 border border-gold-300 text-gold-950 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gold-900">7. Next Action</h3>
            <p className="text-sm font-bold text-navy-900 mt-0.5">
              Conduct targeted 2-week department lead template training before initiating Phase 2 full rollout.
            </p>
          </div>

          <button
            onClick={() => onNavigate('governance')}
            className="px-4 py-2 bg-navy-900 text-white text-xs font-bold rounded-lg hover:bg-navy-800 transition whitespace-nowrap"
          >
            Review Governance Checklist →
          </button>
        </div>
      </div>
    </div>
  );
};
