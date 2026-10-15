const axios = require('axios');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

/**
 * Extracts text content from a public URL using axios + cheerio.
 * Grabs page title, headings, meta description, and body paragraphs cleanly.
 * @param {string} url - The target URL
 * @returns {Promise<string>} - Normalized plain text
 */
const extractFromUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WBS-Engine/2.0; +http://localhost)',
      },
    });

    const $ = cheerio.load(response.data);

    // Remove script, style, navigation clutter, ads, cookies, footers
    $('script, style, noscript, iframe, svg, img, form, footer, .ad, .ads, .cookie-banner').remove();

    const parts = [];

    // Page title
    const title = $('title').text().trim();
    if (title) parts.push(`Page Title: ${title}`);

    // Meta description
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
    if (metaDesc) parts.push(`Meta Description: ${metaDesc}`);

    // Headings — great signal for project scope
    const headings = [];
    $('h1, h2, h3, h4').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 2) headings.push(text);
    });
    if (headings.length > 0) {
      parts.push(`Headings & Structure:\n${[...new Set(headings)].join('\n')}`);
    }

    // Main content paragraphs and lists
    const paragraphs = [];
    $('main, article, [role="main"], .content, body').find('p, li, td, th, blockquote').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 20 && !paragraphs.includes(text)) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length > 0) {
      parts.push(`Content Body:\n${paragraphs.slice(0, 100).join('\n')}`);
    }

    const result = parts.join('\n\n');

    if (!result.trim()) {
      throw new Error('No meaningful text content found at the provided URL.');
    }

    return result;
  } catch (err) {
    if (err.response) {
      throw new Error(`Failed to fetch URL (HTTP ${err.response.status}): ${url}`);
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error(`Request timed out while fetching URL: ${url}`);
    }
    throw new Error(`URL extraction failed: ${err.message}`);
  }
};

/**
 * Extracts plain text from a PDF buffer using pdf-parse.
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
const extractFromPdf = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();

    if (!text || text.length < 15) {
      // Scanned or image-based PDF
      return await extractFromImageWithVision(buffer, 'application/pdf');
    }

    return text;
  } catch (err) {
    // If pdf-parse failed, attempt vision extraction
    try {
      return await extractFromImageWithVision(buffer, 'application/pdf');
    } catch {
      throw new Error(`PDF extraction failed: ${err.message}`);
    }
  }
};

/**
 * Extracts plain text from a DOCX buffer using mammoth.
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} - Extracted text
 */
const extractFromDocx = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error('The Word document appears to be empty.');
    }

    return text;
  } catch (err) {
    throw new Error(`DOCX extraction failed: ${err.message}`);
  }
};

/**
 * Extracts text and structured tables from Excel/Spreadsheet buffers (.xlsx, .xls, .csv).
 * @param {Buffer} buffer - Spreadsheet file buffer
 * @returns {Promise<string>} - Formatted tabular text
 */
const extractFromExcel = async (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetTexts = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet).trim();
      if (csv) {
        sheetTexts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }
    }

    const fullText = sheetTexts.join('\n\n').trim();
    if (!fullText) {
      throw new Error('Spreadsheet appears to be empty.');
    }

    return fullText;
  } catch (err) {
    throw new Error(`Spreadsheet extraction failed: ${err.message}`);
  }
};

/**
 * Extracts plain text from TXT or Markdown buffers.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
const extractFromTextOrMd = async (buffer) => {
  const text = buffer.toString('utf-8').trim();
  if (!text) {
    throw new Error('Text/Markdown file is empty.');
  }
  return text;
};

/**
 * Uses Gemini Multimodal Vision API to perform OCR and transcribe diagrams,
 * whiteboard photos, architectural sketches, and scanned documents.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
const extractFromImageWithVision = async (buffer, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('OCR / Vision extraction requires a valid GEMINI_API_KEY.');
  }

  const base64Data = buffer.toString('base64');
  const safeMime = mimeType === 'application/pdf' ? 'application/pdf' : mimeType || 'image/png';

  const models = ['models/gemini-2.5-flash', 'models/gemini-flash-latest'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: 'Perform OCR and structured project brief extraction on this image/document. Extract all written text, specifications, architectural components, user stories, requirements, and workflow diagrams into structured, descriptive text.',
              },
              {
                inlineData: {
                  mimeType: safeMime,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000,
      });

      const extracted = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (extracted) {
        return `[OCR & Vision Extracted Content]:\n${extracted}`;
      }
    } catch (err) {
      console.warn(`[extractor] Vision model ${model} failed:`, err.message);
    }
  }

  throw new Error('Unable to extract text from image or scanned document.');
};

/**
 * Extracts content from an individual file object based on extension & MIME type.
 * @param {object} file - Express Multer file object
 * @returns {Promise<string>}
 */
const extractSingleFile = async (file) => {
  const { mimetype, buffer, originalname = '' } = file;
  const ext = originalname.toLowerCase();

  if (mimetype === 'application/pdf' || ext.endsWith('.pdf')) {
    return await extractFromPdf(buffer);
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    ext.endsWith('.docx') ||
    ext.endsWith('.doc')
  ) {
    return await extractFromDocx(buffer);
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'text/csv' ||
    ext.endsWith('.xlsx') ||
    ext.endsWith('.xls') ||
    ext.endsWith('.csv')
  ) {
    return await extractFromExcel(buffer);
  }

  if (
    mimetype === 'text/plain' ||
    mimetype === 'text/markdown' ||
    ext.endsWith('.txt') ||
    ext.endsWith('.md')
  ) {
    return await extractFromTextOrMd(buffer);
  }

  if (
    mimetype.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp)$/.test(ext)
  ) {
    return await extractFromImageWithVision(buffer, mimetype);
  }

  // Fallback to text attempt
  try {
    return await extractFromTextOrMd(buffer);
  } catch {
    throw new Error(`Unsupported file type: ${originalname} (${mimetype})`);
  }
};

/**
 * Unified extractor — normalizes all input methods and multiple files into a single rawProjectText string.
 * @param {string} inputMethod - 'url' | 'document' | 'text'
 * @param {object} data - { url, file, files, description }
 * @returns {Promise<string>} rawProjectText
 */
const extractProjectText = async (inputMethod, data) => {
  switch (inputMethod) {
    case 'url': {
      if (!data.url) throw new Error('URL is required for URL input method.');
      return await extractFromUrl(data.url);
    }

    case 'document': {
      // Support both single file and multiple files
      const fileList = data.files && Array.isArray(data.files) && data.files.length > 0
        ? data.files
        : data.file
        ? [data.file]
        : [];

      if (fileList.length === 0) {
        throw new Error('At least one file is required for document input method.');
      }

      const results = [];
      for (const f of fileList) {
        console.log(`[extractor] Extracting file: ${f.originalname} (${f.mimetype})`);
        const content = await extractSingleFile(f);
        results.push(`=== FILE: ${f.originalname} ===\n${content}`);
      }

      return results.join('\n\n====================\n\n');
    }

    case 'text': {
      if (!data.description || !data.description.trim()) {
        throw new Error('Project description is required for text input method.');
      }
      return data.description.trim();
    }

    default:
      throw new Error(`Unknown input method: "${inputMethod}". Use 'url', 'document', or 'text'.`);
  }
};

module.exports = { extractProjectText };
