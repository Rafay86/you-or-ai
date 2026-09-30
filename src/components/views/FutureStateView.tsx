import React, { useState } from 'react';
import { WorkflowState, WorkflowNode, NodeType } from '@/types';
import { canvasIsStale } from '@/lib/engine/workflowBuilder';
import { GitBranch, Plus, Trash2, Edit2, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

interface FutureStateViewProps {
  workflow: WorkflowState;
  onUpdateCanvas: (updatedCanvas: WorkflowState['canvas']) => void;
  onRebuildCanvas?: () => void;
  onNavigate: (viewId: string) => void;
}

export const FutureStateView: React.FC<FutureStateViewProps> = ({
  workflow,
  onUpdateCanvas,
  onRebuildCanvas,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'proposed'>('proposed');
  const [canvasData, setCanvasData] = useState(workflow.canvas);
  React.useEffect(() => setCanvasData(workflow.canvas), [workflow.canvas]);
  // The built-in example's canvas is hand-drawn at a different granularity, so only generated canvases are compared.
  const stale = !workflow.isTemplateExample && canvasIsStale(workflow.canvas, workflow.tasks);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);

  const currentNodes = canvasData.currentState.nodes;
  const proposedNodes = canvasData.proposedState.nodes;

  const nodeTypeColors: Record<NodeType, string> = {
    Human: 'bg-you-soft border-transparent text-you-ink',
    AI: 'bg-ai-soft border-transparent text-ai-ink',
    'Human + AI': 'bg-both-soft border-transparent text-both-ink',
    System: 'bg-navy-100 border-slate-300 text-navy-900',
    Decision: 'bg-purple-100 border-purple-300 text-purple-900',
    Review: 'bg-gold-100 border-gold-300 text-gold-900',
    Exception: 'bg-red-100 border-red-300 text-red-900',
    Output: 'bg-navy-900 border-navy-800 text-white',
  };

  const handleAddNode = () => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      label: 'New Process Step',
      type: 'Human + AI',
      owner: 'Operations Team',
      description: 'Describe new process node action...',
    };

    const targetKey = activeTab === 'current' ? 'currentState' : 'proposedState';
    const updated = {
      ...canvasData,
      [targetKey]: {
        ...canvasData[targetKey],
        nodes: [...canvasData[targetKey].nodes, newNode],
      },
    };
    setCanvasData(updated);
    onUpdateCanvas(updated);
  };

  const handleDeleteNode = (id: string) => {
    const targetKey = activeTab === 'current' ? 'currentState' : 'proposedState';
    const updated = {
      ...canvasData,
      [targetKey]: {
        ...canvasData[targetKey],
        nodes: canvasData[targetKey].nodes.filter((n) => n.id !== id),
      },
    };
    setCanvasData(updated);
    onUpdateCanvas(updated);
  };

  const activeNodes = activeTab === 'current' ? currentNodes : proposedNodes;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {stale && onRebuildCanvas && (
        <div role="status" className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800 flex flex-wrap items-center justify-between gap-2">
          <span>Your You / AI / Both decisions have changed since this proposed workflow was drawn.</span>
          <button onClick={() => { onRebuildCanvas(); }} className="font-semibold underline underline-offset-4 decoration-gold-500">
            Redraw from decisions (replaces hand edits)
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-600">
              Step 4 of 9
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-navy-900 mt-1">Today and proposed</h1>
          <p className="text-xs text-navy-600">
            See who does each step today, who does it after the change, and where a person checks the work.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNode}
            className="px-4 py-2 bg-white border border-navy-100 hover:border-navy-900 text-navy-900 font-semibold rounded-full text-sm transition flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add a step
          </button>
          <button
            onClick={() => onNavigate('scenario-comparison')}
            className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-full text-sm transition shadow-xs"
          >
            Scenario Comparison →
          </button>
        </div>
      </div>

      <p className="text-[15px] text-navy-800" data-testid="change-summary">
        {(() => {
          const c = { AI: 0, BOTH: 0, YOU: 0 } as Record<string, number>;
          workflow.tasks.forEach((t) => { const k = t.override ? t.override.newClassification : t.recommendation; if (k in c) c[k] += 1; });
          const added = workflow.tasks.filter((t) => t.origin === 'observed').length;
          return `${c.AI} steps move to AI, ${c.BOTH} become shared between AI and a person, ${c.YOU} stay with people${added ? `, and ${added} step${added > 1 ? 's that happen' : ' that happens'} in practice ${added > 1 ? 'are' : 'is'} now written down` : ''}.`;
        })()}
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-100 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'current'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'bg-white border border-navy-100 text-navy-700 hover:bg-navy-50'
          }`}
        >
          <span>Today</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
            {currentNodes.length} steps
          </span>
        </button>

        <button
          onClick={() => setActiveTab('proposed')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'proposed'
              ? 'bg-navy-900 text-white'
              : 'bg-white border border-navy-100 text-navy-700 hover:bg-navy-50'
          }`}
        >
          <span>Proposed</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
            {proposedNodes.length} steps
          </span>
        </button>
      </div>

      {/* Canvas Visual Container */}
      <div className="bg-white text-navy-900 rounded-2xl p-6 sm:p-8 border border-navy-100 shadow-sm overflow-x-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-navy-700 border-b border-navy-100 pb-4">
          <div className="flex items-center gap-2 font-medium">
            <GitBranch className="h-4 w-4 text-navy-600" />
            <span>{activeTab === 'current' ? 'How the work runs today' : 'Who does what after the change'}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-you" /> You</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ai" /> AI</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-both" /> Both</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-navy-700" /> Decision</span>
          </div>
        </div>

        {/* Horizontal Node Flow Graph */}
        <div className="flex items-center gap-4 py-8 overflow-x-auto min-w-max">
          {activeNodes.map((node, index) => {
            const color = nodeTypeColors[node.type] || 'bg-navy-100 text-navy-900';
            return (
              <React.Fragment key={node.id}>
                {/* Process Node Box */}
                <div className="relative group w-64 bg-white text-navy-900 rounded-xl p-4 border border-navy-100 shadow-sm space-y-2 hover:border-navy-900 transition">
                  {/* Review Point Badge */}
                  {node.reviewPoint && (
                    <span className="absolute -top-3 left-4 bg-navy-900 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      A person checks here
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                      {node.type}
                    </span>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 text-navy-600 hover:text-status-red transition p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-navy-900 leading-snug">{node.label}</h4>
                  <p className="text-xs text-navy-600">{node.description}</p>

                  <div className="pt-2 border-t border-navy-100 text-[11px] font-semibold text-navy-700 flex items-center justify-between">
                    <span>Owner: {node.owner}</span>
                    <span className="text-navy-600">Step {index + 1}</span>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < activeNodes.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-1 text-navy-600">
                    <ArrowRight className="h-5 w-5 text-navy-600" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
