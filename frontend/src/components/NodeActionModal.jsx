import { useState } from 'react'
import axios from 'axios'
import { Sparkles, AlertCircle, CheckCircle2, ChevronRight, Shield, ListCheck, Loader2 } from 'lucide-react'
import { clientSideNodeAction } from '../services/clientLlm'

export default function NodeActionModal({ node, nodeType, onClose, onApplyChanges }) {
  const [selectedAction, setSelectedAction] = useState('expand')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleExecute = async () => {
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      try {
        const { data: response } = await axios.post('/api/projects/node-action', {
          action: selectedAction,
          node,
          customPrompt,
        })

        if (response.success) {
          setResult(response.data)
          return
        }
      } catch (apiErr) {
        // Fallback to client-side direct action
        console.log('[node-action] Backend unavailable, running direct AI action...')
        const directResult = await clientSideNodeAction(selectedAction, node, customPrompt)
        setResult(directResult)
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to process AI action.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    onApplyChanges(selectedAction, node, result)
    onClose()
  }

  const nodeName = node.deliverableName || node.packageName || node.taskTitle || 'Selected Node'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-xl w-full p-6 space-y-5 border border-brand-500/40 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles size={11} /> AI Assisted Refinement
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {nodeName}
            </h3>
            <span className="text-xs text-white/40">Target: {nodeType} ({node.id || 'Node'})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Action Picker */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setSelectedAction('expand'); setResult(null); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedAction === 'expand'
                ? 'bg-brand-600/25 border-brand-500 text-brand-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Sparkles size={16} className="mb-1 text-brand-400" />
            <div className="font-semibold text-xs">Expand Further</div>
            <div className="text-[10px] text-white/40">Add granular tasks</div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedAction('suggest_risks'); setResult(null); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedAction === 'suggest_risks'
                ? 'bg-amber-600/25 border-amber-500 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Shield size={16} className="mb-1 text-amber-400" />
            <div className="font-semibold text-xs">Suggest Risks</div>
            <div className="text-[10px] text-white/40">Identify failure points</div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedAction('acceptance_criteria'); setResult(null); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedAction === 'acceptance_criteria'
                ? 'bg-cyan-600/25 border-cyan-500 text-cyan-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <ListCheck size={16} className="mb-1 text-cyan-400" />
            <div className="font-semibold text-xs">Acceptance Criteria</div>
            <div className="text-[10px] text-white/40">Generate testable DoD</div>
          </button>
        </div>

        {/* Optional Custom PM Instructions */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1">
            Optional Custom Instruction:
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Focus on security compliance, or break into frontend vs backend..."
            className="input-field text-xs py-2"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Result Preview */}
        {result && (
          <div className="space-y-3 p-4 rounded-xl bg-dark-900 border border-brand-500/30 max-h-56 overflow-y-auto text-xs animate-fade-in">
            <div className="flex items-center justify-between text-brand-300 font-bold border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-400" /> Generated Preview
              </span>
              <span className="text-[10px] text-white/40">Ready to incorporate</span>
            </div>

            {result.newTasks && (
              <div className="space-y-2">
                <p className="text-white/50 text-[11px] font-medium">New Sub-tasks to be added:</p>
                {result.newTasks.map((t, idx) => (
                  <div key={idx} className="p-2 rounded bg-white/5 border border-white/5">
                    <div className="font-semibold text-white">{t.taskTitle} ({t.estimatedHours}h)</div>
                    <div className="text-white/60 text-[11px] mt-0.5">{t.description}</div>
                  </div>
                ))}
              </div>
            )}

            {result.risks && (
              <div className="space-y-2">
                <p className="text-amber-300/80 text-[11px] font-medium">Identified Risks & Mitigations:</p>
                {result.risks.map((r, idx) => (
                  <div key={idx} className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">
                    <div className="font-bold">{r.riskTitle} [{r.severity}]</div>
                    <div className="text-[11px] mt-0.5">{r.mitigationStrategy}</div>
                  </div>
                ))}
              </div>
            )}

            {result.acceptanceCriteria && (
              <div className="space-y-1.5">
                <p className="text-cyan-300/80 text-[11px] font-medium">Definition of Done (DoD):</p>
                <ul className="list-disc pl-4 space-y-1 text-white/80">
                  {result.acceptanceCriteria.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-4 text-xs"
          >
            Cancel
          </button>

          {!result ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleExecute}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Processing with AI...
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Generate Refinement
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 bg-green-600 hover:bg-green-500"
            >
              <CheckCircle2 size={13} /> Apply to WBS Structure
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
