# WBS Engine 2.0 — AI Project Breakdown Structure (PBS/WBS) Platform

An enterprise-ready, AI-powered Project Breakdown Structure (PBS) and Work Breakdown Structure (WBS) platform. It ingests multi-format inputs, extracts noisy data, normalizes project briefs, generates mathematically balanced 4-tier hierarchies adhering strictly to the **100% Rule**, and provides multi-view interactive editing with 1-click export to major project management tools (Jira, MS Project, Excel).

---

## Key Features

### 1. Robust Input Engine & Parsing Pipeline
- **Multi-Format Ingestion:** PDF, Word (.docx), Excel/Spreadsheets (.xlsx, .xls, .csv), Plain Text (.txt), and Markdown (.md).
- **Multimodal Vision OCR:** Automatically transcribes architectural sketches, whiteboard photos, and scanned/image-based documents using Gemini Multimodal Vision.
- **Multi-File Upload:** Drag & drop up to 10 project specification files concurrently.
- **Smart URL Scraper:** Strips website navigation, ads, and cookies to extract clean project scopes and requirements.
- **Industry Templates:** Quick-start briefs for SaaS Platforms, Mobile Apps, Construction & Civil, Product Launches, and Hardware/IoT.
- **PM Decomposition Controls:** Choose between **Phase-Based** (Milestones), **Architecture-Based** (Tech Stack), or **Department-Based** (Functional Teams) breakdown, with configurable detail depth (High-Level, Standard, Deep Scope).

### 2. AI Processing & Generation Logic
- **4-Tier WBS Standard Hierarchy:**
  `Project -> Deliverables (Level 1) -> Work Packages (Level 2) -> Tasks (Level 3)`
- **100% Rule Compliance:** Automatic rollup calculations guarantee that sub-element hours sum exactly to 100% of the project scope.
- **Contextual Enrichment:** Realistic hour estimates, assigned specialist roles/skills, priority classification, risk rating with actionable mitigations, task dependencies (`dependsOn`), and Definition of Done (DoD) acceptance criteria checklists.
- **Node-Level AI Actions:** On-demand AI refinement directly on any selected node (*"Expand Further"*, *"Suggest Risks & Mitigations"*, *"Generate Acceptance Criteria"*, or custom PM prompts).

### 3. Multi-View Interactive Workspace
- **Outline Tree Table View:** Collapsible hierarchy with live inline editing (titles, hours, roles, priorities, risk tags) and real-time rollup recalculation. Add and delete nodes with instant updates.
- **Mind Map / Tree Canvas View:** Zoomable, pannable interactive SVG visual diagram showing color-coded parent-child relationships and clickable node actions.
- **Gantt / Timeline Preview:** Automated calendar scheduling based on dependencies and hours, highlighting project duration (days/weeks) and timeline progress bars.
- **Milestone Cards View:** Traditional card-based milestone layout with task grids.

### 4. Enterprise PM Tool Exports
- **Jira / Trello CSV:** Standard format with Epics, Stories, Sub-tasks, Estimates, and Labels for direct board import.
- **Microsoft Project (XML):** Valid MSPDI XML schema opening natively in Microsoft Project.
- **CSV / Excel:** Hierarchical spreadsheet with WBS codes, rollups, and risk matrix.
- **Standalone Interactive HTML:** Self-contained single-file HTML embed with built-in viewer for client presentations.
- **Printable PDF Report:** Formatted executive print view ready for printing or PDF export.
- **Structured JSON:** Full JSON tree data.

---

## Quick Start

### 1. Configure Backend Environment
```bash
cd backend
cp .env.example .env
# Open .env and insert your GEMINI_API_KEY
```

### 2. Install & Run Backend
```bash
cd backend
npm install
npm run dev
# Server running on http://localhost:5000
```

### 3. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

### 4. Build for Production / Live Deployment
```bash
# Build frontend static bundle
cd frontend
npm run build

# Backend automatically serves frontend/dist when NODE_ENV=production or on unified port:
cd ../backend
npm start
```

---

## Architecture Flow

```
[Inputs: URLs / PDFs / DOCX / XLSX / TXT / Images]
                      │
                      ▼
[Unified Extractor & Gemini Vision OCR Pipeline]
                      │
                      ▼
[Gemini AI Engine + PM Decomposition Parameters]
                      │
                      ▼
[Hierarchical Normalizer (100% Rule Rollups & Schema)]
                      │
                      ▼
[Interactive Studio: Mind Map / Tree Table / Gantt] ◄─── (Live Inline Edit & Node-Level AI Actions)
                      │
                      ▼
[Export Engine: Jira CSV / MS Project XML / Excel / PDF / HTML]
```

---

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend:** Node.js, Express, Multer, Axios, Cheerio, Mammoth, PDF-Parse, SheetJS (XLSX), Helmet, CORS
- **AI Engine:** Google Gemini (Multimodal Vision + Generative Language API)
