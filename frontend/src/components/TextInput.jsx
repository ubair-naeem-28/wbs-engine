import { useState } from 'react'
import { Sparkles, Sliders, Layers, FolderTree, Building, Smartphone, Globe, Cpu, Megaphone } from 'lucide-react'

const TEMPLATES = [
  {
    id: 'saas',
    label: 'SaaS Platform',
    icon: Globe,
    brief: `Build a modern B2B SaaS analytics platform.
Core Features: Multi-tenant organization accounts, role-based access control (RBAC), real-time event streaming pipeline, customizable dashboard with charting widgets, automated PDF reporting, Stripe billing & subscription tiers, and developer webhook APIs.
Tech Stack: React, Next.js, Node.js, PostgreSQL, Redis, Docker, and AWS.`,
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    icon: Smartphone,
    brief: `Build a cross-platform on-demand delivery mobile application for iOS and Android.
Key Functionality: Customer onboarding, geolocation & real-time delivery driver tracking, payment gateway integration, push notifications, driver companion app, and order dispatch engine.
Tech Stack: React Native, Firebase, Node.js, WebSockets, MongoDB, Google Maps SDK.`,
  },
  {
    id: 'construction',
    label: 'Construction & Civil',
    icon: Building,
    brief: `Commercial Office Building Construction Project (6 Floors).
Project Scope: Site surveying & geotechnical soil testing, architectural blueprints & municipal permitting, foundation & structural steel framing, mechanical/electrical/plumbing (MEP) rough-in, interior drywall & finishes, elevator installation, safety inspection and Certificate of Occupancy.`,
  },
  {
    id: 'marketing',
    label: 'Product Launch & GTM',
    icon: Megaphone,
    brief: `Global Go-To-Market & Product Launch Campaign.
Scope: Market & competitor research, product positioning messaging guide, high-converting landing page creation, PR & media outreach, influencer partnerships, organic SEO content strategy, paid ad campaign (Google & Meta), and post-launch conversion analytics.`,
  },
  {
    id: 'iot',
    label: 'Hardware / IoT',
    icon: Cpu,
    brief: `Smart Industrial Environmental Sensor Hub (IoT).
Deliverables: Custom PCB circuit design, microcontroller firmware development (C/C++), secure MQTT telemetry protocol over cellular/WiFi, cloud backend ingestion pipeline, device fleet management dashboard, and ruggedized enclosure 3D prototyping.`,
  },
]

export default function TextInput({
  value,
  onChange,
  decompositionType = 'phase',
  onDecompositionChange,
  detailLevel = 'standard',
  onDetailLevelChange,
}) {
  const MIN_LENGTH = 20
  const MAX_LENGTH = 8000
  const remaining = MAX_LENGTH - value.length
  const isValid = value.trim().length >= MIN_LENGTH
  const percentage = Math.min((value.trim().length / MIN_LENGTH) * 100, 100)

  const handleSelectTemplate = (tpl) => {
    onChange(tpl.brief)
  }

  return (
    <div className="space-y-4">
      {/* Template Starter Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-400" />
            Quick-Start Industry Templates:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-500/15 border border-white/10 hover:border-brand-500/30 text-white/70 hover:text-brand-300 text-xs font-medium whitespace-nowrap transition-all"
              >
                <Icon size={12} />
                <span>{tpl.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="text-input" className="block text-sm font-medium text-white/70">
            Project Brief & Requirements
          </label>
          <span className={`text-xs ${remaining < 200 ? 'text-amber-400' : 'text-white/30'}`}>
            {remaining} chars left
          </span>
        </div>

        <textarea
          id="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={`Describe your project in detail...\n\nExample: Build a multi-vendor e-commerce platform with React and Node.js. The platform should support seller registration, product listings, payment integration with Stripe, order management, real-time notifications, and an admin dashboard for monitoring sales and users.`}
          rows={7}
          className="input-field resize-none leading-relaxed text-sm"
        />

        {/* Progress bar toward minimum length */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isValid ? 'bg-green-500' : 'bg-brand-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={`text-xs flex-shrink-0 ${isValid ? 'text-green-400' : 'text-white/30'}`}>
            {isValid ? '✓ Ready to Analyze' : `${Math.max(0, MIN_LENGTH - value.trim().length)} more chars needed`}
          </span>
        </div>
      </div>

      {/* PM Advanced Decomposition Controls */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
          <Sliders size={13} className="text-brand-400" />
          <span>PM Breakdown Parameters (WBS Configuration)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Decomposition Strategy */}
          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1.5 uppercase tracking-wide">
              Decomposition Strategy:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onDecompositionChange && onDecompositionChange('phase')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  decompositionType === 'phase'
                    ? 'bg-brand-500/25 border-brand-400 text-brand-300'
                    : 'bg-dark-900/60 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                By Phase
              </button>
              <button
                type="button"
                onClick={() => onDecompositionChange && onDecompositionChange('architecture')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  decompositionType === 'architecture'
                    ? 'bg-purple-500/25 border-purple-400 text-purple-300'
                    : 'bg-dark-900/60 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                By Arch
              </button>
              <button
                type="button"
                onClick={() => onDecompositionChange && onDecompositionChange('department')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  decompositionType === 'department'
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                    : 'bg-dark-900/60 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                By Team
              </button>
            </div>
          </div>

          {/* Granularity Level */}
          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1.5 uppercase tracking-wide">
              Granularity / Detail:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onDetailLevelChange && onDetailLevelChange('high')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  detailLevel === 'high'
                    ? 'bg-brand-500/25 border-brand-400 text-brand-300'
                    : 'bg-dark-900/60 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                High-Level
              </button>
              <button
                type="button"
                onClick={() => onDetailLevelChange && onDetailLevelChange('standard')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  detailLevel === 'standard'
                    ? 'bg-brand-500/25 border-brand-400 text-brand-300'
                    : 'bg-dark-900/60 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => onDetailLevelChange && onDetailLevelChange('granular')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  detailLevel === 'granular'
                    ? 'bg-brand-500/25 border-brand-400 text-brand-300'
                    : 'bg-dark-900/60 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                Deep Scope
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
