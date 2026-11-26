import React, { useRef, useState } from 'react';
import {
  FolderPlus,
  Search,
  Trash2,
  Check,
  Shuffle,
  Sparkles,
  Loader2,
  Wand2,
  RotateCcw,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { ORNAMENT_CATEGORIES } from '../constants/themes';
import { getStandDescriptionForCategory } from '../services/geminiStudioStaging';

export default function OrnamentManager({
  ornaments,
  selectedOrnament,
  onSelectOrnament,
  onBulkUpload,
  onDeleteOrnament,
  uploadingOrnaments,
  autoPickRandom,
  onToggleAutoPick,
  onShuffleNow,
  activeTheme,
  stagedStudioUrl,
  stagingStudio,
  autoStageOnSelect,
  onToggleAutoStage,
  onGenerateStudioBackdrop,
  onResetToOriginal,
  compact = false,
}) {
  const bulkInputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [uploadCategory, setUploadCategory] = useState('Necklace');

  const filtered = ornaments.filter((item) => {
    const matchCat = filterCategory === 'All' || item.category === filterCategory;
    const matchSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    await onBulkUpload(files, uploadCategory);
  };

  const standDescription = selectedOrnament
    ? getStandDescriptionForCategory(selectedOrnament.category)
    : '';

  return (
    <section className="studio-card rounded-2xl p-4 sm:p-5">
      {/* Header Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Module A • Supabase Ornament Folder &amp; AI Studio
          </span>
          <h2 className="font-serif text-lg font-bold text-stone-100">
            Jewelry Ornament Gallery
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleAutoStage(!autoStageOnSelect)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${
              autoStageOnSelect
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-white/10 bg-white/[0.04] text-stone-400 hover:text-stone-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Auto-Stage: {autoStageOnSelect ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleAutoPick(!autoPickRandom)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${
              autoPickRandom
                ? 'border-gold-400/50 bg-gold-500/15 text-gold-100'
                : 'border-white/10 bg-white/[0.04] text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shuffle className="h-3.5 w-3.5 text-gold-300" />
            <span>Daily Pick: {autoPickRandom ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onShuffleNow}
            title="Pick a random ornament now"
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-stone-300 transition hover:border-gold-400/40 hover:text-gold-200"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bulk Upload Bar */}
      <div className="mb-4 rounded-xl border border-gold-400/20 bg-black/30 p-3">
        <input
          ref={bulkInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-stone-400">Stand Category:</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#14151B] px-2.5 py-1.5 text-xs font-semibold text-stone-100 outline-none focus:border-gold-400/50"
            >
              {ORNAMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={uploadingOrnaments}
            onClick={() => bulkInputRef.current?.click()}
            className="gold-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition disabled:opacity-60"
          >
            {uploadingOrnaments ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4" />
            )}
            {uploadingOrnaments ? 'Uploading to Supabase...' : 'Bulk Upload Ornaments'}
          </button>
        </div>
      </div>

      {/* Gemini AI Studio Product Photography Staging Panel */}
      {selectedOrnament && (
        <div className="mb-4 rounded-xl border border-gold-400/25 bg-gradient-to-r from-gold-500/10 via-black/30 to-emerald-500/10 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/20 text-gold-300">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold text-gold-100">
                    Gemini AI Studio Product Photography
                  </p>
                  {stagedStudioUrl && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Studio Staged &amp; Cached
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-stone-300">
                  Auto-stand for <strong className="text-gold-200">{selectedOrnament.category || 'Jewelry'}</strong>:{' '}
                  <span className="italic text-stone-200">{standDescription}</span> on{' '}
                  <strong className="text-gold-200">{activeTheme.name}</strong> velvet.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stagedStudioUrl && (
                <button
                  type="button"
                  disabled={stagingStudio}
                  onClick={onResetToOriginal}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-stone-300 hover:bg-white/10"
                >
                  <RotateCcw className="h-3 w-3" />
                  Raw Photo
                </button>
              )}

              <button
                type="button"
                disabled={stagingStudio}
                onClick={onGenerateStudioBackdrop}
                className="gold-btn inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition disabled:opacity-60"
              >
                {stagingStudio ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {stagingStudio
                  ? 'Staging in Studio...'
                  : stagedStudioUrl
                    ? 'Regenerate Studio Backdrop'
                    : 'Generate Studio Backdrop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search necklaces, bangles, rings, earrings..."
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-stone-100 outline-none focus:border-gold-400/50"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', ...ORNAMENT_CATEGORIES.slice(0, 6)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                filterCategory === cat
                  ? 'bg-gold-400/20 text-gold-100 ring-1 ring-gold-400/40'
                  : 'bg-white/[0.04] text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Ornament Grid */}
      <div
        className={`grid gap-2.5 ${
          compact
            ? 'max-h-[260px] grid-cols-3 overflow-y-auto pr-1 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}
      >
        {filtered.map((item) => {
          const isSelected = selectedOrnament?.id === item.id;
          const hasStagedCache = Boolean(item.staged_url);

          return (
            <div
              key={item.id}
              onClick={() => onSelectOrnament(item)}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                isSelected
                  ? 'border-gold-400 bg-gold-500/10 ring-2 ring-gold-400/35'
                  : 'border-white/10 bg-black/40 hover:border-gold-400/40'
              }`}
            >
              <div
                className="flex aspect-square items-center justify-center p-2"
                style={{
                  background: `radial-gradient(circle at center, ${activeTheme.centerGlow}66 0%, #0D0E12 100%)`,
                }}
              >
                <img
                  src={item.staged_url || item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="max-h-full max-w-full rounded object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {isSelected && (
                <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-obsidian-950 shadow">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}

              {hasStagedCache && !item.isSample && (
                <span className="absolute bottom-11 left-1.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  Studio
                </span>
              )}

              {item.isSample ? (
                <span className="absolute right-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gold-200">
                  Demo
                </span>
              ) : (
                <button
                  type="button"
                  title="Delete ornament"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOrnament(item);
                  }}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-black/70 p-1.5 text-stone-300 opacity-85 transition hover:bg-rose-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}

              <div className="border-t border-white/5 bg-black/50 px-2 py-1.5">
                <p className="truncate text-[11px] font-semibold text-stone-100">{item.name}</p>
                <p className="text-[10px] text-stone-400">{item.category}</p>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-stone-400">
            No ornaments match &ldquo;{search}&rdquo;. Upload new jewelry photos above!
          </div>
        )}
      </div>
    </section>
  );
}
