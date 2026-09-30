import React from 'react';
import { ChangeItem, Task, WorkflowState } from '@/types';
import { effectiveClassification } from '@/lib/engine/effective';
import { RecommendationBadge } from '@/components/common/Badge';
import { EarlyEstimateBanner, Pill } from '@/components/common/Provenance';

interface Props {
  workflow: WorkflowState;
  onUpdateChangePlan: (plan: ChangeItem[]) => void;
  onNavigate: (view: string) => void;
}

const ctl = 'w-full rounded-lg border border-navy-100 bg-white px-3 py-2 text-sm focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-ai/30';
const areaTone: Record<string, 'document' | 'confirmed' | 'estimate' | 'review' | 'template'> = { Data: 'document', Privacy: 'review', Security: 'review', Quality: 'confirmed', Operational: 'estimate' };

export const PeopleControlsView: React.FC<Props> = ({ workflow, onUpdateChangePlan, onNavigate }) => {
  const plan = workflow.changePlan ?? [];
  const byId = (id: string): Task | undefined => workflow.tasks.find((t) => t.id === id);
  const staying = workflow.tasks.filter((t) => effectiveClassification(t) === 'YOU');
  const patch = (id: string, p: Partial<ChangeItem>) => onUpdateChangePlan(plan.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const unmet = plan.reduce((n, c) => n + c.prerequisites.filter((p) => !p.met).length, 0);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm text-navy-600">Step 5 of 9</p>
        <h1 className="font-display text-4xl font-semibold mt-1">People, skills and controls</h1>
        <p className="mt-3 text-navy-700">
          Each change below exists because of one task. The skills and controls listed are the ones that task calls for. Check them against your own policies; nothing here is a compliance claim.
        </p>
      </header>

      {workflow.isEarlyEstimate && <EarlyEstimateBanner onFix={() => onNavigate('current-state')} />}

      <div className="flex flex-wrap gap-2 text-sm">
        <Pill tone="confirmed">{plan.length} changes</Pill>
        <Pill tone={unmet > 0 ? 'review' : 'confirmed'}>{unmet} prerequisites still missing</Pill>
      </div>

      {plan.length === 0 && <p className="text-navy-700">No task changes yet. Every task stays with people, or is waiting for assessment.</p>}

      <ul className="space-y-5">
        {plan.map((c) => {
          const t = byId(c.taskId);
          if (!t) return null;
          return (
            <li key={c.id} className="rounded-2xl bg-white border border-navy-100 p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-navy-600">Step {t.stepNumber}</p>
                  <h2 className="font-display text-xl font-semibold">{t.name}</h2>
                </div>
                <RecommendationBadge type={effectiveClassification(t)} size="sm" isOverride={!!t.override} />
              </div>
              <p className="text-[15px] text-navy-800">{c.summary}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <List title="Roles affected" items={c.rolesAffected} />
                <List title="New responsibilities" items={c.newResponsibilities} />
                <List title="Skills people need" items={c.skillsNeeded} empty="None needed until this task is assessed." />
                <List title="Training and adoption" items={c.trainingActions} empty="None yet." />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-xs text-navy-600">Business owner
                  <input className={`${ctl} mt-1 text-navy-900`} value={c.businessOwner} onChange={(e) => patch(c.id, { businessOwner: e.target.value })} />
                </label>
                <label className="block text-xs text-navy-600">Technical owner
                  <input className={`${ctl} mt-1 text-navy-900`} value={c.technicalOwner} onChange={(e) => patch(c.id, { technicalOwner: e.target.value })} />
                </label>
              </div>

              {c.controls.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Controls for this change</h3>
                  <ul className="space-y-1.5 text-sm text-navy-800">
                    {c.controls.map((k, i) => (
                      <li key={i} className="flex gap-2"><Pill tone={areaTone[k.area]}>{k.area}</Pill><span>{k.text}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div><h3 className="font-semibold mb-1">Testing required</h3><p className="text-navy-700">{c.testingRequired}</p></div>
                <div><h3 className="font-semibold mb-1">Approval required</h3><p className="text-navy-700">{c.approvalRequired}</p></div>
              </div>

              {c.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Before this can go ahead</h3>
                  <ul className="space-y-2">
                    {c.prerequisites.map((p) => (
                      <li key={p.id}>
                        <label className="flex items-start gap-2.5 text-sm">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy-900" checked={p.met} onChange={(e) => patch(c.id, { prerequisites: c.prerequisites.map((x) => (x.id === p.id ? { ...x, met: e.target.checked } : x)) })} />
                          <span className={p.met ? 'text-navy-600 line-through' : ''}>{p.text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.openRisks.length > 0 && <List title="Open risks" items={c.openRisks} tone="risk" />}
            </li>
          );
        })}
      </ul>

      {staying.length > 0 && (
        <section className="rounded-2xl bg-navy-50 p-6">
          <h2 className="font-display text-xl font-semibold">These stay with people</h2>
          <p className="text-sm text-navy-700 mt-1 mb-3">No change planned. Owners keep these tasks and stay accountable.</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {staying.map((t) => <li key={t.id}><span className="font-medium">{t.name}</span> <span className="text-navy-600">· {t.currentOwner}</span></li>)}
          </ul>
        </section>
      )}

      <button onClick={() => onNavigate('business-case')} className="rounded-full bg-navy-900 hover:bg-navy-800 text-white px-6 py-3 text-sm font-semibold">
        On to the business case
      </button>
    </div>
  );
};

const List: React.FC<{ title: string; items: string[]; empty?: string; tone?: 'risk' }> = ({ title, items, empty, tone }) => (
  <div>
    <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
    {items.length === 0 ? (
      <p className="text-sm text-navy-600">{empty ?? 'None.'}</p>
    ) : (
      <ul className={`list-disc pl-5 space-y-1 text-sm ${tone === 'risk' ? 'text-status-redText' : 'text-navy-700'}`}>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    )}
  </div>
);
