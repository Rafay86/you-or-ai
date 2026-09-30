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
    const updated = metrics.map((m) => (m.id === id ? { ...m, actual: editActual } : m));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
              Step 6 of 7
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Empirical Evidence Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Pilot Results & Variance Analysis</h1>
          <p className="text-xs text-slate-500">
            Compare actual pilot outcomes against baseline metrics and target ranges.
          </p>
        </div>

        <button
          onClick={() => onNavigate('decision')}
          className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
        >
          Executive Decision →
        </button>
      </div>

      {/* Visual Chart Comparison */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-navy-900" />
            Baseline vs Target vs Actual Pilot Results
          </h3>
          <span className="text-xs text-slate-500">Updated from controlled 4-week pilot run</span>
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-navy-900 text-white font-bold text-xs flex items-center justify-between">
          <span>Pilot Metrics Evaluation Table</span>
          <span>Click "Edit Actual" to record empirical pilot data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
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
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {m.baseline} {m.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
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
                          <span className="text-slate-500 text-[11px]">{m.unit}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-900">
                          {m.actual} {m.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold">
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 ml-auto"
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
    </div>
  );
};
