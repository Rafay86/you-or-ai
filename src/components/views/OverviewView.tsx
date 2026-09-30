import React from 'react';
import { WorkflowState, TemplateDefinition, TaskClassification } from '@/types';
import { sampleTemplates } from '@/lib/data/seedData';
import { ArrowRight } from 'lucide-react';

interface OverviewViewProps {
  workflow: WorkflowState;
  onNavigate: (viewId: string) => void;
  onSelectTemplate: (templateId: string) => void;
}

const lanes: { key: TaskClassification; title: string; blurb: string; dot: string; text: string }[] = [
  { key: 'YOU', title: 'You', blurb: 'Needs your judgment', dot: 'bg-you', text: 'text-you-ink' },
  { key: 'BOTH', title: 'Both', blurb: 'AI drafts, you decide', dot: 'bg-both', text: 'text-both-ink' },
  { key: 'AI', title: 'AI', blurb: 'Safe to hand over', dot: 'bg-ai', text: 'text-ai-ink' },
];

export const OverviewView: React.FC<OverviewViewProps> = ({ workflow, onNavigate, onSelectTemplate }) => {
  const effective = (t: WorkflowState['tasks'][number]) => t.override?.newClassification ?? t.recommendation;
  const byLane = (k: TaskClassification) => workflow.tasks.filter((t) => effective(t) === k);
  const counts = { YOU: byLane('YOU').length, BOTH: byLane('BOTH').length, AI: byLane('AI').length };

  return (
    <div className="space-y-16">
      {workflow.isTemplateExample && (
        <div className="animate-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold-50 border border-gold-200 px-5 py-3.5">
          <p className="text-sm text-gold-800">
            <span className="font-semibold">You’re looking at example data</span> — a weekly management report we made
            up so you can see how everything fits.
          </p>
          <button
            onClick={() => onNavigate('discover')}
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
              onClick={() => onNavigate('discover')}
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

      {/* Templates */}
      <section>
        <div className="mb-6">
          <h2 className="font-display text-3xl font-semibold">Start from a workflow you know</h2>
          <p className="mt-2 text-navy-700">Pick one to explore. You can change every number afterwards.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {sampleTemplates.map((template: TemplateDefinition) => {
            const isCurrent = workflow.identity.id === template.id;
            return (
              <article
                key={template.id}
                className={`flex flex-col justify-between rounded-2xl p-7 transition-shadow hover:shadow-md ${
                  isCurrent ? 'bg-white border-2 border-navy-900' : 'bg-white border border-navy-100'
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-navy-600">
                    {template.isImplemented ? 'Ready to explore' : 'Outline only'}
                    {isCurrent && <span className="ml-2 rounded-full bg-gold-100 text-gold-800 px-2 py-0.5">Open now</span>}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-semibold leading-tight">{template.title}</h3>
                  <p className="mt-3 text-[15px] text-navy-700 leading-relaxed">{template.description}</p>
                </div>
                <div className="mt-7 flex items-center justify-between">
                  <span className="text-xs text-navy-600">
                    {template.isImplemented ? '11 tasks, full pilot data' : 'Sample structure'}
                  </span>
                  <button
                    onClick={() => onSelectTemplate(template.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isCurrent ? 'bg-navy-900 text-white hover:bg-navy-800' : 'bg-navy-100 text-navy-900 hover:bg-navy-100/60'
                    }`}
                  >
                    {isCurrent ? 'Keep working' : 'Open this one'} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
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
