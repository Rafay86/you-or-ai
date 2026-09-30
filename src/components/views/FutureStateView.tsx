import React, { useState } from 'react';
import { WorkflowState, WorkflowNode, NodeType } from '@/types';
import { GitBranch, Plus, Trash2, Edit2, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

interface FutureStateViewProps {
  workflow: WorkflowState;
  onUpdateCanvas: (updatedCanvas: WorkflowState['canvas']) => void;
  onNavigate: (viewId: string) => void;
}

export const FutureStateView: React.FC<FutureStateViewProps> = ({
  workflow,
  onUpdateCanvas,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'proposed'>('proposed');
  const [canvasData, setCanvasData] = useState(workflow.canvas);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);

  const currentNodes = canvasData.currentState.nodes;
  const proposedNodes = canvasData.proposedState.nodes;

  const nodeTypeColors: Record<NodeType, string> = {
    Human: 'bg-amber-100 border-amber-300 text-amber-900',
    AI: 'bg-blue-100 border-blue-300 text-blue-900',
    'Human + AI': 'bg-emerald-100 border-emerald-300 text-emerald-900',
    System: 'bg-slate-100 border-slate-300 text-slate-900',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600 bg-gold-100 px-2 py-0.5 rounded">
              03 Redesign Stage
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Interactive Workflow Canvas
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Current vs Proposed Workflow</h1>
          <p className="text-xs text-slate-500">
            Compare step-by-step handoffs between legacy manual workflow and proposed Human+AI target architecture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNode}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Process Node
          </button>
          <button
            onClick={() => onNavigate('scenario-comparison')}
            className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl text-xs transition shadow-xs"
          >
            Scenario Comparison →
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'current'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Current State Workflow</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {currentNodes.length} nodes
          </span>
        </button>

        <button
          onClick={() => setActiveTab('proposed')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'proposed'
              ? 'bg-gold-500 text-navy-900 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Proposed State (Human + AI Target)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-navy-900 text-white font-mono">
            {proposedNodes.length} nodes
          </span>
        </button>
      </div>

      {/* Canvas Visual Container */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl overflow-x-auto space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 font-mono">
            <GitBranch className="h-4 w-4 text-gold-400" />
            <span>Workflow Canvas: {activeTab === 'current' ? 'Legacy Manual Handoffs' : 'Automated Human-in-the-Loop Target'}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Human</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> AI</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Human+AI</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-400" /> Decision</span>
          </div>
        </div>

        {/* Horizontal Node Flow Graph */}
        <div className="flex items-center gap-4 py-8 overflow-x-auto min-w-max">
          {activeNodes.map((node, index) => {
            const color = nodeTypeColors[node.type] || 'bg-slate-100 text-slate-900';
            return (
              <React.Fragment key={node.id}>
                {/* Process Node Box */}
                <div className="relative group w-64 bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-lg space-y-2 hover:border-gold-500 transition">
                  {/* Review Point Badge */}
                  {node.reviewPoint && (
                    <span className="absolute -top-3 left-4 bg-gold-500 text-navy-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs border border-white flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Human Review Gate
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                      {node.type}
                    </span>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{node.label}</h4>
                  <p className="text-xs text-slate-500">{node.description}</p>

                  <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                    <span>Owner: {node.owner}</span>
                    <span className="font-mono text-slate-400">Step {index + 1}</span>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < activeNodes.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-1 text-slate-500">
                    <ArrowRight className="h-5 w-5 text-gold-400" />
                    <span className="text-[10px] font-mono text-slate-400 mt-1">next</span>
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
