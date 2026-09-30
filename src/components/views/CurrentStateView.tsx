import React from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Task, WorkflowState } from '@/types';
import { assessTask } from '@/lib/engine/decisionEngine';
import { RecommendationBadge } from '@/components/common/Badge';
import { EarlyEstimateBanner, Pill, SourceBadge } from '@/components/common/Provenance';

interface Props {
  workflow: WorkflowState;
  onUpdateTasks: (tasks: Task[]) => void;
  onNavigate: (view: string) => void;
}

const ctl = 'w-full rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-ai/30';
const levels = ['Low', 'Medium', 'High'] as const;

export const CurrentStateView: React.FC<Props> = ({ workflow, onUpdateTasks, onNavigate }) => {
  const tasks = workflow.tasks;

  /** Any edit re-runs the rules; a recorded human override still wins. */
  const edit = (id: string, patch: Partial<Task>) => {
    onUpdateTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...patch };
        const a = assessTask(merged);
        return { ...merged, recommendation: a.recommendation, confidence: a.confidence, reasons: a.reasons, riskFlags: a.riskFlags, suggestedRoleSplit: a.suggestedRoleSplit };
      })
    );
  };

  const renumber = (list: Task[]) => list.map((t, i) => ({ ...t, stepNumber: i + 1 }));

  const addObserved = () => {
    const n = tasks.length + 1;
    const blank: Task = {
      id: `task-obs-${Date.now().toString(36)}`,
      stepNumber: n,
      name: 'New step that happens in practice',
      description: 'Describe what actually happens here.',
      currentOwner: '',
      frequency: '',
      repeatability: 'Medium',
      dataReadiness: 'Semi-structured',
      judgmentRequired: 'Medium',
      sensitivity: 'Internal',
      errorImpact: 'Medium',
      outputCheckability: 'Moderate',
      exceptionRate: 'Medium',
      humanRelationshipImportance: 'Low',
      recommendation: 'NEEDS_ASSESSMENT',
      confidence: 'Low',
      reasons: [],
      riskFlags: [],
      suggestedRoleSplit: { ai: [], human: [] },
      source: { kind: 'user' },
      origin: 'observed',
      needsReview: false,
      systems: [],
    };
    const a = assessTask(blank);
    onUpdateTasks(renumber([...tasks, { ...blank, ...a }]));
  };

  const remove = (id: string) => onUpdateTasks(renumber(tasks.filter((t) => t.id !== id)));
  const toReview = tasks.filter((t) => t.needsReview).length;
  const observed = tasks.filter((t) => t.origin === 'observed').length;

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm text-navy-600">Step 2 of 9</p>
        <h1 className="font-display text-4xl font-semibold mt-1">How the work really happens</h1>
        <p className="mt-3 text-navy-700">
          Correct anything that doesn’t match reality. Add steps that people do but nobody wrote down. Every change re-runs the verdict for that task.
        </p>
      </header>

      {workflow.isEarlyEstimate && <EarlyEstimateBanner />}

      {workflow.guidance && (
        <aside className="rounded-2xl bg-white border border-navy-100 p-5 text-sm space-y-2">
          <p className="text-navy-600">{workflow.guidance.source}</p>
          <p className="font-medium">Questions to verify with your own team</p>
          <ul className="list-disc pl-5 text-navy-700 space-y-1">{workflow.guidance.questionsToVerify.map((q) => <li key={q}>{q}</li>)}</ul>
        </aside>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-navy-700">
        <Pill tone="template">{tasks.length - observed} documented</Pill>
        <Pill tone="estimate">{observed} happen in practice</Pill>
        {toReview > 0 && <Pill tone="review">{toReview} need your check</Pill>}
      </div>

      <ol className="space-y-4">
        {tasks.map((t) => (
          <li key={t.id} className={`rounded-2xl bg-white border p-6 space-y-4 ${t.needsReview ? 'border-status-red/40' : 'border-navy-100'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-100 font-mono text-xs">{t.stepNumber}</span>
                <SourceBadge source={t.source} needsReview={t.needsReview} origin={t.origin} />
              </div>
              <div className="flex items-center gap-2">
                <RecommendationBadge type={t.override ? t.override.newClassification : t.recommendation} size="sm" isOverride={!!t.override} />
                {t.needsReview && (
                  <button onClick={() => edit(t.id, { needsReview: false })} className="inline-flex items-center gap-1 rounded-full bg-both-soft text-both-ink px-3 py-1 text-xs font-semibold">
                    <Check className="h-3 w-3" /> Looks right
                  </button>
                )}
                {t.origin === 'observed' && (
                  <button onClick={() => remove(t.id)} aria-label={`Remove step ${t.stepNumber}`} className="p-1.5 rounded-full hover:bg-navy-100/70"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Task"><input className={ctl} value={t.name} onChange={(e) => edit(t.id, { name: e.target.value })} /></Field>
              <Field label="Expected output"><input className={ctl} value={t.expectedOutput ?? ''} onChange={(e) => edit(t.id, { expectedOutput: e.target.value })} placeholder="What this step produces" /></Field>
              <Field label="Who does it"><input className={ctl} value={t.currentOwner} onChange={(e) => edit(t.id, { currentOwner: e.target.value })} placeholder="Person or team" /></Field>
              <Field label="Systems and data used"><input className={ctl} value={(t.systems ?? []).join(', ')} onChange={(e) => edit(t.id, { systems: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} placeholder="Comma separated" /></Field>
              <Field label="How often, and how many"><input className={ctl} value={t.frequency} onChange={(e) => edit(t.id, { frequency: e.target.value })} placeholder="e.g. weekly, 12 items" /></Field>
              <Field label="Time per cycle, hours (if known)"><input type="number" min={0} className={ctl} value={t.timeHoursPerCycle ?? ''} onChange={(e) => edit(t.id, { timeHoursPerCycle: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })} /></Field>
              <Field label="Delays and handoffs"><input className={ctl} value={[t.delays, t.handoffs].filter(Boolean).join(' / ')} onChange={(e) => edit(t.id, { delays: e.target.value, handoffs: '' })} placeholder="Where does it wait or change hands?" /></Field>
              <Field label="Exceptions"><input className={ctl} value={t.exceptions ?? ''} onChange={(e) => edit(t.id, { exceptions: e.target.value })} placeholder="What goes wrong or is unusual?" /></Field>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Human judgment"><Select v={t.judgmentRequired} o={levels} on={(v) => edit(t.id, { judgmentRequired: v as Task['judgmentRequired'] })} /></Field>
              <Field label="Data sensitivity"><Select v={t.sensitivity} o={['Public', 'Internal', 'Confidential', 'Strictly Restricted']} on={(v) => edit(t.id, { sensitivity: v as Task['sensitivity'] })} /></Field>
              <Field label="Cost of an error"><Select v={t.errorImpact} o={['Low', 'Medium', 'High', 'Critical']} on={(v) => edit(t.id, { errorImpact: v as Task['errorImpact'] })} /></Field>
              <Field label="Data readiness"><Select v={t.dataReadiness} o={['Structured', 'Semi-structured', 'Unstructured', 'Missing']} on={(v) => edit(t.id, { dataReadiness: v as Task['dataReadiness'] })} /></Field>
            </div>

            {t.openQuestions && t.openQuestions.length > 0 && (
              <ul className="text-xs text-navy-700 space-y-1">
                {t.openQuestions.map((q) => <li key={q}><Pill tone="estimate">Assumed or missing</Pill> {q}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <button onClick={addObserved} className="inline-flex items-center gap-2 rounded-full bg-white border border-navy-100 hover:border-navy-900 px-5 py-3 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add a step that happens in practice
        </button>
        <button onClick={() => onNavigate('tasks')} className="rounded-full bg-navy-900 hover:bg-navy-800 text-white px-6 py-3 text-sm font-semibold">
          See who should do each task
        </button>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block text-xs text-navy-600">
    <span className="block mb-1">{label}</span>
    {children}
  </label>
);

const Select: React.FC<{ v: string; o: readonly string[]; on: (v: string) => void }> = ({ v, o, on }) => (
  <select className={ctl} value={v} onChange={(e) => on(e.target.value)}>
    {o.map((x) => <option key={x}>{x}</option>)}
  </select>
);
