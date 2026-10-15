const axios = require('axios');

/**
 * Builds the comprehensive WBS/PBS decomposition prompt adhering strictly to
 * the 100% Rule and multi-tier hierarchy standard.
 */
const getSystemPrompt = (decompositionType = 'phase', detailLevel = 'standard') => {
  let decompositionGuide = '';
  if (decompositionType === 'architecture') {
    decompositionGuide = `Decompose strictly by TECHNICAL ARCHITECTURE & STACK LAYERS (e.g. Frontend UI/UX, Backend Services & APIs, Database & Data Engineering, Cloud Infrastructure & DevOps, Security & Third-Party Integrations).`;
  } else if (decompositionType === 'department') {
    decompositionGuide = `Decompose strictly by ORGANIZATIONAL DEPARTMENTS / FUNCTIONAL TEAMS (e.g. Product Management & Research, UI/UX Design Team, Core Engineering Team, QA & Testing Team, DevOps & Security Team).`;
  } else {
    decompositionGuide = `Decompose strictly by CHRONOLOGICAL PROJECT LIFECYCLE PHASES & MILESTONES (e.g. Phase 1: Inception & Discovery, Phase 2: System Design & Prototyping, Phase 3: Core Implementation, Phase 4: Integration & Quality Assurance, Phase 5: Deployment, Launch & Handover).`;
  }

  let scopeCount = '4 to 6 Deliverables, each having 2 to 4 Work Packages, each having 2 to 5 specific Tasks';
  if (detailLevel === 'high') {
    scopeCount = '3 to 4 Deliverables, each having 2 to 3 Work Packages, each having 2 to 4 high-level Tasks';
  } else if (detailLevel === 'granular') {
    scopeCount = '5 to 7 Deliverables, each having 3 to 5 Work Packages, each having 3 to 6 detailed Tasks';
  }

  return `You are an elite Principal Project Architect, Certified PMP, and Technical Director.
Your task is to analyze a project brief and decompose it into a professional, production-grade Work Breakdown Structure (WBS) / Project Breakdown Structure (PBS).

CRITICAL STANDARDS:
1. Adhere to the 100% Rule: The breakdown must account for 100% of the project work, no more, no less.
2. Hierarchical multi-tier structuring:
   Project -> Deliverables (Level 1) -> Work Packages (Level 2) -> Tasks (Level 3).
3. Decomposition Strategy: ${decompositionGuide}
4. Granularity Target: ${scopeCount}.
5. Contextual Enrichment:
   - Provide realistic estimated hours for every task.
   - Assign required specialist skill/role for every task (e.g., 'Fullstack Engineer', 'DevOps Specialist', 'UI Designer', 'Security Auditor').
   - Tag priority: Critical | High | Medium | Low.
   - Tag risk level: Low | Medium | High | Critical, with a concrete mitigation strategy.
   - Specify task dependencies using task IDs (e.g., dependsOn: ["TSK-1.1.1"]).
   - Provide 2-3 measurable acceptance criteria for each task.

You MUST respond with ONLY a valid JSON object — no markdown fences, no conversational text.
Strict schema format:
{
  "projectName": "string",
  "projectType": "string (e.g. 'SaaS Web Platform', 'React Native Mobile App', 'Enterprise Cloud Migration')",
  "summary": "string (2-3 sentences overview of the project scope)",
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
                "string criterion 1",
                "string criterion 2"
              ]
            }
          ]
        }
      ]
    }
  ]
}

Return ONLY the JSON.`;
};

/**
 * Sends a prompt to Gemini using available models with fallback.
 */
const callGeminiApi = async (prompt, systemInstruction = '', temperature = 0.25) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured. Please add your API key to backend/.env');
  }

  const models = [
    'models/gemini-2.5-flash',
    'models/gemini-flash-latest',
    'models/gemini-3.5-flash',
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          topP: 0.85,
          maxOutputTokens: 8192,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
      });

      const candidates = response.data?.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates received from Gemini.');
      }

      const responseText = candidates[0]?.content?.parts?.[0]?.text?.trim();
      if (!responseText) {
        throw new Error('Empty response from Gemini.');
      }

      return responseText;
    } catch (err) {
      if (err.response?.status === 404) {
        console.log(`[llm] Model ${modelName} returned 404, attempting fallback...`);
        lastError = err;
        continue;
      }

      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error('Gemini API authentication failed. Please verify your GEMINI_API_KEY.');
      }

      if (err.response?.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please wait a moment and retry.');
      }

      const apiMsg = err.response?.data?.error?.message;
      if (apiMsg) {
        throw new Error(`Gemini API Error: ${apiMsg}`);
      }

      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed. Please try again.');
};

/**
 * Normalizes and recalculates hierarchical rollups to ensure 100% Rule strict adherence.
 */
const normalizeWbsHierarchy = (rawParsed, decompositionType = 'phase') => {
  const result = {
    projectName: rawParsed.projectName || 'Project Work Breakdown Structure',
    projectType: rawParsed.projectType || 'Software Development Project',
    summary: rawParsed.summary || '',
    complexity: rawParsed.complexity || 'Medium',
    confidenceScore: rawParsed.confidenceScore || 90,
    decompositionMethod: decompositionType,
    totalEstimatedHours: 0,
    deliverables: [],
    milestones: [], // backward compatible flat representation
  };

  let totalProjectHours = 0;
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
    : [];

  const allTaskIds = [];

  // Pass 1: Normalize structure and sum hours
  const processedDeliverables = rawDeliverables.map((deliv, delivIdx) => {
    const delivId = deliv.id || `DEL-${delivIdx + 1}`;
    let deliverableHours = 0;

    const workPackages = (deliv.workPackages || []).map((wp, wpIdx) => {
      const wpId = wp.id || `WP-${delivIdx + 1}.${wpIdx + 1}`;
      let wpHours = 0;

      const tasks = (wp.tasks || []).map((t, tIdx) => {
        const taskId = t.id || `TSK-${delivIdx + 1}.${wpIdx + 1}.${tIdx + 1}`;
        allTaskIds.push(taskId);
        const hours = Math.max(1, Number(t.estimatedHours) || 8);
        wpHours += hours;

        return {
          id: taskId,
          taskTitle: t.taskTitle || t.title || `Task ${tIdx + 1}`,
          description: t.description || '',
          estimatedHours: hours,
          priority: ['Critical', 'High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
          skillRequired: t.skillRequired || 'Specialist',
          dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
          riskLevel: ['Low', 'Medium', 'High', 'Critical'].includes(t.riskLevel) ? t.riskLevel : 'Low',
          riskMitigation: t.riskMitigation || 'Establish standard operating procedures and test coverage.',
          acceptanceCriteria: Array.isArray(t.acceptanceCriteria) && t.acceptanceCriteria.length > 0
            ? t.acceptanceCriteria
            : ['Meets defined technical specifications', 'Code reviewed and tested'],
        };
      });

      deliverableHours += wpHours;

      return {
        id: wpId,
        packageName: wp.packageName || wp.name || `Work Package ${delivIdx + 1}.${wpIdx + 1}`,
        description: wp.description || '',
        estimatedHours: wpHours,
        percentageOfDeliverable: 0, // calculated in Pass 2
        tasks,
      };
    });

    totalProjectHours += deliverableHours;

    return {
      id: delivId,
      deliverableName: deliv.deliverableName || deliv.name || `Deliverable ${delivIdx + 1}`,
      description: deliv.description || '',
      estimatedHours: deliverableHours,
      percentageOfProject: 0, // calculated in Pass 2
      workPackages,
    };
  });

  result.totalEstimatedHours = totalProjectHours;

  // Pass 2: Calculate percentage rollups for 100% Rule
  result.deliverables = processedDeliverables.map((deliv) => {
    const delivPercent = totalProjectHours > 0
      ? Math.round((deliv.estimatedHours / totalProjectHours) * 100)
      : 0;

    const workPackages = deliv.workPackages.map((wp) => {
      const wpPercent = deliv.estimatedHours > 0
        ? Math.round((wp.estimatedHours / deliv.estimatedHours) * 100)
        : 0;

      return {
        ...wp,
        percentageOfDeliverable: wpPercent,
      };
    });

    return {
      ...deliv,
      percentageOfProject: delivPercent,
      workPackages,
    };
  });

  // Pass 3: Populate backward compatible `milestones`
  result.milestones = result.deliverables.map((deliv) => ({
    milestoneName: deliv.deliverableName,
    estimatedHours: deliv.estimatedHours,
    tasks: deliv.workPackages.flatMap((wp) => wp.tasks),
  }));

  return result;
};

/**
 * Analyzes project text using Gemini REST API and returns structured WBS/PBS JSON.
 * @param {string} rawProjectText - Normalized project brief
 * @param {object} options - { decompositionType, detailLevel, template }
 * @returns {Promise<object>} - Complete WBS JSON
 */
const analyzeProjectWithLLM = async (rawProjectText, options = {}) => {
  const decompositionType = options.decompositionType || 'phase';
  const detailLevel = options.detailLevel || 'standard';
  const template = options.template || '';

  const systemPrompt = getSystemPrompt(decompositionType, detailLevel);

  // Keep up to 8000 characters to retain comprehensive project specs
  const truncatedText =
    rawProjectText.length > 8000
      ? rawProjectText.substring(0, 8000) + '\n\n[Content truncated for processing]'
      : rawProjectText;

  const userPrompt = `
PROJECT SPECIFICATION & REQUIREMENTS:
${template ? `[Domain / Industry Context: ${template}]\n` : ''}
${truncatedText}

Decompose the above project into a complete, mathematically balanced 4-tier WBS/PBS JSON following the 100% Rule.`;

  console.log(`[llm] Requesting WBS analysis (${decompositionType}, ${detailLevel})...`);
  const rawResponse = await callGeminiApi(userPrompt, systemPrompt);

  const cleanJson = rawResponse
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawResponse);
    throw new Error('AI response could not be parsed into valid JSON. Please try again.');
  }

  return normalizeWbsHierarchy(parsed, decompositionType);
};

/**
 * Performs node-level AI operations on-demand (Expand, Suggest Risks, Acceptance Criteria).
 * @param {string} action - 'expand' | 'suggest_risks' | 'acceptance_criteria' | 'custom'
 * @param {object} node - The targeted node data
 * @param {string} customPrompt - Optional custom PM instruction
 * @returns {Promise<object>}
 */
const performNodeAIAction = async (action, node, customPrompt = '') => {
  const nodeContext = JSON.stringify(node, null, 2);

  let systemPrompt = 'You are a Senior Project Architect. Respond with ONLY a valid JSON object.';
  let prompt = '';

  if (action === 'expand') {
    prompt = `Analyze the following WBS node and generate 3 to 5 granular subtasks or work elements to break it down further.
NODE DATA:
${nodeContext}

${customPrompt ? `ADDITIONAL PM INSTRUCTION: ${customPrompt}\n` : ''}

Return JSON with:
{
  "newTasks": [
    {
      "taskTitle": "string",
      "description": "string",
      "estimatedHours": 8,
      "priority": "Critical | High | Medium | Low",
      "skillRequired": "string",
      "riskLevel": "Low | Medium | High | Critical",
      "riskMitigation": "string",
      "acceptanceCriteria": ["criterion 1", "criterion 2"]
    }
  ]
}`;
  } else if (action === 'suggest_risks') {
    prompt = `Analyze the following WBS node and identify 3 to 5 realistic technical, architectural, or timeline risks, with severity and actionable mitigation strategies.
NODE DATA:
${nodeContext}

${customPrompt ? `ADDITIONAL PM INSTRUCTION: ${customPrompt}\n` : ''}

Return JSON with:
{
  "risks": [
    {
      "riskTitle": "string",
      "severity": "Low | Medium | High | Critical",
      "impact": "string",
      "mitigationStrategy": "string"
    }
  ]
}`;
  } else if (action === 'acceptance_criteria') {
    prompt = `Generate 4 to 6 measurable, testable Definition of Done / Acceptance Criteria for the following WBS node.
NODE DATA:
${nodeContext}

${customPrompt ? `ADDITIONAL PM INSTRUCTION: ${customPrompt}\n` : ''}

Return JSON with:
{
  "acceptanceCriteria": [
    "string criterion 1",
    "string criterion 2",
    "string criterion 3",
    "string criterion 4"
  ]
}`;
  } else {
    // Custom PM refinement
    prompt = `Analyze the following WBS node and apply the project manager's instructions:
NODE DATA:
${nodeContext}

INSTRUCTIONS:
${customPrompt || 'Refine this node with clearer descriptions and updated hours.'}

Return JSON with:
{
  "refinedNode": {
    "title": "string",
    "description": "string",
    "estimatedHours": 16,
    "notes": "string"
  }
}`;
  }

  const responseText = await callGeminiApi(prompt, systemPrompt, 0.3);
  const cleanJson = responseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    throw new Error('AI action returned invalid JSON.');
  }
};

module.exports = {
  analyzeProjectWithLLM,
  performNodeAIAction,
  normalizeWbsHierarchy,
};
