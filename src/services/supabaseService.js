import { createClient } from '@supabase/supabase-js';
import { getAppConfig } from './configStore';
import { DEFAULT_BRAND_LOGO_URL, SAMPLE_ORNAMENTS } from '../constants/themes';

const BUCKET_NAME = 'ornaments';
const LOCAL_ORNAMENTS_KEY = 'majestic_local_ornaments_v1';
const LOCAL_STAGED_CACHE_KEY = 'majestic_staged_cache_v1';
const LOCAL_RATES_KEY = 'majestic_local_rates_v1';
const LOCAL_BRAND_KEY = 'majestic_local_brand_v1';

let cachedClient = null;
let cachedSignature = '';

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getAppConfig();
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('your-project-id')
  );
}

export function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getAppConfig();
  if (!isSupabaseConfigured()) return null;

  const sig = `${supabaseUrl}::${supabaseAnonKey}`;
  if (!cachedClient || cachedSignature !== sig) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    cachedSignature = sig;
  }
  return cachedClient;
}

// ---------- Local Storage Helpers ----------
function readLocalJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage quota overflow
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Staged Studio Image Cache Helpers ----------
export function getCachedStagedUrl(ornament, themeId) {
  if (!ornament) return '';
  // 1. Check Supabase DB staged_url if it matches the requested theme (or theme not restricted)
  if (ornament.staged_url && (!ornament.staged_theme_id || ornament.staged_theme_id === themeId)) {
    return ornament.staged_url;
  }
  // 2. Check browser cache keyed by ornamentId + themeId (instant switching between themes!)
  const cache = readLocalJSON(LOCAL_STAGED_CACHE_KEY, {});
  return cache[`${ornament.id}::${themeId}`] || '';
}

function setLocalStagedCache(ornamentId, themeId, url) {
  const cache = readLocalJSON(LOCAL_STAGED_CACHE_KEY, {});
  const keys = Object.keys(cache);
  // Keep local cache lean (max 12 recent staged URLs so localStorage never fills up)
  if (keys.length >= 12) {
    delete cache[keys[0]];
  }
  cache[`${ornamentId}::${themeId}`] = url;
  writeLocalJSON(LOCAL_STAGED_CACHE_KEY, cache);
}

/**
 * Cache an AI studio-staged photograph into Supabase Storage (`staged/...`)
 * and persist its public URL in `ornament_gallery.staged_url` (+ `staged_theme_id`)
 * so the Static Poster and all 3 Videos load it instantly without re-calling Gemini.
 */
export async function cacheStagedOrnamentImage(ornament, stagedBlob, dataUrl, themeId) {
  if (!ornament) return dataUrl;
  const client = getSupabaseClient();

  // For local/sample ornaments or unconfigured Supabase, cache locally
  if (!client || ornament.isSample || ornament.isLocal) {
    setLocalStagedCache(ornament.id, themeId, dataUrl);
    if (ornament.isLocal) {
      const existing = readLocalJSON(LOCAL_ORNAMENTS_KEY, []);
      const updated = existing.map((o) =>
        o.id === ornament.id ? { ...o, staged_url: dataUrl, staged_theme_id: themeId } : o
      );
      writeLocalJSON(LOCAL_ORNAMENTS_KEY, updated);
    }
    return dataUrl;
  }

  const ext = stagedBlob.type.includes('jpeg') ? 'jpg' : 'png';
  const storagePath = `staged/${ornament.id}-${themeId}-${Date.now()}.${ext}`;

  const { error: uploadErr } = await client.storage
    .from(BUCKET_NAME)
    .upload(storagePath, stagedBlob, {
      cacheControl: '86400',
      upsert: true,
      contentType: stagedBlob.type || 'image/png',
    });

  if (uploadErr) {
    // Still cache locally so user never loses their generated studio photo
    setLocalStagedCache(ornament.id, themeId, dataUrl);
    return dataUrl;
  }

  const { data: pubData } = client.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  const publicUrl = pubData.publicUrl;

  // Update ornament_gallery.staged_url (and staged_theme_id if column exists)
  const { error: updateErr } = await client
    .from('ornament_gallery')
    .update({ staged_url: publicUrl, staged_theme_id: themeId })
    .eq('id', ornament.id);

  if (updateErr) {
    // Fallback if older schema only has staged_url without staged_theme_id
    await client
      .from('ornament_gallery')
      .update({ staged_url: publicUrl })
      .eq('id', ornament.id);
  }

  setLocalStagedCache(ornament.id, themeId, publicUrl);
  return publicUrl;
}

// ---------- Ornament Gallery Operations ----------

export async function fetchOrnaments() {
  const client = getSupabaseClient();
  if (!client) {
    const localItems = readLocalJSON(LOCAL_ORNAMENTS_KEY, []);
    return {
      items: localItems.length > 0 ? [...localItems, ...SAMPLE_ORNAMENTS] : SAMPLE_ORNAMENTS,
      source: 'local',
    };
  }

  const { data, error } = await client
    .from('ornament_gallery')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase ornament_gallery error: ${error.message}`);
  }

  return {
    items: data && data.length > 0 ? data : SAMPLE_ORNAMENTS,
    source: 'supabase',
    hasRealOrnaments: Boolean(data && data.length > 0),
  };
}

export async function uploadOrnamentFile(file, { name, category = 'Necklace' } = {}) {
  const cleanName = (name || file.name.replace(/\.[^.]+$/, '') || 'Gold Ornament').trim();
  const client = getSupabaseClient();

  if (!client) {
    const dataUrl = await readFileAsDataUrl(file);
    const item = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      category,
      image_url: dataUrl,
      staged_url: null,
      staged_theme_id: null,
      created_at: new Date().toISOString(),
      isLocal: true,
    };
    const existing = readLocalJSON(LOCAL_ORNAMENTS_KEY, []);
    writeLocalJSON(LOCAL_ORNAMENTS_KEY, [item, ...existing]);
    return item;
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const storagePath = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await client.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });

  if (uploadErr) {
    throw new Error(`Storage upload failed: ${uploadErr.message}`);
  }

  const { data: pubData } = client.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  const imageUrl = pubData.publicUrl;

  const { data: row, error: dbErr } = await client
    .from('ornament_gallery')
    .insert({
      name: cleanName,
      image_url: imageUrl,
      category,
    })
    .select()
    .single();

  if (dbErr) {
    throw new Error(`Database insert failed: ${dbErr.message}`);
  }

  return row;
}

export async function deleteOrnament(ornament) {
  if (!ornament || ornament.isSample) return;
  const client = getSupabaseClient();

  if (!client || ornament.isLocal) {
    const existing = readLocalJSON(LOCAL_ORNAMENTS_KEY, []);
    writeLocalJSON(
      LOCAL_ORNAMENTS_KEY,
      existing.filter((o) => o.id !== ornament.id)
    );
    return;
  }

  const urlsToRemove = [ornament.image_url, ornament.staged_url].filter(Boolean);
  const paths = urlsToRemove
    .filter((u) => u.includes(`/object/public/${BUCKET_NAME}/`))
    .map((u) => decodeURIComponent(u.split(`/object/public/${BUCKET_NAME}/`)[1]));

  if (paths.length > 0) {
    await client.storage.from(BUCKET_NAME).remove(paths);
  }

  const { error } = await client.from('ornament_gallery').delete().eq('id', ornament.id);
  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// ---------- Brand Logo & Background Audio Jingle ----------

export async function fetchBrandAssets() {
  const localBrand = readLocalJSON(LOCAL_BRAND_KEY, {
    logoUrl: DEFAULT_BRAND_LOGO_URL,
    audioUrl: '',
    audioName: '',
  });
  const client = getSupabaseClient();
  if (!client) {
    return {
      ...localBrand,
      logoUrl: localBrand.logoUrl || DEFAULT_BRAND_LOGO_URL,
    };
  }

  const result = {
    logoUrl: localBrand.logoUrl || DEFAULT_BRAND_LOGO_URL,
    audioUrl: localBrand.audioUrl || '',
    audioName: localBrand.audioName || '',
  };

  try {
    const { data: brandFiles } = await client.storage.from(BUCKET_NAME).list('brand', {
      limit: 10,
      sortBy: { column: 'updated_at', order: 'desc' },
    });
    const logoFile = (brandFiles || []).find((f) => f.name && !f.name.startsWith('.'));
    if (logoFile) {
      const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(`brand/${logoFile.name}`);
      result.logoUrl = `${data.publicUrl}?t=${encodeURIComponent(logoFile.updated_at || Date.now())}`;
    }
  } catch {
    // Ignore if folder not created yet
  }

  try {
    const { data: audioFiles } = await client.storage.from(BUCKET_NAME).list('audio', {
      limit: 10,
      sortBy: { column: 'updated_at', order: 'desc' },
    });
    const audioFile = (audioFiles || []).find((f) => f.name && !f.name.startsWith('.'));
    if (audioFile) {
      const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(`audio/${audioFile.name}`);
      result.audioUrl = `${data.publicUrl}?t=${encodeURIComponent(audioFile.updated_at || Date.now())}`;
      result.audioName = audioFile.name;
    }
  } catch {
    // Ignore if folder not created yet
  }

  return result;
}

export async function uploadBrandLogo(file) {
  const client = getSupabaseClient();
  if (!client) {
    const dataUrl = await readFileAsDataUrl(file);
    const localBrand = readLocalJSON(LOCAL_BRAND_KEY, {});
    writeLocalJSON(LOCAL_BRAND_KEY, { ...localBrand, logoUrl: dataUrl });
    return dataUrl;
  }

  const { data: existing } = await client.storage.from(BUCKET_NAME).list('brand');
  if (existing && existing.length > 0) {
    await client.storage.from(BUCKET_NAME).remove(existing.map((f) => `brand/${f.name}`));
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `brand/majestic-logo.${ext}`;

  const { error } = await client.storage.from(BUCKET_NAME).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/png',
    cacheControl: '3600',
  });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadBackgroundAudio(file) {
  const client = getSupabaseClient();
  if (!client) {
    const dataUrl = await readFileAsDataUrl(file);
    const localBrand = readLocalJSON(LOCAL_BRAND_KEY, {});
    writeLocalJSON(LOCAL_BRAND_KEY, {
      ...localBrand,
      audioUrl: dataUrl,
      audioName: file.name,
    });
    return { audioUrl: dataUrl, audioName: file.name };
  }

  const { data: existing } = await client.storage.from(BUCKET_NAME).list('audio');
  if (existing && existing.length > 0) {
    await client.storage.from(BUCKET_NAME).remove(existing.map((f) => `audio/${f.name}`));
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `audio/${safeName}`;

  const { error } = await client.storage.from(BUCKET_NAME).upload(path, file, {
    upsert: true,
    contentType: file.type || 'audio/mpeg',
    cacheControl: '3600',
  });
  if (error) throw new Error(`Audio upload failed: ${error.message}`);

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(path);
  return { audioUrl: `${data.publicUrl}?t=${Date.now()}`, audioName: safeName };
}

export async function removeBackgroundAudio() {
  const client = getSupabaseClient();
  const localBrand = readLocalJSON(LOCAL_BRAND_KEY, {});
  writeLocalJSON(LOCAL_BRAND_KEY, { ...localBrand, audioUrl: '', audioName: '' });

  if (!client) return;
  const { data: existing } = await client.storage.from(BUCKET_NAME).list('audio');
  if (existing && existing.length > 0) {
    await client.storage.from(BUCKET_NAME).remove(existing.map((f) => `audio/${f.name}`));
  }
}

// ---------- Daily Rates History Operations ----------

export async function fetchDailyRates(limit = 30) {
  const client = getSupabaseClient();
  if (!client) {
    return readLocalJSON(LOCAL_RATES_KEY, []);
  }

  const { data, error } = await client
    .from('daily_rates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase daily_rates error: ${error.message}`);
  }
  return data || [];
}

export async function saveDailyRate(ratePayload) {
  const record = {
    rate_date: String(ratePayload.date || '').trim(),
    rate_22k_1g: Number(ratePayload.rate_22k_1g) || 0,
    rate_22k_8g: Number(ratePayload.rate_22k_8g) || 0,
    rate_18k_1g: Number(ratePayload.rate_18k_1g) || 0,
    rate_9k_1g: Number(ratePayload.rate_9k_1g) || 0,
    change_1g: Math.abs(Number(ratePayload.change_1g) || 0),
    trend: ['UP', 'DOWN', 'UNCHANGED'].includes(ratePayload.trend)
      ? ratePayload.trend
      : 'UNCHANGED',
  };

  const client = getSupabaseClient();
  if (!client) {
    const localRow = {
      ...record,
      id: `local-rate-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const existing = readLocalJSON(LOCAL_RATES_KEY, []);
    writeLocalJSON(LOCAL_RATES_KEY, [localRow, ...existing].slice(0, 50));
    return localRow;
  }

  const { data, error } = await client.from('daily_rates').insert(record).select().single();
  if (error) {
    throw new Error(`Could not save daily rate: ${error.message}`);
  }
  return data;
}

export async function deleteDailyRate(id) {
  const client = getSupabaseClient();
  if (!client) {
    const existing = readLocalJSON(LOCAL_RATES_KEY, []);
    writeLocalJSON(
      LOCAL_RATES_KEY,
      existing.filter((r) => r.id !== id)
    );
    return;
  }

  const { error } = await client.from('daily_rates').delete().eq('id', id);
  if (error) {
    throw new Error(`Could not delete rate entry: ${error.message}`);
  }
}
