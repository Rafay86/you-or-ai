import React from 'react';
import { Check } from 'lucide-react';
import { WorkflowState } from '@/types';
import { compareScenarios, scenarioHints } from '@/lib/engine/scenarioCompare';
import { EarlyEstimateBanner } from '@/components/common/Provenance';

interface Props {
  workflow: WorkflowState;
  onSelectScenario: (scenarioId: 'scenario-a' | 'scenario-b') => void;
  onNavigate: (viewId: string) => void;
}

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n / 100) / 10).toLocaleString()}k`;

/** Two ways to make the change, side by side, so a leader can pick by appetite for risk. */
export const ScenarioComparisonView: React.FC<Props> = ({ workflow, onSelectScenario, onNavigate }) => {
  const outcomes = compareScenarios(workflow);
  const hints = scenarioHints(workflow);
  const maxHours = Math.max(...outcomes.map((o) => o.scenario.humanEffortHoursMonthly), 1);
  const maxSaved = Math.max(...outcomes.map((o) => o.hoursReleasedMonthly), 1);
  const cols = 'grid grid-cols-2 md:grid-cols-[11rem_1fr_1fr] gap-x-4 gap-y-2 md:gap-x-8';

  const Row: React.FC<{ label: string; hint?: string; children: (i: number) => React.ReactNode }> = ({ label, hint, children }) => (
    <div className={`${cols} py-4 border-t border-navy-100 items-start`}>
      <div className="col-span-2 md:col-span-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-navy-600 mt-0.5">{hint}</p>}
      </div>
      {outcomes.map((o, i) => (
        <div key={i} className="min-w-0">
          <p className="md:hidden text-[11px] text-navy-600 mb-0.5">{i === 0 ? 'Cautious' : 'More automated'}</p>
          {children(i)}
        </div>
      ))}
    </div>
  );

  const Bar: React.FC<{ value: number; max: number; tone: string }> = ({ value, max, tone }) => (
    <div className="h-2 rounded-full bg-navy-100 mt-2" aria-hidden="true">
      <div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
    </div>
  );

  const cautious = hints.filter((h) => h.toward === 'cautious');
  const automated = hints.filter((h) => h.toward === 'automated');
  const either = hints.filter((h) => h.toward === 'either');

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <p className="text-sm text-navy-600">Step 4 of 9, option B</p>
        <h1 className="font-display text-4xl font-semibold mt-1">Two ways to make the change</h1>
        <p className="mt-3 text-navy-700">
          Neither is the right answer by itself. The first is slower and safer. The second saves more and asks more of you. The choice depends on how much risk you are willing to carry.
        </p>
      </header>

      {workflow.isEarlyEstimate && <EarlyEstimateBanner onFix={() => onNavigate('current-state')} />}

      <section aria-label="Side-by-side comparison" className="rounded-2xl bg-white border border-navy-100 p-4 md:p-8">
        {/* Column heads */}
        <div className={`${cols} pb-5`}>
          <div className="hidden md:block" />
          {outcomes.map((o) => (
            <div key={o.scenario.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${o.scenario.id === 'scenario-a' ? 'bg-you' : 'bg-ai'}`} />
                <h2 className="font-display text-lg md:text-xl font-semibold leading-tight break-words">{o.scenario.name.replace(/^Scenario [AB]\s*[:—–-]\s*/, '')}</h2>
              </div>
              {o.scenario.isSelected && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-navy-900 text-white text-[11px] font-medium px-2.5 py-0.5 whitespace-normal text-left">
                  <Check className="h-3 w-3" /> Chosen for the business case
                </span>
              )}
              <p className="mt-2 text-xs md:text-sm text-navy-700 leading-snug">{o.scenario.tagline}</p>
            </div>
          ))}
        </div>

        <Row label="People’s time each month" hint="Lower means more capacity freed">
          {(i) => (
            <>
              <p className="font-display text-xl md:text-2xl font-semibold">{outcomes[i].scenario.humanEffortHoursMonthly} hrs</p>
              <Bar value={outcomes[i].scenario.humanEffortHoursMonthly} max={maxHours} tone="bg-navy-700" />
            </>
          )}
        </Row>
        <Row label="Time released" hint="Per month, against today">
          {(i) => (
            <>
              <p className="font-display text-xl md:text-2xl font-semibold text-both-ink">{outcomes[i].hoursReleasedMonthly} hrs</p>
              <Bar value={outcomes[i].hoursReleasedMonthly} max={maxSaved} tone="bg-both" />
            </>
          )}
        </Row>
        <Row label="How much AI does">
          {(i) => (
            <>
              <p className="font-display text-xl md:text-2xl font-semibold">{outcomes[i].scenario.aiInvolvementPct}%</p>
              <Bar value={outcomes[i].scenario.aiInvolvementPct} max={100} tone="bg-ai" />
            </>
          )}
        </Row>
        <Row label="Time to set up">
          {(i) => <p className="font-display text-xl md:text-2xl font-semibold">{outcomes[i].scenario.implementationEffortWeeks} weeks</p>}
        </Row>
        <Row label="Cost to set up" hint="Your implementation figure, scaled by weeks">
          {(i) => <p className="font-display text-xl md:text-2xl font-semibold">{money(outcomes[i].implementationCost)}</p>}
        </Row>
        <Row label="Cost to run" hint="Per month">
          {(i) => <p className="font-display text-xl md:text-2xl font-semibold">${outcomes[i].runCostMonthly.toLocaleString()}</p>}
        </Row>
        <Row label="Net benefit a year" hint="Time released, less running cost">
          {(i) => (
            <>
              <p className="font-display text-xl md:text-2xl font-semibold">{money(outcomes[i].netAnnual)}</p>
              <p className="text-xs text-navy-600 mt-1">
                If only 60% of the saving happens: <strong className={outcomes[i].netAnnualIfSixtyPct < 0 ? 'text-status-redText' : ''}>{money(outcomes[i].netAnnualIfSixtyPct)}</strong>
              </p>
            </>
          )}
        </Row>
        <Row label="Pays back in">
          {(i) => <p className="font-display text-xl md:text-2xl font-semibold">{outcomes[i].paybackMonths === null ? 'Not at these figures' : `${outcomes[i].paybackMonths} months`}</p>}
        </Row>
        <Row label="What could go wrong">
          {(i) => <ul className="text-sm text-navy-700 space-y-1.5 list-disc pl-4">{outcomes[i].scenario.keyRisks.map((r) => <li key={r}>{r}</li>)}</ul>}
        </Row>
        <Row label="Controls it needs">
          {(i) => <ul className="text-sm text-navy-700 space-y-1.5 list-disc pl-4">{outcomes[i].scenario.requiredControls.map((c) => <li key={c}>{c}</li>)}</ul>}
        </Row>

        <div className={`${cols} pt-5 border-t border-navy-100 items-center`}>
          <div className="hidden md:block" />
          {outcomes.map((o) => (
            <button
              key={o.scenario.id}
              onClick={() => onSelectScenario(o.scenario.id)}
              disabled={o.scenario.isSelected}
              className={`rounded-full py-3 text-sm font-semibold transition-colors ${o.scenario.isSelected ? 'bg-navy-100 text-navy-600 cursor-default' : 'bg-navy-900 hover:bg-navy-800 text-white'}`}
            >
              {o.scenario.isSelected ? 'Chosen' : 'Use this one'}
            </button>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6" aria-label="What your workflow suggests">
        <div className="rounded-2xl bg-you-soft p-6">
          <h2 className="font-display text-xl font-semibold text-you-ink">Points toward the cautious option</h2>
          {cautious.length === 0 ? <p className="mt-3 text-sm text-you-ink">Nothing in your workflow argues for extra caution right now.</p> : (
            <ul className="mt-3 space-y-2 text-sm text-you-ink list-disc pl-5">{cautious.map((h) => <li key={h.text}>{h.text}</li>)}</ul>
          )}
        </div>
        <div className="rounded-2xl bg-ai-soft p-6">
          <h2 className="font-display text-xl font-semibold text-ai-ink">Points toward the more automated option</h2>
          {automated.length === 0 ? <p className="mt-3 text-sm text-ai-ink">Nothing in your workflow yet argues for going further.</p> : (
            <ul className="mt-3 space-y-2 text-sm text-ai-ink list-disc pl-5">{automated.map((h) => <li key={h.text}>{h.text}</li>)}</ul>
          )}
        </div>
        {either.length > 0 && (
          <div className="md:col-span-2 rounded-2xl bg-navy-50 p-5 text-sm text-navy-700">
            {either.map((h) => <p key={h.text}>{h.text}</p>)}
          </div>
        )}
      </section>

      <p className="text-sm text-navy-600 max-w-3xl">
        These are pointers from your own workflow, not a verdict. The savings use each option’s stated hours and your hourly cost, so they are only as good as those inputs.
      </p>
      <button onClick={() => onNavigate('business-case')} className="rounded-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-6 py-3">
        See the business case for the chosen option
      </button>
    </div>
  );
};
