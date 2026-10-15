import { Globe, AlertCircle } from 'lucide-react'
import { useState } from 'react'

const isValidUrl = (str) => {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function UrlInput({ value, onChange }) {
  const [touched, setTouched] = useState(false)
  const hasError = touched && value.trim() && !isValidUrl(value.trim())

  return (
    <div className="space-y-2">
      <label htmlFor="url-input" className="block text-sm font-medium text-white/70">
        Website URL
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Globe size={16} className={`${hasError ? 'text-red-400' : 'text-white/30'}`} />
        </div>
        <input
          id="url-input"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="https://example.com/project-brief"
          className={`
            input-field pl-10
            ${hasError ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}
          `}
        />
      </div>

      {hasError && (
        <div className="flex items-center gap-2 text-red-400 text-xs mt-1">
          <AlertCircle size={12} />
          <span>Please enter a valid URL starting with https://</span>
        </div>
      )}

      <p className="text-xs text-white/30">
        The AI will extract and analyze the page content, headings, and navigation.
      </p>
    </div>
  )
}
