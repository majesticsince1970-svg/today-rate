import React, { useRef } from 'react';
import {
  Palette,
  Music,
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { COLOR_THEMES } from '../constants/themes';

export default function ThemeAndBrandPanel({
  activeTheme,
  setActiveTheme,
  brandAssets,
  onUploadLogo,
  onUploadAudio,
  onRemoveAudio,
  uploadingBrand,
}) {
  const logoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const darkThemes = COLOR_THEMES.filter((t) => t.mode === 'dark');
  const lightThemes = COLOR_THEMES.filter((t) => t.mode === 'light');

  const renderSwatchBtn = (theme) => {
    const selected = activeTheme.id === theme.id;
    return (
      <button
        key={theme.id}
        type="button"
        onClick={() => setActiveTheme(theme)}
        className={`group relative flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
          selected
            ? 'border-gold-400 bg-gold-500/12 ring-1 ring-gold-400/40'
            : 'border-white/10 bg-black/30 hover:border-gold-400/35'
        }`}
      >
        <span
          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold-300/35 shadow-inner"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${theme.swatch[0]}, ${theme.swatch[1]} 60%, ${theme.swatch[2]})`,
          }}
        >
          {selected && (
            <Check
              className={`h-3.5 w-3.5 stroke-[3] ${
                theme.mode === 'light' ? 'text-[#4A0E17]' : 'text-gold-100'
              }`}
            />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-stone-100">{theme.name}</p>
          <p className="font-mono text-[9px] text-stone-400">{theme.primary}</p>
        </div>
      </button>
    );
  };

  return (
    <section className="studio-card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Step 2 • Adaptive Palette, Silk Stage &amp; Brand
          </span>
          <h2 className="font-serif text-lg font-bold text-stone-100">
            Color Theme, LED Silk &amp; Audio
          </h2>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            activeTheme.mode === 'light'
              ? 'border-amber-300/40 bg-amber-200/15 text-amber-200'
              : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {activeTheme.mode === 'light' ? (
            <>
              <Sun className="h-3 w-3" /> Light Mode Text
            </>
          ) : (
            <>
              <Moon className="h-3 w-3" /> Dark Mode Gold Text
            </>
          )}
        </span>
      </div>

      {/* Dark Velvet Themes */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-stone-300">
          <Palette className="h-3.5 w-3.5 text-gold-300" />
          <span>Dark Velvet Themes (White &amp; Metallic Gold Typography)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {darkThemes.map(renderSwatchBtn)}
        </div>
      </div>

      {/* Light Silk & Pedestal Themes */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-stone-300">
          <Sun className="h-3.5 w-3.5 text-gold-300" />
          <span>Light Silk &amp; Pedestal Themes (Maroon &amp; Charcoal Typography)</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {lightThemes.map(renderSwatchBtn)}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-gold-400/20 bg-gold-500/[0.05] px-3 py-2 text-[11px] text-stone-300">
        <span className="font-bold text-gold-200">100% Unified Theme Sync:</span> Static Poster,
        9:16 Reel, 4:5 Feed, 16:9 LED Wall &amp; Gemini Studio Velvet all lock to{' '}
        <strong className="text-white">{activeTheme.name}</strong> ({activeTheme.primary}).
      </div>

      {/* Quick Brand Logo & Background MP3 Jingle Controls */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/35 p-2.5">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUploadLogo(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold-400/25 bg-[#0E3B2C] p-1">
              {brandAssets.logoUrl ? (
                <img
                  src={brandAssets.logoUrl}
                  alt="Majestic Jewellers Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-gold-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-stone-100">Brand Logo PNG</p>
              <p className="truncate text-[10px] text-stone-400">
                {brandAssets.logoUrl === '/majestic-logo.png'
                  ? 'Official Majestic PNG active'
                  : brandAssets.logoUrl
                    ? 'Custom PNG loaded'
                    : 'Using heritage crest'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={uploadingBrand}
            onClick={() => logoInputRef.current?.click()}
            className="shrink-0 rounded-lg border border-gold-400/30 bg-gold-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold-200 hover:bg-gold-500/20 disabled:opacity-50"
          >
            <Upload className="mr-1 inline h-3 w-3" />
            Replace
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/35 p-2.5">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.m4a"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUploadAudio(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold-400/25 bg-black/60 text-gold-300">
              <Music className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-stone-100">Video MP3 Jingle</p>
              <p className="truncate text-[10px] text-stone-400">
                {brandAssets.audioName || 'Optional 10s background audio'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {brandAssets.audioUrl && (
              <button
                type="button"
                onClick={onRemoveAudio}
                title="Remove jingle"
                className="rounded-lg border border-white/10 p-1.5 text-stone-400 hover:bg-rose-500/20 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              disabled={uploadingBrand}
              onClick={() => audioInputRef.current?.click()}
              className="rounded-lg border border-gold-400/30 bg-gold-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold-200 hover:bg-gold-500/20 disabled:opacity-50"
            >
              {brandAssets.audioUrl ? 'Change' : 'Upload MP3'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
