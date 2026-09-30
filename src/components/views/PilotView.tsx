import { checkAssumptions } from '@/lib/engine/assumptionCheck';
import React, { useState } from 'react';
import { WorkflowState, PilotMetric } from '@/types';
import { evaluateAllPilotMetrics } from '@/lib/engine/pilotEngine';
import { StatusBadge } from '../common/Badge';
import { BarChart3, TrendingDown, TrendingUp, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PilotViewProps {
  workflow: WorkflowState;
  onUpdatePilotMetrics: (updatedMetrics: PilotMetric[]) => void;
  onNavigate: (viewId: string) => void;
}

export const PilotView: React.FC<PilotViewProps> = ({
  workflow,
  onUpdatePilotMetrics,
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState<PilotMetric[]>(workflow.pilotMetrics);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editActual, setEditActual] = useState<number>(0);

  const evaluated = evaluateAllPilotMetrics(metrics);

  const handleStartEdit = (m: PilotMetric) => {
    setEditingMetricId(m.id);
    setEditActual(m.actual);
  };

  const handleSaveActual = (id: string) => {
    const updated = metrics.map((m) => (m.id === id ? { ...m, actual: editActual, recorded: true } : m));
    setMetrics(updated);
    onUpdatePilotMetrics(updated);
    setEditingMetricId(null);
  };

  // Chart dataset transformation
  const chartData = evaluated.map((m) => ({
    name: m.name.length > 20 ? m.name.substring(0, 18) + '...' : m.name,
    Baseline: m.baseline,
    TargetAvg: Math.round((m.targetMin + m.targetMax) / 2),
    Actual: m.actual,
    unit: m.unit,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-600">
              Step 8 of 9
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">Pilot results</h1>
          <p className="text-xs text-navy-600">
            Compare actual pilot outcomes against baseline metrics and target ranges.
          </p>
        </div>

        <button
          onClick={() => onNavigate('decision')}
          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-full text-sm transition shadow-xs whitespace-nowrap"
        >
          Executive Decision →
        </button>
      </div>

      {/* Visual Chart Comparison */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-navy-900" />
            Baseline vs Target vs Actual Pilot Results
          </h3>
          <span className="text-xs text-navy-600">Updated from controlled 4-week pilot run</span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: any, name: any, item: any) => [`${value} ${item.payload.unit}`, name]} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Baseline" fill="#64748B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TargetAvg" fill="#C8A96B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#0B132B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Detailed Table */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-xs overflow-hidden">
        <div className="p-4 bg-navy-900 text-white font-bold text-xs flex items-center justify-between">
          <span>Pilot Metrics Evaluation Table</span>
          <span>Click “Edit Actual” to record what really happened</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy-100 text-navy-700 font-bold border-b border-navy-100">
                <th className="py-3 px-4">Metric Name</th>
                <th className="py-3 px-3">Baseline</th>
                <th className="py-3 px-3">Target Range</th>
                <th className="py-3 px-3">Actual Result</th>
                <th className="py-3 px-3">Variance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {evaluated.map((m) => {
                const isEditing = editingMetricId === m.id;

                return (
                  <tr key={m.id} className="hover:bg-navy-50 transition">
                    <td className="py-3 px-4 font-bold text-navy-900">{m.name}</td>
                    <td className="py-3 px-3 text-navy-700">
                      {m.baseline} {m.unit}
                    </td>
                    <td className="py-3 px-3 text-navy-700">
                      {m.targetMin}–{m.targetMax} {m.unit}
                    </td>
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editActual}
                            onChange={(e) => setEditActual(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-xs"
                          />
                          <span className="text-navy-600 text-[11px]">{m.unit}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-navy-900">
                          {m.recorded === false ? <span className="font-normal text-navy-600">Not recorded</span> : `${m.actual} ${m.unit}`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {m.recorded === false ? (
                        <span className="font-normal text-navy-600">—</span>
                      ) : (
                      <span
                        className={
                          m.direction === 'reduction'
                            ? m.variance <= 0
                              ? 'text-emerald-700'
                              : 'text-red-700'
                            : m.variance >= 0
                            ? 'text-emerald-700'
                            : 'text-red-700'
                        }
                      >
                        {m.variance > 0 ? `+${m.variance}` : m.variance} {m.unit} ({m.variancePct}%)
                      </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveActual(m.id)}
                          className="px-3 py-1 bg-navy-900 text-white rounded text-[11px] font-bold hover:bg-navy-800"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="px-2.5 py-1 bg-navy-100 hover:bg-slate-200 text-navy-700 rounded text-[11px] font-medium flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit Actual
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Which assumptions turned out to be wrong */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Which assumptions held up</h2>
        <ul className="divide-y divide-navy-100 rounded-2xl bg-white border border-navy-100">
          {checkAssumptions(metrics, workflow.assumptions).map((f) => (
            <li key={f.label} className="p-4 flex flex-wrap items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{f.label}</p>
                <p className="text-navy-600 mt-0.5">{f.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-navy-600">Assumed {f.expected}</p>
                <p className="font-medium">Measured {f.actual}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${f.verdict === 'held' ? 'bg-both-soft text-both-ink' : f.verdict === 'partly' ? 'bg-gold-100 text-gold-800' : f.verdict === 'wrong' ? 'bg-red-50 text-status-redText' : 'bg-navy-100 text-navy-700'}`}>
                  {f.verdict === 'held' ? 'Held' : f.verdict === 'partly' ? 'Partly held' : f.verdict === 'wrong' ? 'Was wrong' : 'Untested'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
