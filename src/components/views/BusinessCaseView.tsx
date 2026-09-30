import React, { useState } from 'react';
import { WorkflowState } from '@/types';
import { calculateCurrentCost, calculateFutureCost, calculateConfidence } from '@/lib/engine/calculationEngine';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { AssumptionPanel } from '../common/AssumptionPanel';
import { Calculator, Sliders, Info, ArrowRight, DollarSign, Clock, TrendingUp } from 'lucide-react';

interface BusinessCaseViewProps {
  workflow: WorkflowState;
  onUpdateAssumption: (id: string, newValue: number) => void;
  onResetAssumptions: () => void;
  onNavigate: (viewId: string) => void;
}

export const BusinessCaseView: React.FC<BusinessCaseViewProps> = ({
  workflow,
  onUpdateAssumption,
  onResetAssumptions,
  onNavigate,
}) => {
  const [assumptionsModalOpen, setAssumptionsModalOpen] = useState(false);
  const [calcDetailsOpen, setCalcDetailsOpen] = useState(false);

  const current = calculateCurrentCost(workflow.identity);
  const selectedScenario = workflow.scenarios.find((s) => s.isSelected);
  const future = calculateFutureCost(
    workflow.identity,
    workflow.tasks,
    selectedScenario,
    workflow.assumptions
  );
  const confidence = calculateConfidence(workflow.identity, workflow.tasks, workflow.assumptions, { earlyEstimate: workflow.isEarlyEstimate });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-600">
              Step 6 of 9
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">What it is worth</h1>
          <p className="text-xs text-navy-600">
            A range of likely benefit, from today’s hours, your hourly cost and the assumptions below. Change any of them and it updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAssumptionsModalOpen(true)}
            className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2"
          >
            <Sliders className="h-4 w-4 text-gold-400" />
            <span>View & Edit Assumptions</span>
          </button>
          <button
            onClick={() => onNavigate('roadmap')}
            className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-full text-sm transition shadow-xs"
          >
            Roadmap 30/60/90 →
          </button>
        </div>
      </div>

      {/* Confidence Indicator Card */}
      <ConfidenceIndicator assessment={confidence} />

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Cost */}
        <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-navy-600">
            <span className="text-xs font-bold ">Current Baseline</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-semibold text-navy-900">
            ${current.annualLaborCost.toLocaleString()}
            <span className="text-xs font-medium text-navy-600 block font-sans">/ year labor expenditure</span>
          </div>
          <div className="pt-3 border-t border-navy-100 text-xs text-navy-700 space-y-1">
            <div className="flex justify-between">
              <span>Monthly Hours:</span>
              <span className="font-bold">{current.monthlyHours} hrs/mo</span>
            </div>
            <div className="flex justify-between">
              <span>Hourly Rate:</span>
              <span className="font-bold">${current.hourlyRate}/hr</span>
            </div>
          </div>
        </div>

        {/* Time Released Range */}
        <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-navy-600">
            <span className="text-xs font-bold ">Estimated Time Released</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-semibold text-emerald-900">
            {future.monthlyHoursSavedMin} – {future.monthlyHoursSavedMax} hrs
            <span className="text-xs font-medium text-navy-600 block font-sans">released per month</span>
          </div>
          <div className="pt-3 border-t border-navy-100 text-xs text-navy-700 space-y-1">
            <div className="flex justify-between">
              <span>Time Reduction:</span>
              <span className="font-bold text-emerald-800">{future.automationMinPct}% – {future.automationMaxPct}%</span>
            </div>
            <div className="flex justify-between">
              <span>Annual Capacity:</span>
              <span className="font-bold">{future.annualHoursSavedMin} – {future.annualHoursSavedMax} hrs/yr</span>
            </div>
          </div>
        </div>

        {/* Expected Net Annual Benefit Range */}
        <div className="bg-navy-900 text-white p-6 rounded-2xl border border-navy-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-gold-400">
            <span className="text-xs font-bold ">Net Annual Benefit Range</span>
            <DollarSign className="h-4 w-4 text-gold-400" />
          </div>
          <div className="text-3xl font-semibold text-gold-400">
            ${(future.netAnnualBenefitMin / 1000).toFixed(0)}k – ${(future.netAnnualBenefitMax / 1000).toFixed(0)}k
            <span className="text-xs font-medium text-slate-300 block font-sans">net value generated per year</span>
          </div>
          <div className="pt-3 border-t border-navy-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Implementation Cost:</span>
              <span className="font-bold text-white">${future.implementationCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongoing Operating Cost:</span>
              <span className="font-bold text-white">${future.ongoingOperatingCostMonthly.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Details Accordion */}
      <div className="p-4 rounded-xl bg-white border border-navy-100 shadow-xs">
        <button
          onClick={() => setCalcDetailsOpen(!calcDetailsOpen)}
          className="flex items-center justify-between w-full text-xs font-bold text-navy-700 hover:text-navy-900"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Calculation details & formulas
          </span>
          <span className="text-gold-600 underline">
            {calcDetailsOpen ? 'Hide math formulas' : 'Show math formulas'}
          </span>
        </button>

        {calcDetailsOpen && (
          <div className="mt-4 pt-3 border-t border-navy-100 text-xs text-navy-700 space-y-2 font-mono">
            <p className="font-sans font-bold text-navy-900">How the numbers are worked out:</p>
            <div className="p-3 bg-navy-50 rounded border border-navy-100 space-y-1">
              <div>• Current Monthly Cost = Monthly Hours × Hourly Rate (${current.monthlyHours} × ${current.hourlyRate} = ${current.monthlyLaborCost})</div>
              <div>• Time Released Min = Monthly Hours × Automation Min % (${current.monthlyHours} × {future.automationMinPct}% = {future.monthlyHoursSavedMin} hrs)</div>
              <div>• Gross Annual Savings = Monthly Hours Saved × Hourly Rate × 12</div>
              <div>• Net Annual Benefit = Gross Annual Savings - (Ongoing Monthly Operating Cost × 12)</div>
            </div>
          </div>
        )}
      </div>

      {/* Assumptions Modal */}
      <AssumptionPanel
        assumptions={workflow.assumptions}
        onUpdateAssumption={onUpdateAssumption}
        onReset={onResetAssumptions}
        isOpen={assumptionsModalOpen}
        onClose={() => setAssumptionsModalOpen(false)}
      />
    </div>
  );
};
