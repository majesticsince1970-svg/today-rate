const STORAGE_KEY = 'majestic_today_rate_config_v1';

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
      (saved.geminiApiKey ?? '').trim() ||
      (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim() ||
      '',
    supabaseUrl:
      (saved.supabaseUrl ?? '').trim() ||
      (import.meta.env.VITE_SUPABASE_URL ?? '').trim() ||
      '',
    supabaseAnonKey:
      (saved.supabaseAnonKey ?? '').trim() ||
      (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim() ||
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
  const next = { ...existing, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return getAppConfig();
}

export function clearAppConfigOverrides() {
  localStorage.removeItem(STORAGE_KEY);
  return getAppConfig();
}
