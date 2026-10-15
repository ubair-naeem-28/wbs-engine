import { useState, useRef, useMemo } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Box,
  CheckSquare,
  Clock,
  AlertTriangle,
} from 'lucide-react'

export default function TreeView({ data, onSelectNode, onTriggerAiAction }) {
  const [zoom, setZoom] = useState(1)
  const [collapsedNodes, setCollapsedNodes] = useState(new Set())
  const containerRef = useRef(null)

  const toggleCollapse = (nodeId, e) => {
    e.stopPropagation()
    setCollapsedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const handleZoom = (delta) => {
    setZoom((z) => Math.min(Math.max(0.5, z + delta), 1.8))
  }

  const resetZoom = () => setZoom(1)

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-dark-900/90 backdrop-blur-md shadow-2xl">
      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-dark-800/90 border border-white/10 rounded-xl p-1.5 shadow-lg">
        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono px-2"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-3 bg-dark-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          <span>Deliverable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Work Package</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span>Task</span>
        </div>
      </div>

      {/* Scrollable / Zoomable Canvas */}
      <div
        ref={containerRef}
        className="w-full min-h-[600px] overflow-auto p-12 transition-transform duration-100 flex justify-center"
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200 inline-flex flex-col items-center space-y-12"
        >
          {/* Level 0: Project Root Node */}
          <div className="relative group">
            <div className="w-80 p-5 rounded-2xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border-2 border-brand-500/50 shadow-xl shadow-brand-950/50 backdrop-blur-md text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                Project Root (100% Scope)
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                {data.projectName || data.projectType}
              </h2>
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs">
                <span className="text-white/60 flex items-center gap-1">
                  <Clock size={12} className="text-brand-400" />
                  <strong className="text-white font-mono">{data.totalEstimatedHours}h</strong>
                </span>
                <span className="text-white/40">·</span>
                <span className="text-amber-400 font-semibold">{data.complexity} Complexity</span>
              </div>
            </div>
          </div>

          {/* Connective Line Down from Root */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-brand-500 to-white/20" />

          {/* Level 1: Deliverables Row */}
          <div className="flex items-start justify-center gap-8 flex-wrap">
            {(data.deliverables || []).map((deliv, dIdx) => {
              const isDelivCollapsed = collapsedNodes.has(deliv.id);
              const wpCount = deliv.workPackages?.length || 0;

              return (
                <div key={deliv.id || dIdx} className="flex flex-col items-center">
                  {/* Deliverable Card */}
                  <div
                    onClick={() => onSelectNode && onSelectNode(deliv, 'deliverable')}
                    className="w-72 p-4 rounded-xl bg-slate-900/90 border border-brand-500/30 hover:border-brand-400/70 shadow-lg hover:shadow-brand-500/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
                          <Layers size={14} />
                        </span>
                        <span className="text-[11px] font-mono text-brand-400 font-bold">
                          {deliv.id || `DEL-${dIdx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {deliv.percentageOfProject || 0}%
                        </span>
                        {wpCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => toggleCollapse(deliv.id, e)}
                            className="p-1 rounded hover:bg-white/10 text-white/50"
                          >
                            {isDelivCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-sm line-clamp-2">
                      {deliv.deliverableName}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-white/50 mt-3 pt-2 border-t border-white/5">
                      <span>{wpCount} Work Packages</span>
                      <span className="font-mono text-white/80 font-medium">{deliv.estimatedHours}h</span>
                    </div>

                    {/* AI action trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerAiAction && onTriggerAiAction(deliv, 'deliverable');
                      }}
                      className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 text-[11px] font-medium transition-colors"
                    >
                      <Sparkles size={11} /> AI Expand / Risks
                    </button>
                  </div>

                  {/* Level 2: Work Packages under this Deliverable */}
                  {!isDelivCollapsed && wpCount > 0 && (
                    <div className="flex flex-col items-center mt-4">
                      <div className="w-0.5 h-6 bg-white/20" />
                      <div className="flex items-start justify-center gap-4 flex-wrap pt-2 border-t border-white/15">
                        {deliv.workPackages.map((wp, wIdx) => {
                          const isWpCollapsed = collapsedNodes.has(wp.id);
                          const taskCount = wp.tasks?.length || 0;

                          return (
                            <div key={wp.id || wIdx} className="flex flex-col items-center">
                              {/* Work Package Card */}
                              <div
                                onClick={() => onSelectNode && onSelectNode(wp, 'workPackage')}
                                className="w-60 p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 hover:border-purple-400 shadow-md transition-all cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Box size={13} className="text-purple-400" />
                                    <span className="text-[10px] font-mono text-purple-400 font-bold">
                                      {wp.id || `WP-${dIdx + 1}.${wIdx + 1}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                      {wp.estimatedHours}h
                                    </span>
                                    {taskCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => toggleCollapse(wp.id, e)}
                                        className="p-0.5 rounded hover:bg-white/10 text-white/50"
                                      >
                                        {isWpCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <h4 className="font-semibold text-white/90 text-xs line-clamp-2">
                                  {wp.packageName}
                                </h4>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTriggerAiAction && onTriggerAiAction(wp, 'workPackage');
                                  }}
                                  className="mt-2 w-full flex items-center justify-center gap-1 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] transition-colors"
                                >
                                  <Sparkles size={10} /> AI Refine
                                </button>
                              </div>

                              {/* Level 3: Tasks under this Work Package */}
                              {!isWpCollapsed && taskCount > 0 && (
                                <div className="flex flex-col items-center mt-3">
                                  <div className="w-0.5 h-4 bg-white/15" />
                                  <div className="space-y-2 mt-1">
                                    {wp.tasks.map((task, tIdx) => (
                                      <div
                                        key={task.id || tIdx}
                                        onClick={() => onSelectNode && onSelectNode(task, 'task')}
                                        className="w-56 p-2.5 rounded-lg bg-dark-900 border border-cyan-500/20 hover:border-cyan-400/60 shadow-sm transition-all cursor-pointer"
                                      >
                                        <div className="flex items-start justify-between gap-1 mb-1">
                                          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono font-medium">
                                            <CheckSquare size={11} />
                                            <span>{task.id || `TSK-${tIdx + 1}`}</span>
                                          </div>
                                          <span className="text-[10px] font-mono text-white/70">
                                            {task.estimatedHours}h
                                          </span>
                                        </div>
                                        <p className="font-medium text-xs text-white/90 line-clamp-2 leading-snug">
                                          {task.taskTitle}
                                        </p>
                                        <div className="flex items-center justify-between text-[10px] text-white/40 mt-1.5 pt-1 border-t border-white/5">
                                          <span className="truncate max-w-[120px] text-purple-300/80">
                                            {task.skillRequired}
                                          </span>
                                          {task.riskLevel && task.riskLevel !== 'Low' && (
                                            <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                                              <AlertTriangle size={9} />
                                              {task.riskLevel}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
