import { useState } from 'react'
import { Key, CheckCircle, ExternalLink, Shield } from 'lucide-react'
import { getGeminiApiKey, setGeminiApiKey } from '../services/clientLlm'

export default function ApiKeyModal({ onClose }) {
  const [key, setKey] = useState(() => getGeminiApiKey())
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setGeminiApiKey(key)
    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 space-y-4 border border-brand-500/40 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gemini API Key Settings</h3>
              <p className="text-white/40 text-xs">Required for Cloud AI breakdown on live site</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-white/70">
              Google Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value)
                setSaved(false)
              }}
              placeholder="AIzaSy..."
              className="input-field text-xs py-2.5 font-mono"
            />
            {key.trim() && !key.trim().startsWith('AIzaSy') && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                ⚠️ Gemini API keys from Google AI Studio always start with <strong>AIzaSy</strong>. Keys starting with <code>AQ.</code> or service tokens are rejected by Google.
              </p>
            )}
            {key.trim() && key.trim().startsWith('AIzaSy') && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} /> Valid Google AI Studio Key format.
              </p>
            )}
            {!key.trim() && (
              <p className="text-[11px] text-white/40 flex items-center gap-1">
                <Shield size={11} className="text-brand-400" />
                No key needed! The built-in WBS decomposition engine generates complete hierarchies offline.
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/60 space-y-1">
            <p className="font-medium text-white/80">How to get a 100% Free Gemini API key:</p>
            <ol className="text-[11px] list-decimal list-inside space-y-0.5 text-white/70">
              <li>Open Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Click <strong>&quot;Create API Key&quot;</strong> and copy your key (starts with <code>AIzaSy</code>)</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium text-xs mt-1"
            >
              Get Free Gemini API Key from Google AI Studio <ExternalLink size={11} />
            </a>
          </div>

          {saved && (
            <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-xs flex items-center gap-2">
              <CheckCircle size={14} /> Settings updated successfully!
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            {key.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setKey('')
                  setGeminiApiKey('')
                  setSaved(true)
                }}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Clear Key
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Close
              </button>
              <button
                type="submit"
                className="btn-primary py-2 px-5 text-xs font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
