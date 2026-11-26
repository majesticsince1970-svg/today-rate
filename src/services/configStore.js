const STORAGE_KEY = 'majestic_today_rate_config_v1';

/**
 * Strip accidental quotes, env-var prefixes (e.g. "VITE_GEMINI_API_KEY="),
 * and internal spaces/newlines that frequently happen when copy-pasting keys.
 */
export function sanitizeSecret(raw, prefixHints = []) {
  let s = String(raw ?? '').trim();
  for (const prefix of prefixHints) {
    const re = new RegExp(`^${prefix}\\s*=\\s*`, 'i');
    s = s.replace(re, '');
  }
  s = s.replace(/^["'`]+|["'`]+$/g, '');
  s = s.replace(/\s+/g, '');
  return s;
}

export function getAppConfig() {
  let saved = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch {
    saved = {};
  }

  return {
    geminiApiKey:
      sanitizeSecret(saved.geminiApiKey, ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY']) ||
      sanitizeSecret(import.meta.env.VITE_GEMINI_API_KEY, ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY']) ||
      '',
    supabaseUrl:
      sanitizeSecret(saved.supabaseUrl, ['VITE_SUPABASE_URL', 'SUPABASE_URL']) ||
      sanitizeSecret(import.meta.env.VITE_SUPABASE_URL, ['VITE_SUPABASE_URL', 'SUPABASE_URL']) ||
      '',
    supabaseAnonKey:
      sanitizeSecret(saved.supabaseAnonKey, ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']) ||
      sanitizeSecret(import.meta.env.VITE_SUPABASE_ANON_KEY, ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']) ||
      '',
    exportFps: Number(saved.exportFps) === 60 ? 60 : 30,
    autoPickRandom: Boolean(saved.autoPickRandom),
  };
}

export function saveAppConfig(partial) {
  let existing = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) existing = JSON.parse(raw);
  } catch {
    existing = {};
  }

  const cleaned = { ...partial };
  if ('geminiApiKey' in cleaned) {
    cleaned.geminiApiKey = sanitizeSecret(cleaned.geminiApiKey, ['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY']);
  }
  if ('supabaseUrl' in cleaned) {
    cleaned.supabaseUrl = sanitizeSecret(cleaned.supabaseUrl, ['VITE_SUPABASE_URL', 'SUPABASE_URL']);
  }
  if ('supabaseAnonKey' in cleaned) {
    cleaned.supabaseAnonKey = sanitizeSecret(cleaned.supabaseAnonKey, ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  }

  const next = { ...existing, ...cleaned };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return getAppConfig();
}

export function clearAppConfigOverrides() {
  localStorage.removeItem(STORAGE_KEY);
  return getAppConfig();
}
