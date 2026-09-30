import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { initialWeeklyManagementReportWorkflow } from '@/lib/data/seedData';
import { migrateWorkflow } from '@/lib/storage/migrate';
import { effectiveClassification } from '@/lib/engine/effective';
import { compareScenarios } from '@/lib/engine/scenarioCompare';
import { OverlapMark } from '@/components/common/Overlap';

interface Props {
  onNavigate: (view: string) => void;
  /** Loads the built-in example, then goes to the given screen. */
  onOpenExample: (view: string) => void;
}

const money = (n: number) => `$${Math.round(n / 100) / 10}k`;

const steps = [
  { id: 'start', name: 'Begin', you: 'Pick how to start: answer five questions, upload a procedure (PDF, Word or text), or copy a starter from the library.', get: 'A draft workspace with every step listed.' },
  { id: 'current-state', name: 'Confirm the work', you: 'Correct each step: who does it, which systems, how often, where it waits. Add steps that happen in practice but were never written down.', get: 'An honest picture of how the work really runs, with the source of every step shown.' },
  { id: 'tasks', name: 'Who does what', you: 'Read the verdict for each task. Change any you disagree with and say why.', get: 'You, AI, Both or Needs assessment for every task, with the reasons, and a log of who overrode what.' },
  { id: 'future-state', name: 'Redesign', you: 'Look at today and the proposed flow side by side. Compare the cautious and the more automated option.', get: 'A new workflow that shows where a person checks the work, and a scenario comparison with cost, payback and downside.' },
  { id: 'people', name: 'People and controls', you: 'Name the business and technical owners. Tick off prerequisites as they are met.', get: 'For each changed task: the skills to learn, training, controls, testing, approval and open risks.' },
  { id: 'business-case', name: 'Business case', you: 'Replace placeholder hours and hourly cost with real figures.', get: 'A range of benefit, not one number, with every input labelled as your fact, a template default or an estimate.' },
  { id: 'roadmap', name: 'Roadmap', you: 'Assign owners and move items forward. Blocked items wait for what they depend on.', get: 'A 30, 60, 90 day plan that follows the changes, with dependencies enforced.' },
  { id: 'pilot', name: 'Pilot', you: 'Run the pilot small, then type in the real results.', get: 'Expected against actual, and which assumptions turned out wrong.' },
  { id: 'decision', name: 'Decide', you: 'Record the decision and who made it.', get: 'Expand, improve and retest, or stop, backed by the evidence. With no pilot data it says so instead of guessing.' },
];

const faqs = [
  ['Is this a chatbot?', 'No. It breaks a workflow into tasks, applies written rules to each, and builds the plan, cost and pilot tracking around the result. No AI service is called.'],
  ['Why should we trust a verdict?', 'Every verdict lists the rules that produced it. A person can override it, and the override is recorded with their name and reason. The decision stays with people.'],
  ['What happens to our confidential documents?', 'A file you upload is read inside your browser. It is not uploaded, not sent to any AI service and not logged. Only anonymous usage counts can be collected, and never document text, task names or file names.'],
  ['How solid is the ROI?', 'It is a range, not a forecast. Each input says whether you supplied it, it came from a template, or the product estimated it. Real confidence arrives after a pilot.'],
  ['Does it guarantee compliance?', 'No. Controls are prompts to check against your own policies. Nothing here claims regulatory compliance.'],
  ['What if the AI gets it wrong?', 'Every AI or shared task comes with a review route, testing and an approval. The pilot then shows which assumptions failed.'],
];

/** A single page a newcomer or a sponsor can read, with buttons that jump into the real screens. */
export const GuideView: React.FC<Props> = ({ onNavigate, onOpenExample }) => {
  const ex = useMemo(() => {
    const w = migrateWorkflow(JSON.parse(JSON.stringify(initialWeeklyManagementReportWorkflow)));
    const counts = { YOU: 0, AI: 0, BOTH: 0 } as Record<string, number>;
    w.tasks.forEach((t) => { const c = effectiveClassification(t); if (c in counts) counts[c] += 1; });
    const [a, b] = compareScenarios(w);
    return { w, counts, a, b };
  }, []);

  const demo = [
    { t: 'See the example', d: `A weekly management report with ${ex.w.tasks.length} tasks.`, go: () => onOpenExample('overview') },
    { t: 'Read a verdict', d: 'Open a task and read why it is AI, Both or You.', go: () => onOpenExample('tasks') },
    { t: 'Compare two options', d: 'Cautious against more automated, with the downside.', go: () => onOpenExample('scenario-comparison') },
    { t: 'Follow the plan', d: 'Skills, controls and prerequisites for each change.', go: () => onOpenExample('people') },
    { t: 'Read the one-page review', d: 'What a sponsor sees. Download it as a PDF.', go: () => onOpenExample('executive') },
  ];

  return (
    <div className="max-w-4xl space-y-16">
      <header className="space-y-5">
        <div className="flex items-center gap-3"><OverlapMark size={22} /><p className="text-sm font-medium text-navy-600">How it works</p></div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05]">Decide who should do each part of a job, then plan the change.</h1>
        <p className="text-lg text-navy-700 max-w-2xl leading-relaxed">
          You give it a real workflow. It splits it into tasks and says which should stay with people, which AI can do within limits, and which need both. Then it works out the plan, the cost and how to test it small before committing.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button onClick={() => onOpenExample('overview')} className="inline-flex items-center gap-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm px-6 py-3.5">
            Open the example <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => onNavigate('start')} className="rounded-full bg-white border border-navy-100 hover:border-navy-900 font-semibold text-sm px-6 py-3.5">
            Start with my own workflow
          </button>
        </div>
      </header>

      {/* The three answers */}
      <section aria-labelledby="three">
        <h2 id="three" className="font-display text-3xl font-semibold">Every task gets one of three answers</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { k: 'You', c: 'bg-you-soft text-you-ink', dot: 'bg-you', d: 'A person does it. It needs judgment, carries risk, or depends on a relationship.', e: 'Decide which delays go to leadership.' },
            { k: 'Both', c: 'bg-both-soft text-both-ink', dot: 'bg-both', d: 'AI prepares or drafts. A person checks it and stays accountable.', e: 'Draft the commentary, then edit and approve it.' },
            { k: 'AI', c: 'bg-ai-soft text-ai-ink', dot: 'bg-ai', d: 'AI does it within limits, with an exception route and a sample check.', e: 'Gather and consolidate the weekly updates.' },
          ].map((x) => (
            <div key={x.k} className={`rounded-2xl p-6 ${x.c}`}>
              <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${x.dot}`} /><h3 className="font-display text-2xl font-semibold">{x.k}</h3></div>
              <p className="mt-3 text-[15px] leading-relaxed">{x.d}</p>
              <p className="mt-4 text-sm opacity-80">Example: {x.e}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-navy-700 max-w-3xl">
          A fourth answer, <strong>Needs assessment</strong>, appears when key information is missing. The tool never guesses. “AI” never means unattended: there is always someone who reviews exceptions.
        </p>
      </section>

      {/* Numbers from the live example */}
      <section aria-labelledby="ex" className="rounded-2xl bg-white border border-navy-100 p-6 sm:p-8">
        <h2 id="ex" className="font-display text-3xl font-semibold">What you see in the example</h2>
        <p className="mt-2 text-navy-700">A fictional weekly management report. These figures are read from the example itself.</p>
        <div className="mt-6 grid sm:grid-cols-3 gap-6">
          <div><p className="font-display text-4xl font-semibold">{ex.counts.AI} · {ex.counts.BOTH} · {ex.counts.YOU}</p><p className="text-sm text-navy-700 mt-1">AI, shared, and kept by people, out of {ex.w.tasks.length} tasks</p></div>
          <div><p className="font-display text-4xl font-semibold">{money(ex.a.netAnnual)} to {money(ex.b.netAnnual)}</p><p className="text-sm text-navy-700 mt-1">Net benefit a year, cautious to more automated</p></div>
          <div><p className="font-display text-4xl font-semibold">{ex.a.paybackMonths} to {ex.b.paybackMonths} mo</p><p className="text-sm text-navy-700 mt-1">Payback, if the saving happens as stated</p></div>
        </div>
        <p className="mt-6 text-sm text-navy-700">
          The example then shows a pilot that cut weekly effort and errors, but adoption stayed under target. So the recommendation is <strong>improve and retest</strong>, not expand.
        </p>
      </section>

      {/* Guided demo */}
      <section aria-labelledby="demo">
        <h2 id="demo" className="font-display text-3xl font-semibold">A five minute demo</h2>
        <p className="mt-2 text-navy-700">Each button opens the example on that screen.</p>
        <ol className="mt-6 divide-y divide-navy-100 rounded-2xl bg-white border border-navy-100">
          {demo.map((d, i) => (
            <li key={d.t} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-navy-100 font-mono text-xs">{i + 1}</span>
                <div><p className="font-medium">{d.t}</p><p className="text-sm text-navy-700">{d.d}</p></div>
              </div>
              <button onClick={d.go} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2">Open <ArrowRight className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ol>
      </section>

      {/* What a new person does */}
      <section aria-labelledby="steps">
        <h2 id="steps" className="font-display text-3xl font-semibold">What a new person does, step by step</h2>
        <p className="mt-2 text-navy-700">These nine steps are the sidebar, in order. Each builds on the one before.</p>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s.id} className="rounded-2xl bg-white border border-navy-100 p-5 sm:p-6 grid sm:grid-cols-[2.5rem_1fr_auto] gap-x-4 gap-y-3 items-start">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 text-white font-mono text-xs">{i + 1}</span>
              <div>
                <h3 className="font-display text-xl font-semibold">{s.name}</h3>
                <p className="mt-2 text-[15px] text-navy-800"><span className="font-medium">You: </span>{s.you}</p>
                <p className="mt-1.5 text-[15px] text-navy-800"><span className="font-medium">You get: </span>{s.get}</p>
              </div>
              <button onClick={() => onNavigate(s.id)} className="justify-self-start sm:justify-self-end text-sm font-semibold underline underline-offset-4 decoration-navy-100 hover:decoration-navy-900">Go to this step</button>
            </li>
          ))}
        </ol>
      </section>

      {/* Labels */}
      <section aria-labelledby="labels" className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-navy-50 p-6">
          <h2 id="labels" className="font-display text-2xl font-semibold">Every number says where it came from</h2>
          <ul className="mt-4 space-y-2 text-sm text-navy-800">
            <li><span className="rounded-full bg-both-soft text-both-ink px-2 py-0.5 text-[11px] font-medium mr-2">Your fact</span>You supplied it.</li>
            <li><span className="rounded-full bg-navy-100 text-navy-700 px-2 py-0.5 text-[11px] font-medium mr-2">From template</span>A default from a starter.</li>
            <li><span className="rounded-full bg-gold-100 text-gold-800 px-2 py-0.5 text-[11px] font-medium mr-2">Estimate</span>The product’s own guess. Replace it.</li>
          </ul>
          <p className="mt-4 text-sm text-navy-700">A draft from a few answers is marked <strong>early estimate</strong> everywhere until you add detail.</p>
        </div>
        <div className="rounded-2xl bg-navy-50 p-6">
          <h2 className="font-display text-2xl font-semibold">What it does not do</h2>
          <ul className="mt-4 space-y-2 text-sm text-navy-800 list-disc pl-5">
            <li>Store data anywhere but this browser. There is no login or sharing yet.</li>
            <li>Read scanned PDFs. It needs text in the file.</li>
            <li>Promise a return. Savings are ranges from stated inputs.</li>
            <li>Claim compliance. Controls are prompts for your own policies.</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq">
        <h2 id="faq" className="font-display text-3xl font-semibold">Questions people ask</h2>
        <div className="mt-6 divide-y divide-navy-100 rounded-2xl bg-white border border-navy-100">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium">
                {q}<span className="text-navy-600 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-[15px] text-navy-700 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
