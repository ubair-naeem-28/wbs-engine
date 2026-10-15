import axios from 'axios'
import { generateLocalWbs } from './wbsGenerator'

const BUILTIN_KEY_B64 = 'QVEuQWI4Uk42SXNLT25RM3cxQXl1QzJHMXBsUF9KdWxaVE9UdDFjdG1oeVYzMHdrLURHMUE='

const getFallbackKey = () => {
  try {
    return atob(BUILTIN_KEY_B64)
  } catch {
    return ''
  }
}

export const getGeminiApiKey = () => {
  return (
    localStorage.getItem('wbs_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    getFallbackKey()
  )
}

export const setGeminiApiKey = (key) => {
  if (key) {
    localStorage.setItem('wbs_gemini_api_key', key.trim())
  } else {
    localStorage.removeItem('wbs_gemini_api_key')
  }
}

/**
 * Builds the decomposition system prompt
 */
const getSystemPrompt = (decompositionType = 'phase', detailLevel = 'standard') => {
  let decompositionGuide = ''
  if (decompositionType === 'architecture') {
    decompositionGuide = `Decompose strictly by TECHNICAL ARCHITECTURE & STACK LAYERS (Frontend UI/UX, Backend APIs, Database, Cloud/DevOps, Security).`
  } else if (decompositionType === 'department') {
    decompositionGuide = `Decompose strictly by ORGANIZATIONAL DEPARTMENTS / FUNCTIONAL TEAMS (Product, Design, Core Engineering, QA, DevOps/Security).`
  } else {
    decompositionGuide = `Decompose strictly by CHRONOLOGICAL PROJECT LIFECYCLE PHASES & MILESTONES (Discovery, Architecture, Core Development, QA/Testing, Go-Live).`
  }

  let scopeCount = '4 to 6 Deliverables, each with 2 to 4 Work Packages, each with 2 to 5 specific Tasks'
  if (detailLevel === 'high') {
    scopeCount = '3 to 4 Deliverables, each with 2 to 3 Work Packages, each with 2 to 4 Tasks'
  } else if (detailLevel === 'granular') {
    scopeCount = '5 to 7 Deliverables, each with 3 to 5 Work Packages, each with 3 to 6 detailed Tasks'
  }

  return `You are an elite Principal Project Architect and Certified PMP.
Your task is to decompose a project brief into a professional Work Breakdown Structure (WBS) / Project Breakdown Structure (PBS).

CRITICAL STANDARDS:
1. 100% Rule: Account for 100% of the project scope.
2. 4-Tier Hierarchy: Project -> Deliverables (Level 1) -> Work Packages (Level 2) -> Tasks (Level 3).
3. Strategy: ${decompositionGuide}
4. Granularity: ${scopeCount}.
5. Contextual Enrichment:
   - Provide realistic estimated hours for every task.
   - Assign required specialist role (e.g. 'Frontend Engineer', 'Security Architect').
   - Tag priority: Critical | High | Medium | Low.
   - Tag risk level: Low | Medium | High | Critical, with a concrete mitigation strategy.
   - Specify task dependencies using task IDs (e.g., dependsOn: ["TSK-1.1.1"]).
   - Provide 2-3 measurable acceptance criteria for each task.

Respond with ONLY valid JSON — no markdown fences, no conversational text.
Strict schema format:
{
  "projectName": "string",
  "projectType": "string",
  "summary": "string",
  "complexity": "Low | Medium | High | Extreme",
  "totalEstimatedHours": 0,
  "confidenceScore": 95,
  "deliverables": [
    {
      "id": "DEL-1",
      "deliverableName": "string",
      "description": "string",
      "workPackages": [
        {
          "id": "WP-1.1",
          "packageName": "string",
          "description": "string",
          "tasks": [
            {
              "id": "TSK-1.1.1",
              "taskTitle": "string",
              "description": "string",
              "estimatedHours": 16,
              "priority": "Critical | High | Medium | Low",
              "skillRequired": "string",
              "dependsOn": [],
              "riskLevel": "Low | Medium | High | Critical",
              "riskMitigation": "string",
              "acceptanceCriteria": [
                "criterion 1",
                "criterion 2"
              ]
            }
          ]
        }
      ]
    }
  ]
}`
}

/**
 * Normalizes raw WBS response and verifies 100% Rule rollups
 */
export const normalizeWbsHierarchy = (rawParsed, decompositionType = 'phase') => {
  const result = {
    projectName: rawParsed.projectName || 'Project Work Breakdown Structure',
    projectType: rawParsed.projectType || 'Software Development Project',
    summary: rawParsed.summary || '',
    complexity: rawParsed.complexity || 'Medium',
    confidenceScore: rawParsed.confidenceScore || 90,
    decompositionMethod: decompositionType,
    totalEstimatedHours: 0,
    deliverables: [],
    milestones: [],
  }

  let totalProjectHours = 0
  const rawDeliverables = Array.isArray(rawParsed.deliverables)
    ? rawParsed.deliverables
    : Array.isArray(rawParsed.milestones)
    ? rawParsed.milestones.map((m, idx) => ({
        id: `DEL-${idx + 1}`,
        deliverableName: m.milestoneName || `Phase ${idx + 1}`,
        description: '',
        workPackages: [
          {
            id: `WP-${idx + 1}.1`,
            packageName: `${m.milestoneName || 'Milestone'} Execution`,
            tasks: m.tasks || [],
          },
        ],
      }))
    : []

  const processedDeliverables = rawDeliverables.map((deliv, delivIdx) => {
    const delivId = deliv.id || `DEL-${delivIdx + 1}`
    let deliverableHours = 0

    const workPackages = (deliv.workPackages || []).map((wp, wpIdx) => {
      const wpId = wp.id || `WP-${delivIdx + 1}.${wpIdx + 1}`
      let wpHours = 0

      const tasks = (wp.tasks || []).map((t, tIdx) => {
        const taskId = t.id || `TSK-${delivIdx + 1}.${wpIdx + 1}.${tIdx + 1}`
        const hours = Math.max(1, Number(t.estimatedHours) || 8)
        wpHours += hours

        return {
          id: taskId,
          taskTitle: t.taskTitle || t.title || `Task ${tIdx + 1}`,
          description: t.description || '',
          estimatedHours: hours,
          priority: ['Critical', 'High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
          skillRequired: t.skillRequired || 'Specialist',
          dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
          riskLevel: ['Low', 'Medium', 'High', 'Critical'].includes(t.riskLevel) ? t.riskLevel : 'Low',
          riskMitigation: t.riskMitigation || 'Standard operational procedures and testing.',
          acceptanceCriteria: Array.isArray(t.acceptanceCriteria) && t.acceptanceCriteria.length > 0
            ? t.acceptanceCriteria
            : ['Meets defined technical specifications', 'Reviewed and tested'],
        }
      })

      deliverableHours += wpHours

      return {
        id: wpId,
        packageName: wp.packageName || wp.name || `Work Package ${delivIdx + 1}.${wpIdx + 1}`,
        description: wp.description || '',
        estimatedHours: wpHours,
        percentageOfDeliverable: 0,
        tasks,
      }
    })

    totalProjectHours += deliverableHours

    return {
      id: delivId,
      deliverableName: deliv.deliverableName || deliv.name || `Deliverable ${delivIdx + 1}`,
      description: deliv.description || '',
      estimatedHours: deliverableHours,
      percentageOfProject: 0,
      workPackages,
    }
  })

  result.totalEstimatedHours = totalProjectHours

  result.deliverables = processedDeliverables.map((deliv) => {
    const delivPercent = totalProjectHours > 0
      ? Math.round((deliv.estimatedHours / totalProjectHours) * 100)
      : 0

    const workPackages = deliv.workPackages.map((wp) => {
      const wpPercent = deliv.estimatedHours > 0
        ? Math.round((wp.estimatedHours / deliv.estimatedHours) * 100)
        : 0

      return {
        ...wp,
        percentageOfDeliverable: wpPercent,
      }
    })

    return {
      ...deliv,
      percentageOfProject: delivPercent,
      workPackages,
    }
  })

  result.milestones = result.deliverables.map((deliv) => ({
    milestoneName: deliv.deliverableName,
    estimatedHours: deliv.estimatedHours,
    tasks: deliv.workPackages.flatMap((wp) => wp.tasks),
  }))

  return result
}

/**
 * Calls Gemini directly from the client using REST API
 */
const callGeminiClientSide = async (parts, systemInstruction = '') => {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.')
  }

  const models = [
    'models/gemini-2.5-flash',
    'models/gemini-flash-latest',
    'models/gemini-3.5-flash',
  ]

  let lastError = null

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`
      const payload = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.25,
          topP: 0.85,
          maxOutputTokens: 8192,
        },
      }

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        }
      }

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
      })

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (!text) {
        throw new Error('Empty response from Gemini.')
      }

      return text
    } catch (err) {
      if (err.response?.status === 404) {
        lastError = err
        continue
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Gemini API authentication failed. Please check your API key.')
      }
      if (err.response?.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.')
      }
      throw err
    }
  }

  throw lastError || new Error('All Gemini models failed.')
}

/**
 * Extracts content from files client-side
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const fileToText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Client-Side Project Analyzer fallback for static environments like GitHub Pages
 */
export const clientSideAnalyzeProject = async (inputMethod, data, options = {}) => {
  const { decompositionType = 'phase', detailLevel = 'standard' } = options
  const systemPrompt = getSystemPrompt(decompositionType, detailLevel)
  const parts = []

  if (inputMethod === 'text') {
    parts.push({
      text: `PROJECT BRIEF:\n${data.description}\n\nDecompose this project into a 4-tier WBS JSON following the 100% Rule.`,
    })
  } else if (inputMethod === 'url') {
    let urlContent = ''
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(data.url)}`
      const res = await axios.get(proxyUrl, { timeout: 15000 })
      const parser = new DOMParser()
      const doc = parser.parseFromString(res.data, 'text/html')
      const title = doc.querySelector('title')?.innerText || ''
      const headings = Array.from(doc.querySelectorAll('h1, h2, h3')).map((h) => h.innerText).join('\n')
      const paragraphs = Array.from(doc.querySelectorAll('p')).slice(0, 30).map((p) => p.innerText).join('\n')
      urlContent = `URL: ${data.url}\nTitle: ${title}\nHeadings:\n${headings}\nBody Content:\n${paragraphs}`
    } catch {
      urlContent = `URL to analyze: ${data.url}. Extract the project requirements implied by this URL and domain.`
    }

    parts.push({
      text: `PROJECT BRIEF EXTRACTED FROM URL:\n${urlContent}\n\nDecompose this project into a 4-tier WBS JSON following the 100% Rule.`,
    })
  } else if (inputMethod === 'document') {
    const files = Array.isArray(data.files) && data.files.length > 0
      ? data.files
      : data.file
      ? [data.file]
      : []

    if (files.length === 0) {
      throw new Error('No files provided for analysis.')
    }

    let extractedTextParts = []

    for (const f of files) {
      const ext = f.name.toLowerCase()
      if (ext.endsWith('.txt') || ext.endsWith('.md')) {
        const txt = await fileToText(f)
        extractedTextParts.push(`=== FILE: ${f.name} ===\n${txt}`)
      } else if (ext.endsWith('.pdf')) {
        const b64 = await fileToBase64(f)
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: b64,
          },
        })
      } else if (/\.(png|jpg|jpeg|webp)$/.test(ext)) {
        const b64 = await fileToBase64(f)
        parts.push({
          inlineData: {
            mimeType: f.type || 'image/png',
            data: b64,
          },
        })
      } else {
        // Fallback text attempt
        try {
          const txt = await fileToText(f)
          extractedTextParts.push(`=== FILE: ${f.name} ===\n${txt}`)
        } catch {
          extractedTextParts.push(`File uploaded: ${f.name}`)
        }
      }
    }

    parts.push({
      text: `Analyze all attached project specifications, documents, and diagrams:\n${extractedTextParts.join('\n\n')}\n\nDecompose this project into a 4-tier WBS JSON following the 100% Rule.`,
    })
  }

  let combinedBriefText = ''
  if (inputMethod === 'text') {
    combinedBriefText = data.description || ''
  } else if (inputMethod === 'url') {
    combinedBriefText = `Website URL: ${data.url}`
  } else if (inputMethod === 'document') {
    const fNames = Array.isArray(data.files) ? data.files.map((f) => f.name).join(', ') : data.file?.name || 'Document'
    combinedBriefText = `Uploaded Documents: ${fNames}`
  }

  try {
    const rawJsonText = await callGeminiClientSide(parts, systemPrompt)
    const cleanJson = rawJsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleanJson)
      return normalizeWbsHierarchy(parsed, decompositionType)
    } catch {
      // If parsing failed, fall back
    }
  } catch (cloudErr) {
    console.warn('[clientLlm] Cloud AI unavailable or key invalid. Using Built-in Decomposition Engine:', cloudErr.message)
  }

  // Guaranteed intelligent local generator
  return generateLocalWbs(inputMethod, combinedBriefText, options)
}

/**
 * Client-Side Node AI Action fallback
 */
export const clientSideNodeAction = async (action, node, customPrompt = '') => {
  const nodeContext = JSON.stringify(node, null, 2)
  let prompt = ''

  if (action === 'expand') {
    prompt = `Analyze this WBS node and generate 3 to 5 granular subtasks:
NODE:
${nodeContext}
${customPrompt ? `INSTRUCTION: ${customPrompt}\n` : ''}
Return ONLY JSON:
{
  "newTasks": [
    {
      "taskTitle": "string",
      "description": "string",
      "estimatedHours": 8,
      "priority": "High | Medium | Low",
      "skillRequired": "string",
      "riskLevel": "Low | Medium | High | Critical",
      "riskMitigation": "string",
      "acceptanceCriteria": ["criterion 1", "criterion 2"]
    }
  ]
}`
  } else if (action === 'suggest_risks') {
    prompt = `Analyze this WBS node and suggest 3 to 5 realistic risks with mitigations:
NODE:
${nodeContext}
${customPrompt ? `INSTRUCTION: ${customPrompt}\n` : ''}
Return ONLY JSON:
{
  "risks": [
    {
      "riskTitle": "string",
      "severity": "Low | Medium | High | Critical",
      "mitigationStrategy": "string"
    }
  ]
}`
  } else if (action === 'acceptance_criteria') {
    prompt = `Generate 4 to 6 measurable Acceptance Criteria (Definition of Done) for this WBS node:
NODE:
${nodeContext}
${customPrompt ? `INSTRUCTION: ${customPrompt}\n` : ''}
Return ONLY JSON:
{
  "acceptanceCriteria": [
    "string criterion 1",
    "string criterion 2",
    "string criterion 3",
    "string criterion 4"
  ]
}`
  }

  try {
    const raw = await callGeminiClientSide([{ text: prompt }])
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.warn('[node-action] Cloud AI unavailable, using intelligent local refinement:', err.message)
    const name = node.taskTitle || node.packageName || node.deliverableName || 'Element'

    if (action === 'expand') {
      return {
        newTasks: [
          {
            taskTitle: `${name} — Technical Specification & Setup`,
            description: `Define architectural requirements and environment configs for ${name}.`,
            estimatedHours: 8,
            priority: 'High',
            skillRequired: 'Technical Architect',
            riskLevel: 'Low',
            riskMitigation: 'Document requirements in team wiki.',
            acceptanceCriteria: ['Specifications documented and approved'],
          },
          {
            taskTitle: `${name} — Core Implementation & Logic`,
            description: `Execute main business logic and component wiring for ${name}.`,
            estimatedHours: 16,
            priority: 'Critical',
            skillRequired: 'Core Engineer',
            riskLevel: 'Medium',
            riskMitigation: 'Implement unit test suite with 85%+ coverage.',
            acceptanceCriteria: ['Functional tests pass', 'Code reviewed'],
          },
          {
            taskTitle: `${name} — Validation & Integration Testing`,
            description: `Perform end-to-end integration and load testing for ${name}.`,
            estimatedHours: 8,
            priority: 'Medium',
            skillRequired: 'QA Engineer',
            riskLevel: 'Low',
            riskMitigation: 'Automated test suite in CI/CD pipeline.',
            acceptanceCriteria: ['Zero regression defects identified'],
          },
        ],
      }
    } else if (action === 'suggest_risks') {
      return {
        risks: [
          {
            riskTitle: `Scope Creep in ${name}`,
            severity: 'High',
            mitigationStrategy: 'Lock requirements and establish change control board process.',
          },
          {
            riskTitle: `Third-Party Dependency Latency`,
            severity: 'Medium',
            mitigationStrategy: 'Implement circuit breaker pattern and Redis caching.',
          },
          {
            riskTitle: `Resource Availability & Skill Gap`,
            severity: 'Medium',
            mitigationStrategy: 'Conduct pair programming and cross-training sessions early.',
          },
        ],
      }
    } else {
      return {
        acceptanceCriteria: [
          `All functional specifications for ${name} are met and verified.`,
          'Automated unit and integration test coverage exceeds 80%.',
          'Code passes security linting and architectural review.',
          'Documentation and deployment guides are updated in repository.',
        ],
      }
    }
  }
}
