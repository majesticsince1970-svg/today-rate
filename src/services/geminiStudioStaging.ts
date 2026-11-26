import { GoogleGenAI } from '@google/genai';
import { getAppConfig } from './configStore';
import { formatGeminiError } from './geminiService';
import { imageUrlToBase64 } from '../utils/imageProcessing';

export interface StudioThemeSpec {
  id: string;
  name: string;
  primary: string;
  mode: 'dark' | 'light';
  velvetColorName?: string;
}

export interface StudioOrnamentInput {
  id: string;
  name: string;
  category?: string;
  image_url: string;
  staged_url?: string | null;
  staged_theme_id?: string | null;
}

export interface StudioStagingResult {
  dataUrl: string;
  blob: Blob;
  standDescription: string;
  promptUsed: string;
  modelUsed: string;
}

/**
 * Auto-select the realistic jewelry display stand/cushion description by ornament category
 * so bangles rest around velvet rolls, rings sit in velvet ring slots, necklaces drape on busts,
 * and earrings rest on matte velvet/suede stands.
 */
export function getStandDescriptionForCategory(category?: string): string {
  const cat = String(category || '').toLowerCase().trim();

  if (cat.includes('bangle') || cat.includes('bracelet') || cat.includes('kada')) {
    return 'round cylinder velvet bangle cushion stand';
  }
  if (cat.includes('ring')) {
    return 'plush velvet ring box and cushion slot';
  }
  if (
    cat.includes('necklace') ||
    cat.includes('chain') ||
    cat.includes('pendant') ||
    cat.includes('bridal') ||
    cat.includes('haar') ||
    cat.includes('mala')
  ) {
    return 'angled luxury velvet jewelry bust or T-bar stand';
  }
  if (cat.includes('earring') || cat.includes('jhumka') || cat.includes('stud')) {
    return 'sleek matte velvet and suede earring stand';
  }
  return 'plush sculpted luxury velvet jewelry cushion stand';
}

/**
 * Build the exact Gemini AI Studio Product Photography Staging prompt
 */
export function buildStudioStagingPrompt(category: string | undefined, theme: StudioThemeSpec): string {
  const standDescription = getStandDescriptionForCategory(category);
  const rawColor = (theme.velvetColorName || theme.name).replace(/\bvelvet\b/gi, '').trim();
  const colorName = `${rawColor} (${theme.primary})`;

  return `A luxury commercial jewelry studio product photograph of the exact gold ornament from the input image, professionally mounted and resting naturally on a plush ${standDescription} against a rich draped ${colorName} velvet fabric backdrop. The ornament is placed in the upper center of the vertical frame, with realistic studio rim lighting, soft natural contact shadows on the velvet stand, and completely clean negative space in the lower 45% of the image for text overlay. Remove all original white backgrounds, price tags, and inner white spaces completely. Do not render any text or logos.`;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Generate a photorealistic luxury studio photograph of the uploaded ornament resting on
 * its category-matched velvet stand/cushion using Gemini Image-to-Image generation
 * (`gemini-2.5-flash-image` / `gemini-2.5-flash` with uploaded image as reference).
 */
export async function generateStudioStagedOrnament(
  ornament: StudioOrnamentInput,
  theme: StudioThemeSpec
): Promise<StudioStagingResult> {
  const { geminiApiKey } = getAppConfig();
  if (!geminiApiKey || geminiApiKey.includes('your_gemini_api_key')) {
    throw new Error(
      'Gemini API Key is not configured. Open Settings and add your VITE_GEMINI_API_KEY to generate AI Studio backdrops.'
    );
  }
  if (geminiApiKey.startsWith('sb_')) {
    throw new Error(
      'That looks like a Supabase key (sb_...). Please paste your Google Gemini API key (starts with AIza...) in Settings.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const { base64, mimeType } = await imageUrlToBase64(ornament.image_url);
  const standDescription = getStandDescriptionForCategory(ornament.category);
  const promptUsed = buildStudioStagingPrompt(ornament.category, theme);

  // Ordered candidate Gemini image-to-image models
  const candidateModels = [
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.5-flash',
  ];

  let lastError: unknown = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
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
              { text: promptUsed },
            ],
          },
        ],
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      });

      const parts = response?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) =>
        Boolean(p.inlineData && p.inlineData.data)
      );

      if (imagePart?.inlineData?.data) {
        const outMime = imagePart.inlineData.mimeType || 'image/png';
        const outBase64 = imagePart.inlineData.data;
        const dataUrl = `data:${outMime};base64,${outBase64}`;
        const blob = base64ToBlob(outBase64, outMime);

        return {
          dataUrl,
          blob,
          standDescription,
          promptUsed,
          modelUsed: model,
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(formatGeminiError(lastError));
}
