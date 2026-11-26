import React from 'react';
import {
  Sparkles,
  Download,
  Loader2,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  Music,
  RefreshCw,
} from 'lucide-react';
import { VIDEO_FORMATS } from '../constants/themes';
import { formatBytes, triggerFileDownload } from '../engine/videoExporter';

export default function ExportCenter({
  generatedAssets,
  generating,
  progressMap,
  activeGeneratingIds,
  posterFormat,
  setPosterFormat,
  exportFps,
  hasAudio,
  onGenerateAll,
  onGenerateSingle,
  onDownloadAll,
}) {
  const readyCount = Object.values(generatedAssets).filter(Boolean).length;

  const cards = [
    {
      id: 'poster',
      title: 'Luxury Static Poster',
      subtitle: '1080×1920 • Top 58% AI Studio + 28% Logo',
      kind: 'image',
      asset: generatedAssets.poster,
    },
    ...VIDEO_FORMATS.map((fmt) => ({
      id: fmt.id,
      title: fmt.name,
      subtitle: `${fmt.aspectLabel} • ${fmt.styleLabel}`,
      kind: 'video',
      formatSpec: fmt,
      asset: generatedAssets[fmt.id],
    })),
  ];

  return (
    <section className="studio-card rounded-2xl p-4 sm:p-5">
      {/* Top Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Module D • 1 Static Poster + 3 Cinematic 10-Second Videos
          </span>
          <h2 className="font-serif text-xl font-bold text-stone-100">
            Generate &amp; Export Today&apos;s Assets
          </h2>
          <p className="mt-0.5 text-xs text-stone-400">
            Simultaneous 10s export ({exportFps}fps, 3D logo finale
            {hasAudio ? ' + MP3 Audio Jingle Attached' : ', Silent Canvas Export'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1 text-[11px] font-bold">
            {['png', 'jpg'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setPosterFormat(fmt)}
                className={`rounded-lg px-2.5 py-1 uppercase transition ${
                  posterFormat === fmt
                    ? 'bg-gold-400/20 text-gold-100'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={onGenerateAll}
            className="gold-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-gold transition disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Rendering 10s Suite...' : "Generate Today's Assets"}
          </button>

          {readyCount > 0 && (
            <button
              type="button"
              disabled={generating}
              onClick={onDownloadAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download All ({readyCount})
            </button>
          )}
        </div>
      </div>

      {/* 4 Output Asset Cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const progress = progressMap[card.id] || 0;
          const isRenderingThis = activeGeneratingIds.includes(card.id);
          const asset = card.asset;

          return (
            <div
              key={card.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-[#07080B] p-2">
                {asset ? (
                  card.kind === 'image' ? (
                    <img
                      src={asset.url}
                      alt={card.title}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                    />
                  ) : (
                    <video
                      src={asset.url}
                      controls
                      playsInline
                      className="max-h-full max-w-full rounded-lg shadow-lg"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center text-stone-500">
                    {card.kind === 'image' ? (
                      <ImageIcon className="h-8 w-8 text-gold-400/40" />
                    ) : (
                      <Film className="h-8 w-8 text-gold-400/40" />
                    )}
                    <p className="text-[11px] font-medium">
                      {isRenderingThis
                        ? `Recording ${progress}%...`
                        : 'Click Generate to render'}
                    </p>
                  </div>
                )}

                {isRenderingThis && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <Loader2 className="h-7 w-7 animate-spin text-gold-300" />
                    <p className="mt-2 text-xs font-bold text-gold-100">
                      Recording {progress}%
                    </p>
                    <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-200 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {asset && !isRenderingThis && (
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
                    <CheckCircle2 className="h-3 w-3" />
                    {asset.extension.toUpperCase()}
                  </div>
                )}

                {asset?.hasAudio && (
                  <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-gold-200">
                    <Music className="h-3 w-3" />
                    Audio
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
                <div>
                  <h3 className="text-sm font-bold text-stone-100">{card.title}</h3>
                  <p className="text-[11px] text-stone-400">{card.subtitle}</p>
                  {asset && (
                    <p className="mt-1 truncate font-mono text-[10px] text-gold-300/90">
                      {formatBytes(asset.sizeBytes)} • {asset.filename}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!asset || generating}
                    onClick={() => asset && triggerFileDownload(asset.url, asset.filename)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                      asset
                        ? 'gold-btn shadow-sm'
                        : 'cursor-not-allowed border border-white/10 bg-white/[0.03] text-stone-500'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>

                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => onGenerateSingle(card.id)}
                    title={`Render ${card.title} only`}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-stone-300 transition hover:border-gold-400/40 hover:text-gold-200 disabled:opacity-40"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
