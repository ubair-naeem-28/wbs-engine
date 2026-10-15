import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Box,
  CheckSquare,
  AlertTriangle,
  Clock,
  Shield,
  ListCheck,
} from 'lucide-react'

export default function OutlineView({
  data,
  onUpdateTask,
  onUpdateWorkPackage,
  onUpdateDeliverable,
  onAddTask,
  onAddWorkPackage,
  onDeleteNode,
  onTriggerAiAction,
}) {
  const [collapsed, setCollapsed] = useState(new Set())
  const [activeDetailsNode, setActiveDetailsNode] = useState(null)

  const toggleCollapse = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => {
    const allIds = new Set()
    ;(data.deliverables || []).forEach((d) => {
      allIds.add(d.id)
      ;(d.workPackages || []).forEach((wp) => allIds.add(wp.id))
    })
    setCollapsed(allIds)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Table Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div className="text-xs text-white/50">
          Click any text, hour, or priority to edit inline. Hours automatically roll up to 100% of project scope.
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-white/50 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span className="text-white/20">·</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-white/50 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Main Tree Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-dark-900/80 backdrop-blur-md shadow-xl">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-white/50 uppercase tracking-wider">
              <th className="py-3 px-4 w-1/2">WBS Element / Hierarchy</th>
              <th className="py-3 px-3 w-24 text-center">Hours</th>
              <th className="py-3 px-3 w-28 text-center">% of Scope</th>
              <th className="py-3 px-3 w-28">Priority</th>
              <th className="py-3 px-3 w-40">Skill / Role</th>
              <th className="py-3 px-3 w-28 text-center">Risk</th>
              <th className="py-3 px-3 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {(data.deliverables || []).map((deliv, dIdx) => {
              const isDelivCollapsed = collapsed.has(deliv.id);
              const wpCount = deliv.workPackages?.length || 0;

              return (
                <DeliverableRowGroup
                  key={deliv.id || dIdx}
                  deliv={deliv}
                  dIdx={dIdx}
                  isCollapsed={isDelivCollapsed}
                  onToggle={() => toggleCollapse(deliv.id)}
                  collapsed={collapsed}
                  onToggleWp={(wpId) => toggleCollapse(wpId)}
                  onUpdateDeliverable={onUpdateDeliverable}
                  onUpdateWorkPackage={onUpdateWorkPackage}
                  onUpdateTask={onUpdateTask}
                  onAddTask={onAddTask}
                  onAddWorkPackage={onAddWorkPackage}
                  onDeleteNode={onDeleteNode}
                  onTriggerAiAction={onTriggerAiAction}
                  onOpenDetails={(task) => setActiveDetailsNode(task)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Task Details / Acceptance Criteria Modal */}
      {activeDetailsNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 border border-brand-500/30">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-brand-400 font-bold">{activeDetailsNode.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeDetailsNode.taskTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailsNode(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-white/50 uppercase block mb-1">Description</span>
                <p className="text-white/80 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                  {activeDetailsNode.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-white/50 uppercase block mb-1">Risk & Mitigation</span>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Shield size={13} /> Level: {activeDetailsNode.riskLevel || 'Low'}
                  </div>
                  <p>{activeDetailsNode.riskMitigation || 'Standard operational procedures apply.'}</p>
                </div>
              </div>

              {activeDetailsNode.acceptanceCriteria && activeDetailsNode.acceptanceCriteria.length > 0 && (
                <div>
                  <span className="font-semibold text-white/50 uppercase block mb-1">Acceptance Criteria (DoD)</span>
                  <ul className="space-y-1.5 bg-white/5 p-3 rounded-lg border border-white/5">
                    {activeDetailsNode.acceptanceCriteria.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/80">
                        <ListCheck size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveDetailsNode(null)}
                className="btn-secondary py-1.5 px-4 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeliverableRowGroup({
  deliv,
  dIdx,
  isCollapsed,
  onToggle,
  collapsed,
  onToggleWp,
  onUpdateDeliverable,
  onUpdateWorkPackage,
  onUpdateTask,
  onAddTask,
  onAddWorkPackage,
  onDeleteNode,
  onTriggerAiAction,
  onOpenDetails,
}) {
  return (
    <>
      {/* Level 1: Deliverable Row */}
      <tr className="bg-brand-950/30 hover:bg-brand-900/20 transition-colors font-medium border-t-2 border-brand-500/20">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded hover:bg-white/10 text-brand-400"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="p-1.5 rounded-md bg-brand-500/20 text-brand-400">
              <Layers size={14} />
            </div>
            <span className="text-xs font-mono font-bold text-brand-400">{deliv.id}</span>
            <input
              type="text"
              value={deliv.deliverableName}
              onChange={(e) => onUpdateDeliverable(dIdx, 'deliverableName', e.target.value)}
              className="bg-transparent border border-transparent hover:border-white/20 focus:border-brand-400 focus:bg-dark-900 rounded px-2 py-0.5 text-white font-bold text-sm flex-1 outline-none transition-colors"
            />
          </div>
        </td>
        <td className="py-3 px-3 text-center font-mono font-bold text-brand-300">
          {deliv.estimatedHours}h
        </td>
        <td className="py-3 px-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-400 rounded-full"
                style={{ width: `${Math.min(100, deliv.percentageOfProject || 0)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-white/60">{deliv.percentageOfProject || 0}%</span>
          </div>
        </td>
        <td className="py-3 px-3 text-xs text-white/40">—</td>
        <td className="py-3 px-3 text-xs text-white/40">—</td>
        <td className="py-3 px-3 text-xs text-white/40 text-center">—</td>
        <td className="py-3 px-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onAddWorkPackage(dIdx)}
              title="Add Work Package"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            >
              <Plus size={13} />
            </button>
            <button
              type="button"
              onClick={() => onTriggerAiAction(deliv, 'deliverable')}
              title="AI Refine / Expand"
              className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/25 text-brand-300 transition-colors"
            >
              <Sparkles size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteNode('deliverable', dIdx)}
              title="Delete Deliverable"
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Level 2: Work Packages */}
      {!isCollapsed &&
        (deliv.workPackages || []).map((wp, wIdx) => {
          const isWpCollapsed = collapsed.has(wp.id);

          return (
            <WorkPackageRowGroup
              key={wp.id || wIdx}
              wp={wp}
              dIdx={dIdx}
              wIdx={wIdx}
              isCollapsed={isWpCollapsed}
              onToggle={() => onToggleWp(wp.id)}
              onUpdateWorkPackage={onUpdateWorkPackage}
              onUpdateTask={onUpdateTask}
              onAddTask={onAddTask}
              onDeleteNode={onDeleteNode}
              onTriggerAiAction={onTriggerAiAction}
              onOpenDetails={onOpenDetails}
            />
          );
        })}
    </>
  );
}

function WorkPackageRowGroup({
  wp,
  dIdx,
  wIdx,
  isCollapsed,
  onToggle,
  onUpdateWorkPackage,
  onUpdateTask,
  onAddTask,
  onDeleteNode,
  onTriggerAiAction,
  onOpenDetails,
}) {
  return (
    <>
      <tr className="bg-purple-950/20 hover:bg-purple-900/20 transition-colors">
        <td className="py-2.5 px-4 pl-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded hover:bg-white/10 text-purple-400"
            >
              {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </button>
            <div className="p-1 rounded bg-purple-500/20 text-purple-400">
              <Box size={13} />
            </div>
            <span className="text-[11px] font-mono text-purple-400 font-bold">{wp.id}</span>
            <input
              type="text"
              value={wp.packageName}
              onChange={(e) => onUpdateWorkPackage(dIdx, wIdx, 'packageName', e.target.value)}
              className="bg-transparent border border-transparent hover:border-white/20 focus:border-purple-400 focus:bg-dark-900 rounded px-2 py-0.5 text-white/90 font-semibold text-xs flex-1 outline-none transition-colors"
            />
          </div>
        </td>
        <td className="py-2.5 px-3 text-center font-mono text-purple-300 text-xs font-semibold">
          {wp.estimatedHours}h
        </td>
        <td className="py-2.5 px-3 text-center text-xs text-white/50 font-mono">
          {wp.percentageOfDeliverable || 0}% of Deliv
        </td>
        <td className="py-2.5 px-3 text-xs text-white/40">—</td>
        <td className="py-2.5 px-3 text-xs text-white/40">—</td>
        <td className="py-2.5 px-3 text-xs text-white/40 text-center">—</td>
        <td className="py-2.5 px-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onAddTask(dIdx, wIdx)}
              title="Add Task"
              className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={() => onTriggerAiAction(wp, 'workPackage')}
              title="AI Refine"
              className="p-1 rounded-md bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 transition-colors"
            >
              <Sparkles size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteNode('workPackage', dIdx, wIdx)}
              title="Delete Work Package"
              className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>

      {/* Level 3: Tasks */}
      {!isCollapsed &&
        (wp.tasks || []).map((task, tIdx) => (
          <tr
            key={task.id || tIdx}
            className="hover:bg-white/5 transition-colors border-t border-white/5 text-xs"
          >
            <td className="py-2 px-4 pl-16">
              <div className="flex items-center gap-2">
                <CheckSquare size={12} className="text-cyan-400 flex-shrink-0" />
                <span className="text-[10px] font-mono text-cyan-400">{task.id}</span>
                <input
                  type="text"
                  value={task.taskTitle}
                  onChange={(e) => onUpdateTask(dIdx, wIdx, tIdx, 'taskTitle', e.target.value)}
                  className="bg-transparent border border-transparent hover:border-white/20 focus:border-cyan-400 focus:bg-dark-900 rounded px-1.5 py-0.5 text-white/90 text-xs flex-1 outline-none"
                />
              </div>
            </td>
            <td className="py-2 px-3 text-center">
              <input
                type="number"
                min="1"
                value={task.estimatedHours}
                onChange={(e) =>
                  onUpdateTask(dIdx, wIdx, tIdx, 'estimatedHours', Number(e.target.value) || 0)
                }
                className="w-16 text-center font-mono text-xs bg-white/5 border border-white/10 hover:border-white/30 rounded py-0.5 text-brand-300 font-bold focus:border-brand-400 outline-none"
              />
            </td>
            <td className="py-2 px-3 text-center text-white/30 text-[11px]">—</td>
            <td className="py-2 px-3">
              <select
                value={task.priority}
                onChange={(e) => onUpdateTask(dIdx, wIdx, tIdx, 'priority', e.target.value)}
                className="bg-dark-800 border border-white/10 rounded px-2 py-0.5 text-[11px] text-white/90 focus:border-brand-400 outline-none cursor-pointer"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </td>
            <td className="py-2 px-3">
              <input
                type="text"
                value={task.skillRequired}
                onChange={(e) => onUpdateTask(dIdx, wIdx, tIdx, 'skillRequired', e.target.value)}
                className="w-full bg-transparent border border-transparent hover:border-white/20 focus:border-brand-400 rounded px-1.5 py-0.5 text-purple-300 text-xs outline-none"
              />
            </td>
            <td className="py-2 px-3 text-center">
              <span
                onClick={() => onOpenDetails(task)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer border ${
                  task.riskLevel === 'Critical'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : task.riskLevel === 'High'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : task.riskLevel === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
                title="Click to view details & mitigation"
              >
                <AlertTriangle size={9} />
                {task.riskLevel || 'Low'}
              </span>
            </td>
            <td className="py-2 px-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onOpenDetails(task)}
                  title="View Specs & Acceptance Criteria"
                  className="p-1 rounded bg-white/5 hover:bg-white/15 text-white/60 hover:text-white"
                >
                  <ListCheck size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerAiAction(task, 'task')}
                  title="AI Actions"
                  className="p-1 rounded bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300"
                >
                  <Sparkles size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteNode('task', dIdx, wIdx, tIdx)}
                  title="Delete Task"
                  className="p-1 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </td>
          </tr>
        ))}
    </>
  );
}
