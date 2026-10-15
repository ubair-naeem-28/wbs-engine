import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, Image as ImageIcon, Table, FileSpreadsheet } from 'lucide-react'

const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.csv',
  '.txt',
  '.md',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (fileName = '') => {
  const ext = fileName.toLowerCase()
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) {
    return <FileSpreadsheet size={18} className="text-emerald-400" />
  }
  if (/\.(png|jpg|jpeg|webp)$/.test(ext)) {
    return <ImageIcon size={18} className="text-purple-400" />
  }
  return <FileText size={18} className="text-blue-400" />
}

export default function DocumentInput({ files = [], file, onChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Normalize single file prop vs multiple files prop
  const currentFiles = Array.isArray(files) && files.length > 0
    ? files
    : file
    ? [file]
    : []

  const handleAddFiles = (incomingList) => {
    setError('')
    if (!incomingList || incomingList.length === 0) return

    const validFiles = []
    for (let i = 0; i < incomingList.length; i++) {
      const f = incomingList[i]
      const ext = `.${f.name.split('.').pop().toLowerCase()}`

      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(`"${f.name}" has an unsupported format. Use PDF, DOCX, XLSX, CSV, TXT, MD, PNG, or JPG.`)
        continue
      }

      if (f.size > 25 * 1024 * 1024) {
        setError(`"${f.name}" exceeds maximum allowed size (25MB).`)
        continue
      }

      // Avoid duplicates by name
      if (!currentFiles.some((existing) => existing.name === f.name)) {
        validFiles.push(f)
      }
    }

    if (validFiles.length > 0) {
      onChange([...currentFiles, ...validFiles])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleAddFiles(e.dataTransfer.files)
  }

  const handleFileChange = (e) => {
    handleAddFiles(e.target.files)
    e.target.value = ''
  }

  const handleRemove = (indexToRemove) => {
    const updated = currentFiles.filter((_, idx) => idx !== indexToRemove)
    onChange(updated)
    setError('')
  }

  const totalSize = currentFiles.reduce((acc, f) => acc + f.size, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/70">
          Upload Project Documents & Architecture Sketches
        </label>
        {currentFiles.length > 0 && (
          <span className="text-xs text-brand-300 font-medium">
            {currentFiles.length} file{currentFiles.length > 1 ? 's' : ''} ({formatBytes(totalSize)})
          </span>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 
          border-2 border-dashed rounded-2xl p-8 cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-brand-400 bg-brand-600/15 scale-[0.99]'
              : `border-white/15 bg-white/3 hover:border-white/25 hover:bg-white/5 ${
                  error ? 'border-red-500/40' : ''
                }`
          }
        `}
      >
        <div className={`p-4 rounded-2xl ${isDragging ? 'bg-brand-500/25' : 'bg-white/8'}`}>
          <Upload size={26} className={isDragging ? 'text-brand-300' : 'text-white/40'} />
        </div>
        <div className="text-center">
          <p className="text-white/80 font-medium text-sm">
            {isDragging ? 'Drop your files here!' : 'Drag & drop project files here'}
          </p>
          <p className="text-white/40 text-xs mt-1">
            or <span className="text-brand-400 underline font-medium">browse files from computer</span>
          </p>
          <p className="text-white/30 text-[11px] mt-2">
            PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG (OCR supported) · Multi-file supported
          </p>
        </div>

        <input
          ref={inputRef}
          id="document-input"
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error Notice */}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1.5 mt-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Uploaded File List */}
      {currentFiles.length > 0 && (
        <div className="space-y-2 mt-3 animate-fade-in">
          {currentFiles.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="p-2 rounded-lg bg-white/5">
                {getFileIcon(f.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-xs truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
                  <p className="text-white/40 text-[11px]">
                    {formatBytes(f.size)} · Ready to parse
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                title="Remove file"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
