import { Globe, FileText, AlignLeft } from 'lucide-react'

const METHODS = [
  {
    id: 'text',
    label: 'Text Brief',
    icon: AlignLeft,
    desc: 'Type or paste a project description',
  },
  {
    id: 'url',
    label: 'Website URL',
    icon: Globe,
    desc: 'Scrape content from any website',
  },
  {
    id: 'document',
    label: 'Upload Document',
    icon: FileText,
    desc: 'Upload a PDF or Word document',
  },
]

export default function InputSelector({ value, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {METHODS.map((method) => {
        const Icon = method.icon
        const isActive = value === method.id

        return (
          <button
            key={method.id}
            type="button"
            id={`tab-${method.id}`}
            onClick={() => onChange(method.id)}
            className={`
              flex items-center gap-3 px-5 py-4 rounded-xl border text-left flex-1
              transition-all duration-200 cursor-pointer group
              ${isActive
                ? 'bg-brand-600/20 border-brand-500/60 shadow-lg shadow-brand-900/30'
                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }
            `}
          >
            <div className={`
              p-2 rounded-lg transition-colors duration-200
              ${isActive ? 'bg-brand-500/30 text-brand-300' : 'bg-white/10 text-white/50 group-hover:text-white/70'}
            `}>
              <Icon size={18} />
            </div>
            <div>
              <p className={`font-semibold text-sm ${isActive ? 'text-brand-300' : 'text-white/70'}`}>
                {method.label}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{method.desc}</p>
            </div>
            {isActive && (
              <div className="ml-auto w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 animate-pulse-slow" />
            )}
          </button>
        )
      })}
    </div>
  )
}
