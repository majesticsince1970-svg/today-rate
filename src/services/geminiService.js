import { GoogleGenAI, Type } from '@google/genai';
import { getAppConfig, sanitizeSecret } from './configStore';
import { fileToBase64 } from '../utils/imageProcessing';
import { formatDateDDMMMYYYY } from '../utils/formatters';

export function formatGeminiError(err) {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
    return 'Gemini API key is invalid. Please create a valid AIza... key at aistudio.google.com/apikey, paste ONLY the key (no quotes/spaces) in Settings, and verify "Generative Language API" is enabled.';
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return 'Gemini API key permission denied. Check API key restrictions (HTTP referrers / API restrictions) in Google Cloud Console.';
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return 'Gemini API rate limit or free-tier quota reached. Wait a moment or check billing/quota in Google AI Studio.';
  }
  return raw || 'Gemini request failed. Please verify your API key in Settings.';
}

function getGeminiClient() {
  const { geminiApiKey } = getAppConfig();
  if (!geminiApiKey) {
    throw new Error(
      'Gemini API Key is not configured. Open Settings (top right) and add your VITE_GEMINI_API_KEY.'
    );
  }
  if (geminiApiKey.startsWith('sb_')) {
    throw new Error(
      'That looks like a Supabase key (sb_...). Please paste your Google Gemini API key (starts with AIza...) from aistudio.google.com/apikey.'
    );
  }
  return new GoogleGenAI({ apiKey: geminiApiKey });
}

export function isGeminiConfigured() {
  const { geminiApiKey } = getAppConfig();
  return Boolean(geminiApiKey && !geminiApiKey.includes('your_gemini_api_key'));
}

/**
 * Quick 1-click key validator used by the Settings drawer.
 */
export async function testGeminiApiKey(candidateKey) {
  const key = sanitizeSecret(candidateKey, ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY']);
  if (!key) {
    throw new Error('Please paste a Gemini API key first.');
  }
  if (key.startsWith('sb_')) {
    throw new Error('That is a Supabase Publishable key (sb_...), not a Google Gemini key (AIza...).');
  }
  if (!key.startsWith('AIza')) {
    throw new Error('Google Gemini API keys from AI Studio normally start with "AIza". Please double-check the key.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Reply with OK',
    });
    return { ok: true, message: 'Key verified! Connected to Gemini 2.5 Flash.' };
  } catch (err) {
    throw new Error(formatGeminiError(err));
  }
}

/**
 * Module B: Extract structured gold rate data from an association poster (e.g., KGSMA board rate image)
 * using gemini-2.5-flash with Structured JSON Output.
 */
export async function extractGoldRatesFromPoster(file) {
  const ai = getGeminiClient();
  const { base64, mimeType } = await fileToBase64(file);

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description:
          'Date shown on the gold rate poster formatted strictly as DD-MMM-YYYY in uppercase English (e.g. 26-NOV-2026). If missing, use today.',
      },
      rate_22k_1g: {
        type: Type.NUMBER,
        description:
          '22K (916) gold rate per 1 gram in INR as a pure number without currency symbol or commas.',
      },
      rate_22k_8g: {
        type: Type.NUMBER,
        description:
          '22K (916) gold rate per 8 grams (1 pavan/sovereign) in INR as a pure number. If not explicitly printed, multiply rate_22k_1g by 8.',
      },
      rate_18k_1g: {
        type: Type.NUMBER,
        description: '18K gold rate per 1 gram in INR as a pure number.',
      },
      rate_9k_1g: {
        type: Type.NUMBER,
        description:
          '9K gold rate per 1 gram in INR as a pure number. If not shown on the poster, estimate proportionally as Math.round(rate_22k_1g * (9 / 22)).',
      },
      change_1g: {
        type: Type.NUMBER,
        description:
          'Absolute daily price difference per 1 gram of 22K gold (non-negative number). If the poster only states pavan (8g) change, divide by 8. If unchanged, return 0.',
      },
      trend: {
        type: Type.STRING,
        enum: ['UP', 'DOWN', 'UNCHANGED'],
        description:
          'Direction of 22K gold price movement compared to previous rate: UP (increased / green arrow / + / കൂടി), DOWN (decreased / red arrow / - / കുറഞ്ഞു), or UNCHANGED (no change / മാറ്റമില്ല).',
      },
    },
    required: [
      'date',
      'rate_22k_1g',
      'rate_22k_8g',
      'rate_18k_1g',
      'rate_9k_1g',
      'change_1g',
      'trend',
    ],
  };

  const prompt = `
You are an expert OCR and financial rate parser for Kerala Gold & Silver Merchants Association (KGSMA / All Kerala Gold & Silver Merchants Association) daily board rate posters.

Carefully read this gold rate image (which may contain English and/or Malayalam text, arrows, + or - signs, and rate tables).
Extract:
1. "date": Convert the poster date strictly to DD-MMM-YYYY uppercase (for example: 26-NOV-2026).
2. "rate_22k_1g": 22K (916) gold price for 1 gram (number only).
3. "rate_22k_8g": 22K (916) gold price for 8 grams / 1 Pavan (number only). Verify it equals rate_22k_1g * 8 if not printed explicitly.
4. "rate_18k_1g": 18K gold price for 1 gram (number only).
5. "rate_9k_1g": 9K gold price for 1 gram (number only). If 9K is not listed on the image, compute Math.round(rate_22k_1g * (9 / 22)).
6. "change_1g": Daily change for 1 gram of 22K gold as a positive number (no + or - sign). If only 8g/pavan change is shown (e.g. +480 or -320), divide by 8.
7. "trend": Strictly "UP", "DOWN", or "UNCHANGED". Look carefully at up/down arrows, green/red indicators, +/- symbols, or Malayalam words ("കൂടി" = UP, "കുറഞ്ഞു" = DOWN, "മാറ്റമില്ല" = UNCHANGED).

Return strictly valid JSON matching the schema.
`.trim();

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
      },
    });
  } catch (err) {
    throw new Error(formatGeminiError(err));
  }

  const text = response?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response. Please try a clearer image.');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Could not parse structured JSON from Gemini response.');
  }

  const rate22k1g = Math.round(Number(parsed.rate_22k_1g) || 0);
  const rate22k8g = Math.round(Number(parsed.rate_22k_8g) || rate22k1g * 8);
  const rate18k1g = Math.round(Number(parsed.rate_18k_1g) || Math.round(rate22k1g * (18 / 22)));
  const rate9k1g = Math.round(Number(parsed.rate_9k_1g) || Math.round(rate22k1g * (9 / 22)));
  const change1g = Math.abs(Number(parsed.change_1g) || 0);
  const trend = ['UP', 'DOWN', 'UNCHANGED'].includes(String(parsed.trend || '').toUpperCase())
    ? String(parsed.trend).toUpperCase()
    : change1g === 0
      ? 'UNCHANGED'
      : 'UP';

  const date =
    parsed.date && /^\d{1,2}-[A-Z]{3}-\d{4}$/i.test(String(parsed.date).trim())
      ? String(parsed.date).trim().toUpperCase().padStart(11, '0')
      : formatDateDDMMMYYYY();

  return {
    date,
    rate_22k_1g: rate22k1g,
    rate_22k_8g: rate22k8g,
    rate_18k_1g: rate18k1g,
    rate_9k_1g: rate9k1g,
    change_1g: change1g,
    trend,
  };
}

