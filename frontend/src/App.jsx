import { useState, useCallback } from 'react'
import axios from 'axios'
import { Brain, Sparkles, AlertCircle, ChevronRight, Key } from 'lucide-react'
import InputSelector from './components/InputSelector'
import UrlInput from './components/UrlInput'
import DocumentInput from './components/DocumentInput'
import TextInput from './components/TextInput'
import Dashboard from './components/Dashboard'
import ApiKeyModal from './components/ApiKeyModal'
import { clientSideAnalyzeProject, getGeminiApiKey, setGeminiApiKey } from './services/clientLlm'

// ── Validation helpers ─────────────────────────────────────────────────────
const isValidUrl = (str) => {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isFormValid = (method, url, files, text) => {
  if (method === 'url') return isValidUrl(url.trim())
  if (method === 'document') return Array.isArray(files) ? files.length > 0 : !!files
  if (method === 'text') return text.trim().length >= 20
  return false
}

// ── Loading Steps Animation ────────────────────────────────────────────────
const LOADING_STEPS = [
  'Extracting project context & multi-file specs...',
  'Analyzing scope according to 100% Rule...',
  'Structuring Deliverables & Work Packages...',
  'Allocating tasks, effort, roles & risk factors...',
  'Finalizing 4-Tier WBS & Gantt dependencies...',
]

function LoadingScreen({ step }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 animate-fade-in">
      {/* Animated brain icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
          <Brain size={36} className="text-brand-400 animate-pulse-slow" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-ping" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-white font-semibold text-lg">Generating WBS Architecture...</p>
        <p className="text-white/50 text-sm">{LOADING_STEPS[step % LOADING_STEPS.length]}</p>
      </div>

      {/* Step progress dots */}
      <div className="flex items-center gap-2">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i <= step % LOADING_STEPS.length
                ? 'w-2 h-2 bg-brand-400'
                : 'w-1.5 h-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-white/25 max-w-xs text-center">
        Decomposing into Deliverables, Work Packages, Tasks, and risk tags adhering to the 100% rule...
      </p>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [inputMethod, setInputMethod] = useState('text')
  const [url, setUrl] = useState('')
  const [files, setFiles] = useState([])
  const [description, setDescription] = useState('')
  const [decompositionType, setDecompositionType] = useState('phase')
  const [detailLevel, setDetailLevel] = useState('standard')

  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState(null)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)

  const canSubmit = !isLoading && isFormValid(inputMethod, url, files, description)

  const handleMethodChange = (method) => {
    setInputMethod(method)
    setError('')
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsLoading(true)
    setError('')
    setResult(null)
    setLoadingStep(0)

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => s + 1)
    }, 1800)

    try {
      let analysisData = null
      let analysisMeta = null

      // First attempt: Call backend API (if running locally or hosted)
      try {
        const formData = new FormData()
        formData.append('inputMethod', inputMethod)
        formData.append('decompositionType', decompositionType)
        formData.append('detailLevel', detailLevel)

        if (inputMethod === 'url') formData.append('url', url.trim())
        if (inputMethod === 'document') {
          files.forEach((f) => formData.append('files', f))
        }
        if (inputMethod === 'text') formData.append('description', description.trim())

        const { data: response } = await axios.post('/api/projects/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 40000,
        })

        if (response.success) {
          analysisData = response.data
          analysisMeta = response.meta
        }
      } catch (apiErr) {
        // If static host returns 405 Method Not Allowed or 404 or backend is not active,
        // automatically switch to Client-Side Direct Cloud AI!
        const status = apiErr.response?.status
        console.log(`[analyze] Backend unavailable (status: ${status || 'network'}), using Direct AI...`)

        const directResult = await clientSideAnalyzeProject(
          inputMethod,
          { url: url.trim(), files, description: description.trim() },
          { decompositionType, detailLevel }
        )

        analysisData = directResult
        analysisMeta = {
          inputMethod,
          decompositionType,
          detailLevel,
          mode: 'Direct Cloud AI Engine',
          generatedAt: new Date().toISOString(),
        }
      }

      if (analysisData) {
        setResult(analysisData)
        setMeta(analysisMeta)
      } else {
        throw new Error('Analysis could not be generated. Please try again.')
      }
    } catch (err) {
      console.error('[App] Generation Error:', err)
      const msg =
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred. Please try again.'
      setError(msg)
    } finally {
      clearInterval(stepInterval)
      setIsLoading(false)
    }
  }, [canSubmit, inputMethod, url, files, description, decompositionType, detailLevel])

  const handleReset = () => {
    setResult(null)
    setError('')
    setMeta(null)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white">WBS Engine</span>
              <span className="text-white/30 text-xs ml-2 hidden sm:inline">AI Project Breakdown</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs transition-colors cursor-pointer"
              title="Configure your Gemini API key"
            >
              <Key size={13} className="text-amber-400" />
              <span>API Key</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-white/30 hidden sm:flex">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Powered by Gemini</span>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <ApiKeyModal onClose={() => setIsKeyModalOpen(false)} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero Section */}
        {!result && !isLoading && (
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/15 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
              <Sparkles size={14} />
              AI-Powered Project Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
              Turn Any Brief Into a{' '}
              <span className="gradient-text">Complete WBS</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
              Input your project via URL, document, or text. Get milestones, tasks,
              time estimates, and skill requirements — instantly.
            </p>
          </div>
        )}

        {/* Input Form */}
        {!result && (
          <div className={`max-w-3xl mx-auto ${isLoading ? '' : 'animate-slide-up'}`}>
            {isLoading ? (
              <div className="glass-card p-8">
                <LoadingScreen step={loadingStep} />
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="glass-card p-6 md:p-8 space-y-6">
                  {/* Input Method Selector */}
                  <div>
                    <p className="text-sm font-medium text-white/60 mb-3">
                      Choose Input Method
                    </p>
                    <InputSelector value={inputMethod} onChange={handleMethodChange} />
                  </div>

                  {/* Dynamic Input Field */}
                  <div className="animate-fade-in" key={inputMethod}>
                    {inputMethod === 'url' && (
                      <UrlInput value={url} onChange={setUrl} />
                    )}
                    {inputMethod === 'document' && (
                      <DocumentInput files={files} onChange={setFiles} />
                    )}
                    {inputMethod === 'text' && (
                      <TextInput
                        value={description}
                        onChange={setDescription}
                        decompositionType={decompositionType}
                        onDecompositionChange={setDecompositionType}
                        detailLevel={detailLevel}
                        onDetailLevelChange={setDetailLevel}
                      />
                    )}
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                      <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-medium text-sm">Analysis Failed</p>
                        <p className="text-red-400/70 text-xs mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    id="generate-wbs-btn"
                    type="submit"
                    disabled={!canSubmit}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
                  >
                    <Brain size={18} />
                    Generate WBS
                    <ChevronRight size={16} className="ml-1" />
                  </button>

                  <p className="text-center text-xs text-white/25">
                    Analysis typically takes 10–30 seconds depending on project complexity
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Result Dashboard */}
        {result && !isLoading && (
          <div className="animate-slide-up">
            <Dashboard data={result} onReset={handleReset} meta={meta} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 py-6 text-center text-white/20 text-xs">
        WBS Engine · AI Project Breakdown & Task Allocation · Built with React + Node.js + Gemini
      </footer>
    </div>
  )
}
