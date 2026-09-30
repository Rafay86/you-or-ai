import React from 'react';
import { WorkflowState, TaskClassification } from '@/types';
import { EarlyEstimateBanner } from '@/components/common/Provenance';
import { ArrowRight } from 'lucide-react';

interface OverviewViewProps {
  workflow: WorkflowState;
  onNavigate: (viewId: string) => void;
}

const lanes: { key: TaskClassification; title: string; blurb: string; dot: string; text: string }[] = [
  { key: 'YOU', title: 'You', blurb: 'Needs your judgment', dot: 'bg-you', text: 'text-you-ink' },
  { key: 'BOTH', title: 'Both', blurb: 'AI drafts, you decide', dot: 'bg-both', text: 'text-both-ink' },
  { key: 'AI', title: 'AI', blurb: 'Safe to hand over', dot: 'bg-ai', text: 'text-ai-ink' },
];

export const OverviewView: React.FC<OverviewViewProps> = ({ workflow, onNavigate }) => {
  const effective = (t: WorkflowState['tasks'][number]) => t.override?.newClassification ?? t.recommendation;
  const byLane = (k: TaskClassification) => workflow.tasks.filter((t) => effective(t) === k);
  const counts = { YOU: byLane('YOU').length, BOTH: byLane('BOTH').length, AI: byLane('AI').length };

  return (
    <div className="space-y-16">
      {workflow.isEarlyEstimate && <EarlyEstimateBanner onFix={() => onNavigate('current-state')} />}

      {workflow.isTemplateExample && (
        <div className="animate-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold-50 border border-gold-200 px-5 py-3.5">
          <p className="text-sm text-gold-800">
            <span className="font-semibold">You’re looking at example data</span> — a weekly management report we made
            up so you can see how everything fits.
          </p>
          <button
            onClick={() => onNavigate('current-state')}
            className="text-sm font-semibold text-gold-800 underline underline-offset-4 decoration-gold-500 hover:decoration-2"
          >
            Walk through it
          </button>
        </div>
      )}

      {/* Hero: the question, and the overlap that answers it */}
      <section className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-6 items-center">
        <div className="animate-rise" style={{ animationDelay: '60ms' }}>
          <p className="text-sm font-medium text-navy-600 mb-5">For leaders deciding where AI belongs</p>
          <h1 className="font-display text-[2.75rem] sm:text-6xl leading-[1.02] font-semibold text-navy-900">
            Who should do
            <br />
            this work?
          </h1>
          <p className="mt-6 max-w-md text-lg text-navy-700 leading-relaxed">
            Take one real workflow, go task by task, and decide what stays with people, what goes to AI, and what
            takes both. Then see what it’s worth before you spend a rupee.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('start')}
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-6 py-3.5 transition-colors"
            >
              Start with a workflow <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="rounded-full text-sm font-semibold text-navy-900 px-5 py-3.5 hover:bg-navy-100/70 transition-colors"
            >
              See the example verdicts
            </button>
          </div>
        </div>

        {/* Signature: two people-coloured circles; the overlap is the "both". Numbers are the live workflow. */}
        <div className="animate-rise relative mx-auto w-full max-w-[34rem] aspect-[1.25/1]" style={{ animationDelay: '160ms' }}>
          <div className="absolute left-[2%] top-[8%] w-[62%] aspect-square rounded-full bg-you" />
          <div className="absolute right-[2%] top-[8%] w-[62%] aspect-square rounded-full bg-ai overflow-hidden">
            {/* the overlap: a copy of the YOU circle, clipped to the AI circle, in the colour of BOTH */}
            <div className="absolute top-0 left-[-54.8%] w-full h-full rounded-full bg-both" />
          </div>
          <div className="absolute inset-0 grid grid-cols-[1fr_0.8fr_1fr] items-center text-navy-900 pointer-events-none">
            <Zone n={counts.YOU} label="You" />
            <Zone n={counts.BOTH} label="Both" light />
            <Zone n={counts.AI} label="AI" light />
          </div>
          <p className="absolute -bottom-1 left-0 right-0 text-center text-xs text-navy-600">
            {workflow.tasks.length} tasks in “{workflow.identity.name}”
          </p>
        </div>
      </section>

      {/* The tasks behind those numbers, in plain words */}
      <section className="animate-rise" style={{ animationDelay: '240ms' }}>
        <div className="grid md:grid-cols-3 gap-x-8 gap-y-10">
          {lanes.map((lane) => (
            <div key={lane.key}>
              <div className="flex items-baseline gap-2 border-b border-navy-100 pb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${lane.dot} translate-y-px`} />
                <h2 className="font-display text-xl font-semibold">{lane.title}</h2>
                <span className="text-sm text-navy-600">{lane.blurb}</span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {byLane(lane.key).length === 0 && <li className="text-sm text-navy-600">Nothing lands here yet.</li>}
                {byLane(lane.key).map((t) => (
                  <li key={t.id} className="text-[15px] leading-snug text-navy-800">
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Three ways in */}
      <section>
        <div className="mb-6">
          <h2 className="font-display text-3xl font-semibold">Work on your own workflow</h2>
          <p className="mt-2 text-navy-700">Three ways to start. All of them end in the same editable workspace.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { id: 'start', t: 'Quick start', d: 'Five questions, one editable draft.' },
            { id: 'start', t: 'Upload a procedure', d: 'PDF, Word or text, read in your browser.' },
            { id: 'templates', t: 'Industry library', d: 'Banking, insurance and cross-industry starters.' },
          ].map((c) => (
            <button key={c.t} onClick={() => onNavigate(c.id)} className="text-left rounded-2xl bg-white border border-navy-100 p-6 hover:border-navy-900 hover:shadow-md transition">
              <h3 className="font-display text-xl font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-navy-700">{c.d}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">Begin <ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const Zone: React.FC<{ n: number; label: string; light?: boolean }> = ({ n, label }) => (
  <div className="text-center">
    <div className="font-display text-6xl sm:text-7xl font-semibold leading-none">{n}</div>
    <div className="mt-1 text-sm font-semibold">{label}</div>
  </div>
);
