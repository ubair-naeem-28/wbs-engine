import { useState } from 'react'
import { ChevronDown, ChevronUp, Flag, Clock } from 'lucide-react'
import TaskCard from './TaskCard'

const MILESTONE_COLORS = [
  'from-brand-600/20 to-brand-800/10 border-brand-500/20',
  'from-purple-600/20 to-purple-800/10 border-purple-500/20',
  'from-cyan-600/20 to-cyan-800/10 border-cyan-500/20',
  'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20',
  'from-orange-600/20 to-orange-800/10 border-orange-500/20',
  'from-pink-600/20 to-pink-800/10 border-pink-500/20',
  'from-violet-600/20 to-violet-800/10 border-violet-500/20',
]

const MILESTONE_ACCENT = [
  'text-brand-400',
  'text-purple-400',
  'text-cyan-400',
  'text-emerald-400',
  'text-orange-400',
  'text-pink-400',
  'text-violet-400',
]

export default function MilestoneCard({ milestone, index, isExpanded, onToggle }) {
  const colorClass = MILESTONE_COLORS[index % MILESTONE_COLORS.length]
  const accentClass = MILESTONE_ACCENT[index % MILESTONE_ACCENT.length]

  const totalHours = milestone.tasks?.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0) || 0
  const taskCount = milestone.tasks?.length || 0

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colorClass} backdrop-blur-sm transition-all duration-300`}>
      {/* Milestone Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:brightness-110 transition-all"
      >
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm ${accentClass}`}>
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm md:text-base truncate">
            {milestone.milestoneName}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-xs text-white/45">
              <Flag size={10} />
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
            <span className={`flex items-center gap-1 text-xs font-mono font-medium ${accentClass}`}>
              <Clock size={10} />
              {totalHours}h total
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 text-white/60">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Tasks Grid */}
      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="h-px bg-white/10 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {milestone.tasks?.map((task, taskIdx) => (
              <TaskCard key={taskIdx} task={task} index={taskIdx} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
