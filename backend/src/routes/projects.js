const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { extractProjectText } = require('../services/extractor');
const { analyzeProjectWithLLM, performNodeAIAction } = require('../services/llm');

/**
 * POST /api/projects/analyze
 * Accepts multipart/form-data with inputMethod + (url | files | description)
 * Optional parameters: decompositionType ('phase' | 'architecture' | 'department'), detailLevel, template
 * Returns structured 4-tier WBS JSON
 */
router.post(
  '/analyze',
  upload.any(),
  async (req, res) => {
    try {
      const {
        inputMethod,
        url,
        description,
        decompositionType = 'phase',
        detailLevel = 'standard',
        template = '',
      } = req.body;

      // --- Input Validation ---
      if (!inputMethod) {
        return res.status(400).json({
          success: false,
          error: 'inputMethod is required (url | document | text)',
        });
      }

      const validMethods = ['url', 'document', 'text'];
      if (!validMethods.includes(inputMethod)) {
        return res.status(400).json({
          success: false,
          error: `Invalid inputMethod: "${inputMethod}". Must be one of: url, document, text`,
        });
      }

      if (inputMethod === 'url') {
        if (!url || !url.trim()) {
          return res.status(400).json({
            success: false,
            error: 'URL is required when inputMethod is "url"',
          });
        }
        try {
          new URL(url);
        } catch {
          return res.status(400).json({
            success: false,
            error: 'Invalid URL format. Please provide a valid URL (e.g., https://example.com)',
          });
        }
      }

      // Collect uploaded files from req.files or req.file
      const uploadedFiles = req.files && req.files.length > 0
        ? req.files
        : req.file
        ? [req.file]
        : [];

      if (inputMethod === 'document' && uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one document or image file is required when inputMethod is "document"',
        });
      }

      if (inputMethod === 'text' && (!description || !description.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Project description is required when inputMethod is "text"',
        });
      }

      if (inputMethod === 'text' && description.trim().length < 20) {
        return res.status(400).json({
          success: false,
          error: 'Project description must be at least 20 characters long.',
        });
      }

      // --- Step 1: Extract raw project text ---
      console.log(`[analyze] Extracting text via: ${inputMethod} (${uploadedFiles.length} files)`);
      const rawProjectText = await extractProjectText(inputMethod, {
        url,
        files: uploadedFiles,
        file: uploadedFiles[0],
        description,
      });

      console.log(`[analyze] Extracted ${rawProjectText.length} characters`);

      // --- Step 2: AI Analysis & WBS Structuring ---
      console.log(`[analyze] Generating WBS with decomposition: ${decompositionType}...`);
      const wbsResult = await analyzeProjectWithLLM(rawProjectText, {
        decompositionType,
        detailLevel,
        template,
      });

      console.log(
        `[analyze] WBS generated: ${wbsResult.deliverables.length} deliverables, ${wbsResult.totalEstimatedHours}h total (100% Rule verified)`
      );

      // --- Step 3: Respond ---
      return res.status(200).json({
        success: true,
        data: wbsResult,
        meta: {
          inputMethod,
          decompositionType,
          detailLevel,
          template,
          extractedChars: rawProjectText.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('[analyze] Error:', err.message);

      const status =
        err.message.includes('not configured') ||
        err.message.includes('API key') ||
        err.message.includes('quota')
          ? 503
          : err.message.includes('fetch') ||
            err.message.includes('URL') ||
            err.message.includes('timeout')
          ? 422
          : 500;

      return res.status(status).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /api/projects/node-action
 * Performs inline AI operations on a specific branch/node (Expand, Suggest Risks, Acceptance Criteria)
 * Body: { action: 'expand' | 'suggest_risks' | 'acceptance_criteria' | 'custom', node: object, customPrompt: string }
 */
router.post('/node-action', async (req, res) => {
  try {
    const { action, node, customPrompt } = req.body;

    if (!action || !node) {
      return res.status(400).json({
        success: false,
        error: 'Both "action" and "node" parameters are required.',
      });
    }

    console.log(`[node-action] Processing action "${action}" for node: ${node.id || node.taskTitle || node.packageName}`);
    const actionResult = await performNodeAIAction(action, node, customPrompt);

    return res.status(200).json({
      success: true,
      data: actionResult,
    });
  } catch (err) {
    console.error('[node-action] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
