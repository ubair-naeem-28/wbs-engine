import { useMemo } from 'react'
import { Calendar, Clock, Flag, AlertTriangle, Layers } from 'lucide-react'

export default function GanttView({ data }) {
  // Compute timeline scheduling (8 hours = 1 working day)
  const scheduledData = useMemo(() => {
    let currentDayCursor = 1
    const deliverables = []

    (data.deliverables || []).forEach((deliv, dIdx) => {
      const delivStartDay = currentDayCursor
      const tasksList = []

      ;(deliv.workPackages || []).forEach((wp) => {
        ;(wp.tasks || []).forEach((task) => {
          const daysNeeded = Math.max(1, Math.ceil((task.estimatedHours || 8) / 8))
          const taskStart = currentDayCursor
          const taskEnd = currentDayCursor + daysNeeded - 1

          tasksList.push({
            ...task,
            wpName: wp.packageName,
            startDay: taskStart,
            endDay: taskEnd,
            days: daysNeeded,
          })

          // Advance cursor slightly to simulate realistic task sequence & overlap
          currentDayCursor = Math.max(currentDayCursor + 1, taskEnd)
        })
      })

      const delivEndDay = Math.max(delivStartDay, currentDayCursor)
      deliverables.push({
        id: deliv.id || `DEL-${dIdx + 1}`,
        name: deliv.deliverableName,
        startDay: delivStartDay,
        endDay: delivEndDay,
        totalDays: delivEndDay - delivStartDay + 1,
        tasks: tasksList,
      })
    })

    const totalProjectDays = Math.max(10, currentDayCursor)
    const totalWeeks = Math.ceil(totalProjectDays / 5)

    return { deliverables, totalProjectDays, totalWeeks }
  }, [data])

  const { deliverables, totalProjectDays, totalWeeks } = scheduledData

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1 text-xs text-white/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-white/80">
            <Calendar size={13} className="text-brand-400" />
            Estimated Duration: <strong className="text-brand-300 font-mono">{totalProjectDays} working days (~{totalWeeks} weeks)</strong>
          </span>
          <span className="text-white/20">|</span>
          <span>Standard: 8h/day, 40h/week</span>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-dark-900/90 backdrop-blur-md shadow-2xl">
        <div className="min-w-[900px]">
          {/* Timeline Weeks / Days Header */}
          <div className="flex border-b border-white/10 bg-white/5 text-[11px] font-bold text-white/50 sticky top-0 z-10">
            <div className="w-80 p-3 border-r border-white/10 flex-shrink-0">
              Deliverable / Task Name
            </div>
            <div className="flex-1 flex">
              {Array.from({ length: totalWeeks }).map((_, wIdx) => (
                <div
                  key={wIdx}
                  className="flex-1 p-3 text-center border-r border-white/5 font-mono text-brand-300/80"
                >
                  Week {wIdx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-white/5 text-xs">
            {deliverables.map((deliv, dIdx) => (
              <div key={deliv.id || dIdx} className="space-y-0">
                {/* Deliverable Summary Bar Row */}
                <div className="flex items-center bg-brand-950/40 py-2.5 border-t border-brand-500/20">
                  <div className="w-80 px-4 font-bold text-white flex items-center gap-2 truncate border-r border-white/10 flex-shrink-0">
                    <Layers size={13} className="text-brand-400 flex-shrink-0" />
                    <span className="truncate">{deliv.name}</span>
                  </div>
                  <div className="flex-1 relative h-6 px-2 flex items-center">
                    <div
                      className="absolute h-3 rounded-full bg-brand-500/40 border border-brand-400/60 shadow-sm"
                      style={{
                        left: `${((deliv.startDay - 1) / totalProjectDays) * 100}%`,
                        width: `${Math.max(2, (deliv.totalDays / totalProjectDays) * 100)}%`,
                      }}
                      title={`${deliv.name}: Day ${deliv.startDay} - Day ${deliv.endDay}`}
                    />
                  </div>
                </div>

                {/* Individual Task Bars */}
                {deliv.tasks.map((task, tIdx) => {
                  const leftPercent = ((task.startDay - 1) / totalProjectDays) * 100
                  const widthPercent = Math.max(1.5, (task.days / totalProjectDays) * 100)

                  const barColor =
                    task.priority === 'Critical'
                      ? 'bg-red-500/70 border-red-400 text-red-100'
                      : task.priority === 'High'
                      ? 'bg-orange-500/70 border-orange-400 text-orange-100'
                      : task.priority === 'Low'
                      ? 'bg-emerald-500/70 border-emerald-400 text-emerald-100'
                      : 'bg-indigo-500/70 border-indigo-400 text-indigo-100'

                  return (
                    <div
                      key={task.id || tIdx}
                      className="flex items-center hover:bg-white/5 transition-colors py-2"
                    >
                      <div className="w-80 pl-8 pr-3 flex items-center justify-between text-white/80 border-r border-white/10 flex-shrink-0">
                        <span className="truncate text-[11px] font-medium" title={task.taskTitle}>
                          {task.taskTitle}
                        </span>
                        <span className="text-[10px] font-mono text-white/40 flex-shrink-0 ml-2">
                          {task.estimatedHours}h
                        </span>
                      </div>
                      <div className="flex-1 relative h-6 px-2 flex items-center">
                        <div
                          className={`absolute h-5 rounded-md border flex items-center px-2 text-[10px] font-medium shadow truncate transition-all ${barColor}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          title={`${task.taskTitle} (${task.estimatedHours}h, ${task.skillRequired})`}
                        >
                          <span className="truncate">{task.skillRequired}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
