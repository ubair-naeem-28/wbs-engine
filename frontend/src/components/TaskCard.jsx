import { Clock, Star, Code2 } from 'lucide-react'

const PRIORITY_STYLES = {
  Critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const PRIORITY_DOTS = {
  Critical: 'bg-red-400',
  High: 'bg-orange-400',
  Medium: 'bg-amber-400',
  Low: 'bg-emerald-400',
}

export default function TaskCard({ task, index }) {
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium
  const dotStyle = PRIORITY_DOTS[task.priority] || PRIORITY_DOTS.Medium

  return (
    <div
      className="glass-card p-4 hover:bg-white/8 hover:border-white/20 transition-all duration-200 group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors leading-tight">
          {task.taskTitle}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyle}`} />
          <span className={`badge border text-xs ${priorityStyle}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/45 leading-relaxed mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Footer Meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Clock size={11} className="text-brand-400" />
          <span className="font-mono font-medium text-brand-300">{task.estimatedHours}h</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Code2 size={11} className="text-purple-400" />
          <span className="text-white/60">{task.skillRequired}</span>
        </div>
      </div>
    </div>
  )
}
