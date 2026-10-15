import { useState, useCallback } from 'react'
import {
  BarChart3,
  Clock,
  Layers,
  Zap,
  Download,
  RefreshCw,
  CheckCircle2,
  GitBranch,
  Table as TableIcon,
  Calendar,
  Grid,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Printer,
  Globe,
  Share2,
} from 'lucide-react'
import TreeView from './views/TreeView'
import OutlineView from './views/OutlineView'
import GanttView from './views/GanttView'
import MilestoneCard from './MilestoneCard'
import NodeActionModal from './NodeActionModal'
import {
  exportToJson,
  exportToCsv,
  exportToJiraCsv,
  exportToMsProjectXml,
  exportToStandaloneHtml,
  exportToPrintPdf,
} from '../utils/exporters'

const COMPLEXITY_STYLES = {
  Low: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  Medium: { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-400' },
  High: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-400' },
  Extreme: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-300', dot: 'bg-red-400' },
}

/**
 * Recalculates all hours and 100% rule percentages for the entire WBS tree.
 */
const recalculateRollups = (wbs) => {
  let totalProjectHours = 0

  const deliverables = (wbs.deliverables || []).map((deliv) => {
    let delivHours = 0
    const workPackages = (deliv.workPackages || []).map((wp) => {
      let wpHours = 0
      const tasks = (wp.tasks || []).map((t) => {
        const h = Math.max(1, Number(t.estimatedHours) || 1)
        wpHours += h
        return { ...t, estimatedHours: h }
      })
      delivHours += wpHours
      return { ...wp, estimatedHours: wpHours, tasks }
    })
    totalProjectHours += delivHours
    return { ...deliv, estimatedHours: delivHours, workPackages }
  })

  // Calculate percentages
  const balancedDeliverables = deliverables.map((deliv) => {
    const delivPercent = totalProjectHours > 0
      ? Math.round((deliv.estimatedHours / totalProjectHours) * 100)
      : 0
    const workPackages = deliv.workPackages.map((wp) => {
      const wpPercent = deliv.estimatedHours > 0
        ? Math.round((wp.estimatedHours / deliv.estimatedHours) * 100)
        : 0
      return { ...wp, percentageOfDeliverable: wpPercent }
    })
    return { ...deliv, percentageOfProject: delivPercent, workPackages }
  })

  return {
    ...wbs,
    totalEstimatedHours: totalProjectHours,
    deliverables: balancedDeliverables,
    milestones: balancedDeliverables.map((deliv) => ({
      milestoneName: deliv.deliverableName,
      estimatedHours: deliv.estimatedHours,
      tasks: deliv.workPackages.flatMap((wp) => wp.tasks),
    })),
  }
}

export default function Dashboard({ data: initialData, onReset, meta }) {
  const [wbsData, setWbsData] = useState(() => recalculateRollups(initialData))
  const [activeView, setActiveView] = useState('outline') // 'outline' | 'tree' | 'gantt' | 'cards'
  const [exportOpen, setExportOpen] = useState(false)
  const [aiModalNode, setAiModalNode] = useState(null)
  const [aiModalType, setAiModalType] = useState('')

  // ── Mutators with automatic 100% Rule Recalculation ───────────────────────
  const updateTask = useCallback((dIdx, wIdx, tIdx, field, value) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))
      if (clone.deliverables?.[dIdx]?.workPackages?.[wIdx]?.tasks?.[tIdx]) {
        clone.deliverables[dIdx].workPackages[wIdx].tasks[tIdx][field] = value
      }
      return recalculateRollups(clone)
    })
  }, [])

  const updateWorkPackage = useCallback((dIdx, wIdx, field, value) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))
      if (clone.deliverables?.[dIdx]?.workPackages?.[wIdx]) {
        clone.deliverables[dIdx].workPackages[wIdx][field] = value
      }
      return recalculateRollups(clone)
    })
  }, [])

  const updateDeliverable = useCallback((dIdx, field, value) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))
      if (clone.deliverables?.[dIdx]) {
        clone.deliverables[dIdx][field] = value
      }
      return recalculateRollups(clone)
    })
  }, [])

  const addTask = useCallback((dIdx, wIdx) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))
      const targetWp = clone.deliverables?.[dIdx]?.workPackages?.[wIdx]
      if (targetWp) {
        const nextId = `TSK-${dIdx + 1}.${wIdx + 1}.${(targetWp.tasks?.length || 0) + 1}`
        targetWp.tasks = targetWp.tasks || []
        targetWp.tasks.push({
          id: nextId,
          taskTitle: 'New Task',
          description: 'Description of the newly created task.',
          estimatedHours: 8,
          priority: 'Medium',
          skillRequired: 'Engineer',
          riskLevel: 'Low',
          riskMitigation: 'Standard operating procedures.',
          acceptanceCriteria: ['Task requirements completed', 'Reviewed and tested'],
        })
      }
      return recalculateRollups(clone)
    })
  }, [])

  const addWorkPackage = useCallback((dIdx) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))
      const targetDeliv = clone.deliverables?.[dIdx]
      if (targetDeliv) {
        const nextWpId = `WP-${dIdx + 1}.${(targetDeliv.workPackages?.length || 0) + 1}`
        targetDeliv.workPackages = targetDeliv.workPackages || []
        targetDeliv.workPackages.push({
          id: nextWpId,
          packageName: 'New Work Package',
          description: '',
          estimatedHours: 16,
          tasks: [
            {
              id: `${nextWpId}.1`,
              taskTitle: 'Initial Implementation Task',
              description: 'First task for this work package.',
              estimatedHours: 16,
              priority: 'Medium',
              skillRequired: 'Specialist',
              riskLevel: 'Low',
            },
          ],
        })
      }
      return recalculateRollups(clone)
    })
  }, [])

  const deleteNode = useCallback((type, dIdx, wIdx, tIdx) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))
      if (type === 'deliverable') {
        clone.deliverables.splice(dIdx, 1)
      } else if (type === 'workPackage') {
        clone.deliverables[dIdx].workPackages.splice(wIdx, 1)
      } else if (type === 'task') {
        clone.deliverables[dIdx].workPackages[wIdx].tasks.splice(tIdx, 1)
      }
      return recalculateRollups(clone)
    })
  }, [])

  // ── Apply Node-Level AI Action to Tree ────────────────────────────────────
  const handleApplyAiAction = useCallback((action, targetNode, aiResult) => {
    setWbsData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev))

      // Locate target node in tree
      clone.deliverables?.forEach((deliv, dIdx) => {
        if (targetNode.id === deliv.id && action === 'expand' && aiResult.newTasks) {
          // Append new work package containing generated tasks
          const wpId = `WP-${dIdx + 1}.${(deliv.workPackages?.length || 0) + 1}`
          deliv.workPackages.push({
            id: wpId,
            packageName: `AI Expanded: ${deliv.deliverableName}`,
            estimatedHours: aiResult.newTasks.reduce((s, t) => s + (t.estimatedHours || 8), 0),
            tasks: aiResult.newTasks.map((t, idx) => ({
              ...t,
              id: `${wpId}.${idx + 1}`,
            })),
          })
        }

        deliv.workPackages?.forEach((wp, wIdx) => {
          if (targetNode.id === wp.id && action === 'expand' && aiResult.newTasks) {
            wp.tasks = wp.tasks || []
            aiResult.newTasks.forEach((t, idx) => {
              wp.tasks.push({
                ...t,
                id: `${wp.id}.${wp.tasks.length + 1}`,
              })
            })
          }

          wp.tasks?.forEach((task) => {
            if (targetNode.id === task.id) {
              if (action === 'suggest_risks' && aiResult.risks?.[0]) {
                task.riskLevel = aiResult.risks[0].severity || 'High'
                task.riskMitigation = aiResult.risks[0].mitigationStrategy || task.riskMitigation
              }
              if (action === 'acceptance_criteria' && aiResult.acceptanceCriteria) {
                task.acceptanceCriteria = aiResult.acceptanceCriteria
              }
            }
          })
        })
      })

      return recalculateRollups(clone)
    })
  }, [])

  const complexityStyle = COMPLEXITY_STYLES[wbsData.complexity] || COMPLEXITY_STYLES.Medium
  const totalTasks = (wbsData.deliverables || []).reduce(
    (sum, d) => sum + (d.workPackages || []).reduce((wSum, wp) => wSum + (wp.tasks?.length || 0), 0),
    0
  )

  const skills = [
    ...new Set(
      (wbsData.deliverables || []).flatMap((d) =>
        (d.workPackages || []).flatMap((wp) => (wp.tasks || []).map((t) => t.skillRequired))
      ).filter(Boolean)
    ),
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">
              {wbsData.projectName || wbsData.projectType}
            </h1>
            <p className="text-white/40 text-xs">
              4-Tier WBS Structure · 100% Scope Balance Verified
              {meta && ` · Extracted in ${meta.decompositionType || 'phase'} mode`}
            </p>
          </div>
        </div>

        {/* Action Controls & Export Dropdown */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5 shadow-lg shadow-brand-950/40"
            >
              <Download size={14} />
              Export & Share
              <ChevronDown size={13} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportOpen && (
              <div
                onMouseLeave={() => setExportOpen(false)}
                className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-900 border border-white/15 p-2 shadow-2xl z-50 space-y-1 animate-fade-in text-xs"
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                  Select Export Format:
                </div>

                <button
                  type="button"
                  onClick={() => { exportToCsv(wbsData); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <FileSpreadsheet size={14} className="text-green-400" />
                  <div>
                    <div className="font-semibold">CSV / Excel Format</div>
                    <div className="text-[10px] text-white/40">Hierarchical rows & hours</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { exportToJiraCsv(wbsData); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Share2 size={14} className="text-blue-400" />
                  <div>
                    <div className="font-semibold">Jira / Trello Import CSV</div>
                    <div className="text-[10px] text-white/40">Epics, Stories & Subtasks</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { exportToMsProjectXml(wbsData); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <FileCode size={14} className="text-red-400" />
                  <div>
                    <div className="font-semibold">Microsoft Project (XML)</div>
                    <div className="text-[10px] text-white/40">Native MSPDI schedule format</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { exportToStandaloneHtml(wbsData); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Globe size={14} className="text-cyan-400" />
                  <div>
                    <div className="font-semibold">Interactive HTML Embed</div>
                    <div className="text-[10px] text-white/40">Offline shareable presentation</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { exportToJson(wbsData); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Download size={14} className="text-purple-400" />
                  <div>
                    <div className="font-semibold">Structured JSON</div>
                    <div className="text-[10px] text-white/40">Complete WBS tree data</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { exportToPrintPdf(); setExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left border-t border-white/5 pt-2"
                >
                  <Printer size={14} className="text-amber-400" />
                  <div>
                    <div className="font-semibold">Printable PDF Report</div>
                    <div className="text-[10px] text-white/40">Clean printable executive doc</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <RefreshCw size={13} />
            New Brief
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers size={13} className="text-brand-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Project Scope</span>
          </div>
          <p className="text-white font-bold text-lg leading-tight truncate">{wbsData.projectType}</p>
          <p className="text-xs text-white/40 mt-1">{wbsData.deliverables?.length || 0} Deliverables</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={13} className="text-brand-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Complexity</span>
          </div>
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${complexityStyle.bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${complexityStyle.dot}`} />
            <span className={`font-bold text-xs ${complexityStyle.text}`}>{wbsData.complexity}</span>
          </div>
          <p className="text-xs text-white/40 mt-1">AI Confidence: {wbsData.confidenceScore || 95}%</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock size={13} className="text-brand-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Total Effort</span>
          </div>
          <p className="text-white font-bold text-2xl font-mono">
            {wbsData.totalEstimatedHours}<span className="text-white/40 text-sm ml-1 font-normal">h</span>
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            ~{Math.ceil(wbsData.totalEstimatedHours / 40)} weeks (1 FTE)
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart3 size={13} className="text-brand-400" />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">100% Rule Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold text-xl">100%</span>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] font-bold border border-green-500/30">
              Balanced
            </span>
          </div>
          <p className="text-xs text-white/40 mt-1">{totalTasks} granular tasks tracked</p>
        </div>
      </div>

      {/* Required Roles & Skills Pills */}
      {skills.length > 0 && (
        <div className="glass-card p-3.5 flex items-center gap-3 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider whitespace-nowrap">
            Assigned Roles:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-brand-300 text-[11px] font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Multi-View Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3">
        <div className="flex items-center p-1 rounded-xl bg-dark-900 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveView('outline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'outline'
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <TableIcon size={14} />
            Outline Tree Table
          </button>

          <button
            type="button"
            onClick={() => setActiveView('tree')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'tree'
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <GitBranch size={14} />
            Mind Map / Tree View
          </button>

          <button
            type="button"
            onClick={() => setActiveView('gantt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'gantt'
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            Gantt Timeline
          </button>

          <button
            type="button"
            onClick={() => setActiveView('cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'cards'
                ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Grid size={14} />
            Milestone Cards
          </button>
        </div>

        <div className="text-xs text-white/40 flex items-center gap-1.5">
          <Sparkles size={12} className="text-brand-400" />
          <span>Click any node to invoke inline AI refinement</span>
        </div>
      </div>

      {/* Active View Container */}
      <div className="pt-2">
        {activeView === 'outline' && (
          <OutlineView
            data={wbsData}
            onUpdateTask={updateTask}
            onUpdateWorkPackage={updateWorkPackage}
            onUpdateDeliverable={updateDeliverable}
            onAddTask={addTask}
            onAddWorkPackage={addWorkPackage}
            onDeleteNode={deleteNode}
            onTriggerAiAction={(node, type) => {
              setAiModalNode(node)
              setAiModalType(type)
            }}
          />
        )}

        {activeView === 'tree' && (
          <TreeView
            data={wbsData}
            onSelectNode={(node, type) => {
              setAiModalNode(node)
              setAiModalType(type)
            }}
            onTriggerAiAction={(node, type) => {
              setAiModalNode(node)
              setAiModalType(type)
            }}
          />
        )}

        {activeView === 'gantt' && <GanttView data={wbsData} />}

        {activeView === 'cards' && (
          <div className="space-y-4">
            {(wbsData.milestones || []).map((milestone, index) => (
              <MilestoneCard
                key={index}
                milestone={milestone}
                index={index}
                isExpanded={true}
                onToggle={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Node AI Refinement Modal */}
      {aiModalNode && (
        <NodeActionModal
          node={aiModalNode}
          nodeType={aiModalType}
          onClose={() => setAiModalNode(null)}
          onApplyChanges={handleApplyAiAction}
        />
      )}
    </div>
  )
}
