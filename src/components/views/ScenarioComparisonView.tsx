import React from 'react';
import { WorkflowState, Scenario } from '@/types';
import { Check, ShieldAlert, ArrowRight, Sliders, Layers } from 'lucide-react';

interface ScenarioComparisonViewProps {
  workflow: WorkflowState;
  onSelectScenario: (scenarioId: 'scenario-a' | 'scenario-b') => void;
  onNavigate: (viewId: string) => void;
}

export const ScenarioComparisonView: React.FC<ScenarioComparisonViewProps> = ({
  workflow,
  onSelectScenario,
  onNavigate,
}) => {
  const scenarios = workflow.scenarios;
  const scenarioA = scenarios.find((s) => s.id === 'scenario-a') || scenarios[0];
  const scenarioB = scenarios.find((s) => s.id === 'scenario-b') || scenarios[1];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
              Step 3 of 7
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Future-State Options
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Scenario Comparison</h1>
          <p className="text-xs text-slate-500">
            Evaluate alternative transformation strategies side-by-side. The studio does not manufacture winners; leadership selects based on risk appetite.
          </p>
        </div>

        <button
          onClick={() => onNavigate('business-case')}
          className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
        >
          View Business Case →
        </button>
      </div>

      {/* Side-by-side Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[scenarioA, scenarioB].map((sc: Scenario) => {
          const isSelected = sc.isSelected;
          return (
            <div
              key={sc.id}
              className={`rounded-2xl p-6 sm:p-8 border transition-all flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'bg-white border-navy-900 ring-2 ring-navy-900/10 shadow-xl'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    {sc.id === 'scenario-a' ? 'Option 1' : 'Option 2'}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-semibold text-gold-800 bg-gold-100 border border-gold-300 px-3 py-1 rounded-full flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Selected Target Scenario
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-slate-900">{sc.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{sc.tagline}</p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">Monthly Human Effort</span>
                    <div className="text-base font-semibold text-slate-900 mt-0.5">{sc.humanEffortHoursMonthly} hrs/mo</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">AI Involvement</span>
                    <div className="text-base font-semibold text-blue-900 mt-0.5">{sc.aiInvolvementPct}% automated</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">Implementation Effort</span>
                    <div className="text-base font-semibold text-slate-900 mt-0.5">{sc.implementationEffortWeeks} weeks</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold">Potential Time Released</span>
                    <div className="text-base font-semibold text-emerald-900 mt-0.5">{sc.potentialTimeReleasedHoursMonthly} hrs/mo</div>
                  </div>
                </div>

                {/* Risks & Controls */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-900">Key Risks:</span>
                    <ul className="space-y-1 text-slate-600">
                      {sc.keyRisks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-900">Required Controls:</span>
                    <ul className="space-y-1 text-slate-600">
                      {sc.requiredControls.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => onSelectScenario(sc.id)}
                  disabled={isSelected}
                  className={`w-full py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-navy-900 hover:bg-navy-800 text-white shadow-md'
                  }`}
                >
                  {isSelected ? 'Currently Selected' : 'Use this scenario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
