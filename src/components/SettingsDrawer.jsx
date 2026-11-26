import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  KeyRound,
  Database,
  Save,
  RotateCcw,
  Upload,
  Music,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { clearAppConfigOverrides, getAppConfig, saveAppConfig } from '../services/configStore';
import { testGeminiApiKey } from '../services/geminiService';

export default function SettingsDrawer({
  open,
  onClose,
  onConfigSaved,
  brandAssets,
  onUploadLogo,
  onUploadAudio,
  onRemoveAudio,
  uploadingBrand,
}) {
  const [form, setForm] = useState(() => getAppConfig());
  const [showKeys, setShowKeys] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);
  const logoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(getAppConfig());
      setKeyTestResult(null);
    }
  }, [open]);

  if (!open) return null;

  const handleTestGeminiKey = async () => {
    setTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await testGeminiApiKey(form.geminiApiKey);
      setKeyTestResult({ ok: true, message: res.message });
    } catch (err) {
      setKeyTestResult({ ok: false, message: err.message || 'Key validation failed.' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updated = saveAppConfig({
      geminiApiKey: form.geminiApiKey.trim(),
      supabaseUrl: form.supabaseUrl.trim(),
      supabaseAnonKey: form.supabaseAnonKey.trim(),
      exportFps: Number(form.exportFps) === 60 ? 60 : 30,
    });
    onConfigSaved(updated);
    onClose();
  };

  const handleReset = () => {
    const resetCfg = clearAppConfigOverrides();
    setForm(resetCfg);
    onConfigSaved(resetCfg);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-gold-500/20 bg-[#0E1015] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-bold gold-text-gradient">
              Studio Settings &amp; Keys
            </h2>
            <p className="text-[11px] text-stone-400">
              Overrides .env variables locally in this browser
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-stone-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleSave} className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Gemini API Key */}
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-gold-200">
                <KeyRound className="h-3.5 w-3.5" />
                VITE_GEMINI_API_KEY
              </label>
              <button
                type="button"
                onClick={() => setShowKeys((s) => !s)}
                className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200"
              >
                {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showKeys ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type={showKeys ? 'text' : 'password'}
                value={form.geminiApiKey}
                onChange={(e) => {
                  setForm((f) => ({ ...f, geminiApiKey: e.target.value }));
                  setKeyTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-stone-100 outline-none focus:border-gold-400/60"
              />
              <button
                type="button"
                disabled={testingKey}
                onClick={handleTestGeminiKey}
                className="shrink-0 rounded-xl border border-gold-400/35 bg-gold-500/15 px-3 py-2 text-[11px] font-bold text-gold-100 transition hover:bg-gold-500/25 disabled:opacity-50"
              >
                {testingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {keyTestResult && (
              <div
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${
                  keyTestResult.ok
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                }`}
              >
                {keyTestResult.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                )}
                <span>{keyTestResult.message}</span>
              </div>
            )}

            <p className="text-[11px] text-stone-400">
              Get a free key (starts with <code className="text-gold-300">AIza</code>) from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-gold-300 hover:underline"
              >
                Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
          </div>

          {/* Supabase Keys */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <Database className="h-3.5 w-3.5" />
              Supabase Storage &amp; Database
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-400">
                VITE_SUPABASE_URL
              </label>
              <input
                type="url"
                value={form.supabaseUrl}
                onChange={(e) => setForm((f) => ({ ...f, supabaseUrl: e.target.value }))}
                placeholder="https://your-project.supabase.co"
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-stone-100 outline-none focus:border-gold-400/60"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-stone-400">
                VITE_SUPABASE_ANON_KEY
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={form.supabaseAnonKey}
                onChange={(e) => setForm((f) => ({ ...f, supabaseAnonKey: e.target.value }))}
                placeholder="sb_publishable_... or eyJhbGciOi..."
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-stone-100 outline-none focus:border-gold-400/60"
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Run <code className="text-gold-300">supabase_setup.sql</code> in your Supabase SQL Editor to create the <code className="text-stone-200">ornaments</code> bucket, <code className="text-stone-200">ornament_gallery</code>, and <code className="text-stone-200">daily_rates</code> tables.
            </p>
          </div>

          {/* Video Export Frame Rate */}
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3.5">
            <label className="block text-xs font-bold text-stone-200">
              Canvas Video Export Frame Rate
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[30, 60].map((fps) => (
                <button
                  key={fps}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, exportFps: fps }))}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    Number(form.exportFps) === fps
                      ? 'border-gold-400 bg-gold-500/15 text-gold-100'
                      : 'border-white/10 bg-black/40 text-stone-400'
                  }`}
                >
                  {fps} FPS {fps === 30 ? '(Recommended)' : '(Ultra Smooth)'}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Logo & MP3 Jingle Uploads */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
            <p className="text-xs font-bold text-gold-200">
              Permanent Brand Assets (Supabase Bucket)
            </p>

            {/* Logo */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5">
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) onUploadLogo(e.target.files[0]);
                  e.target.value = '';
                }}
              />
              <div className="flex items-center gap-2.5">
                <ImageIcon className="h-4 w-4 text-gold-300" />
                <div>
                  <p className="text-xs font-semibold text-stone-100">Majestic Jewellers Logo PNG</p>
                  <p className="text-[10px] text-stone-400">
                    {brandAssets.logoUrl === '/majestic-logo.png'
                      ? 'Official transparent Majestic PNG active'
                      : brandAssets.logoUrl
                        ? 'Custom PNG uploaded & active'
                        : 'Default heritage crest'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={uploadingBrand}
                onClick={() => logoRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg bg-gold-500/15 px-2.5 py-1.5 text-[11px] font-bold text-gold-200 hover:bg-gold-500/25"
              >
                <Upload className="h-3 w-3" />
                Upload
              </button>
            </div>

            {/* MP3 Audio Jingle */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5">
              <input
                ref={audioRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.m4a"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) onUploadAudio(e.target.files[0]);
                  e.target.value = '';
                }}
              />
              <div className="flex min-w-0 items-center gap-2.5">
                <Music className="h-4 w-4 shrink-0 text-gold-300" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-stone-100">
                    Background MP3 Jingle
                  </p>
                  <p className="truncate text-[10px] text-stone-400">
                    {brandAssets.audioName || 'Auto-muxed into all 3 exported videos'}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {brandAssets.audioUrl && (
                  <button
                    type="button"
                    onClick={onRemoveAudio}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-500/20 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={uploadingBrand}
                  onClick={() => audioRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg bg-gold-500/15 px-2.5 py-1.5 text-[11px] font-bold text-gold-200 hover:bg-gold-500/25"
                >
                  <Upload className="h-3 w-3" />
                  MP3
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-200/90">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              In production on Vercel, set these 3 variables under Project Settings &rarr; Environment Variables.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to .env
            </button>
            <button
              type="submit"
              className="gold-btn inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-extrabold shadow"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
