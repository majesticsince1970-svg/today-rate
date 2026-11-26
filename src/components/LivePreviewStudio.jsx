import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Smartphone,
  Square,
  Columns3,
  Volume2,
  VolumeX,
  Image as ImageIcon,
} from 'lucide-react';
import { ANIMATION_DURATION, VIDEO_FORMATS } from '../constants/themes';
import { ensureCanvasFontsLoaded, renderGoldRateFrame } from '../engine/canvasRenderer';
import PosterCanvas from './PosterCanvas';

const PREVIEW_SPECS = {
  '9:16': { width: 540, height: 960, scaleRatio: 0.5 },
  '4:5': { width: 540, height: 675, scaleRatio: 0.5 },
  '16:9': { width: 960, height: 540, scaleRatio: 0.5 },
};

function VideoFormatCanvas({
  formatSpec,
  theme,
  rateData,
  ornamentImage,
  logoImage,
  isAiStaged,
  currentTime,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const spec = PREVIEW_SPECS[formatSpec.key];

    ctx.save();
    ctx.setTransform(spec.scaleRatio, 0, 0, spec.scaleRatio, 0, 0);
    renderGoldRateFrame(ctx, {
      width: formatSpec.width,
      height: formatSpec.height,
      formatKey: formatSpec.key,
      theme,
      rateData,
      ornamentImage,
      logoImage,
      isAiStaged,
      time: currentTime,
    });
    ctx.restore();
  }, [formatSpec, theme, rateData, ornamentImage, logoImage, isAiStaged, currentTime]);

  const spec = PREVIEW_SPECS[formatSpec.key];
  return (
    <canvas
      ref={canvasRef}
      width={spec.width}
      height={spec.height}
      className="h-auto w-full rounded-xl shadow-2xl ring-1 ring-gold-400/25"
    />
  );
}

const TIMELINE_MILESTONES = [
  { t: 1.2, label: '0.0s Ornament Showcase' },
  { t: 4.5, label: '2.5s All Gold Rates' },
  { t: 7.0, label: '5.5s Sustained LED Read' },
  { t: 9.2, label: '8.0s Official Logo Finale' },
];

export default function LivePreviewStudio({
  theme,
  rateData,
  ornamentImage,
  logoImage,
  isAiStaged,
  stagingStudio,
  audioUrl,
}) {
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'poster' | '9:16' | '4:5' | '16:9'
  const [mobileFormat, setMobileFormat] = useState('poster');
  // Default video scrub position at 4.6s so users immediately see ornament + 22K glass/3D typography
  const [currentTime, setCurrentTime] = useState(4.6);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mutePreview, setMutePreview] = useState(false);
  const [fontsReadyTick, setFontsReadyTick] = useState(0);

  const audioElRef = useRef(null);
  const rafRef = useRef(null);
  const playStartRef = useRef(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    ensureCanvasFontsLoaded().then(() => setFontsReadyTick((n) => n + 1));
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioElRef.current) audioElRef.current.pause();
      return undefined;
    }

    const startOffset = currentTime >= ANIMATION_DURATION - 0.05 ? 0 : currentTime;
    offsetRef.current = startOffset;
    playStartRef.current = performance.now();

    if (audioElRef.current && audioUrl && !mutePreview) {
      audioElRef.current.currentTime = startOffset % (audioElRef.current.duration || ANIMATION_DURATION);
      audioElRef.current.play().catch(() => {});
    }

    const tick = (now) => {
      const elapsed = (now - playStartRef.current) / 1000;
      const nextT = offsetRef.current + elapsed;
      if (nextT >= ANIMATION_DURATION) {
        setCurrentTime(ANIMATION_DURATION);
        setIsPlaying(false);
        return;
      }
      setCurrentTime(nextT);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, mutePreview, audioUrl]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= ANIMATION_DURATION - 0.05) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setTimeout(() => setIsPlaying(true), 20);
  };

  const activeSingleKey = viewMode === 'all' ? mobileFormat : viewMode;
  const selectedVideoFormat = VIDEO_FORMATS.find((f) => f.key === activeSingleKey);

  return (
    <section className="studio-card flex flex-col rounded-2xl p-4 sm:p-5">
      {audioUrl && <audio ref={audioElRef} src={audioUrl} preload="auto" muted={mutePreview} />}

      {/* Header & Switcher */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Live Studio Stage • 1 Poster + 3 Cinematic 10s Videos
          </span>
          <h2 className="font-serif text-lg font-bold text-stone-100">
            Real-Time Brand &amp; 3D Video Preview
          </h2>
        </div>

        {/* Desktop Switcher */}
        <div className="hidden flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1 lg:flex">
          {[
            { key: 'all', label: 'All 4 Live', icon: Columns3 },
            { key: 'poster', label: 'Static Poster', icon: ImageIcon },
            { key: '9:16', label: '9:16 Reel', icon: Smartphone },
            { key: '4:5', label: '4:5 Feed', icon: Square },
            { key: '16:9', label: '16:9 LED', icon: Monitor },
          ].map((btn) => {
            const Icon = btn.icon;
            const active = viewMode === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setViewMode(btn.key)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  active
                    ? 'bg-gold-400/20 text-gold-100 ring-1 ring-gold-400/40'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Mobile 4-Format Tabs */}
        <div className="grid w-full grid-cols-4 gap-1 rounded-xl border border-white/10 bg-black/40 p-1 lg:hidden">
          {[
            { key: 'poster', label: 'Poster' },
            { key: '9:16', label: '9:16' },
            { key: '4:5', label: '4:5' },
            { key: '16:9', label: '16:9 LED' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMobileFormat(tab.key)}
              className={`rounded-lg py-1.5 text-[11px] font-bold transition ${
                mobileFormat === tab.key
                  ? 'bg-gold-400/20 text-gold-100 ring-1 ring-gold-400/40'
                  : 'text-stone-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Canvas Stage */}
      <div
        key={fontsReadyTick}
        className="relative flex-1 rounded-2xl border border-white/5 bg-[#07080B] p-3 sm:p-4"
      >
        {stagingStudio && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/75 p-6 text-center backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-400/25 border-t-gold-300" />
            <p className="mt-3 font-serif text-base font-bold text-gold-100">
              Staging Ornament in Gemini AI Jewelry Studio...
            </p>
            <p className="mt-1 max-w-sm text-xs text-stone-300">
              Mounting on a matching plush velvet stand with studio rim lighting &amp; caching in Supabase for instant poster + 3-video export.
            </p>
          </div>
        )}

        {viewMode === 'all' ? (
          <>
            {/* Desktop All-4 Side-by-Side Workspace */}
            <div className="hidden lg:block lg:space-y-4">
              <div className="grid grid-cols-12 items-start gap-3.5">
                {/* 1. Static Luxury Poster (Top 58% + 42%→58% Fade + 28% Square Logo) */}
                <div className="col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
                    <span className="text-gold-200">
                      Static Poster {isAiStaged ? '• AI Studio' : ''}
                    </span>
                    <span>1080×1920</span>
                  </div>
                  <PosterCanvas
                    theme={theme}
                    rateData={rateData}
                    ornamentImage={ornamentImage}
                    logoImage={logoImage}
                    isAiStaged={isAiStaged}
                  />
                </div>

                {/* 2. 9:16 Cinematic Glassmorphism Reel */}
                <div className="col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
                    <span className="text-gold-200">9:16 Reel (10s)</span>
                    <span>Glass + 3D Finale</span>
                  </div>
                  <VideoFormatCanvas
                    formatSpec={VIDEO_FORMATS[0]}
                    theme={theme}
                    rateData={rateData}
                    ornamentImage={ornamentImage}
                    logoImage={logoImage}
                    isAiStaged={isAiStaged}
                    currentTime={currentTime}
                  />
                </div>

                {/* 3. 4:5 Feed Portrait Video */}
                <div className="col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400">
                    <span className="text-gold-200">4:5 Feed (10s)</span>
                    <span>1080×1350</span>
                  </div>
                  <VideoFormatCanvas
                    formatSpec={VIDEO_FORMATS[1]}
                    theme={theme}
                    rateData={rateData}
                    ornamentImage={ornamentImage}
                    logoImage={logoImage}
                    isAiStaged={isAiStaged}
                    currentTime={currentTime}
                  />
                </div>
              </div>

              {/* 4. 16:9 Landscape LED Wall Wide Showcase */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400">
                  <span className="text-gold-200">
                    16:9 Outdoor LED Wall Video (Unified {theme.name} • 10s)
                  </span>
                  <span>1920×1080 • Seamless 28%→42% Blend + All Rates + Official Logo Finale</span>
                </div>
                <VideoFormatCanvas
                  formatSpec={VIDEO_FORMATS[2]}
                  theme={theme}
                  rateData={rateData}
                  ornamentImage={ornamentImage}
                  logoImage={logoImage}
                  isAiStaged={isAiStaged}
                  currentTime={currentTime}
                />
              </div>
            </div>

            {/* Mobile Single Active Format */}
            <div
              className={`mx-auto lg:hidden ${
                mobileFormat === '16:9' ? 'max-w-full' : 'max-w-[340px]'
              }`}
            >
              {mobileFormat === 'poster' ? (
                <PosterCanvas
                  theme={theme}
                  rateData={rateData}
                  ornamentImage={ornamentImage}
                  logoImage={logoImage}
                  isAiStaged={isAiStaged}
                />
              ) : (
                selectedVideoFormat && (
                  <VideoFormatCanvas
                    formatSpec={selectedVideoFormat}
                    theme={theme}
                    rateData={rateData}
                    ornamentImage={ornamentImage}
                    logoImage={logoImage}
                    isAiStaged={isAiStaged}
                    currentTime={currentTime}
                  />
                )
              )}
            </div>
          </>
        ) : viewMode === 'poster' ? (
          <div className="mx-auto max-w-[390px]">
            <div className="mb-2 flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-gold-200">
                Luxury Static Poster (Top 58% Studio + 42%→58% Fade + 28% Square Logo)
              </span>
              <span>1080×1920</span>
            </div>
            <PosterCanvas
              theme={theme}
              rateData={rateData}
              ornamentImage={ornamentImage}
              logoImage={logoImage}
              isAiStaged={isAiStaged}
            />
          </div>
        ) : (
          selectedVideoFormat && (
            <div
              className={`mx-auto ${
                selectedVideoFormat.key === '16:9'
                  ? 'max-w-[820px]'
                  : selectedVideoFormat.key === '4:5'
                    ? 'max-w-[440px]'
                    : 'max-w-[360px]'
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold text-gold-200">{selectedVideoFormat.name}</span>
                <span>
                  {selectedVideoFormat.aspectLabel} • {selectedVideoFormat.styleLabel}
                </span>
              </div>
              <VideoFormatCanvas
                formatSpec={selectedVideoFormat}
                theme={theme}
                rateData={rateData}
                ornamentImage={ornamentImage}
                logoImage={logoImage}
                isAiStaged={isAiStaged}
                currentTime={currentTime}
              />
            </div>
          )
        )}
      </div>

      {/* Interactive 10.0s Cinematic Video Scrubber Bar */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="gold-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play 10s Video'}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-stone-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Replay
          </button>

          {audioUrl && (
            <button
              type="button"
              onClick={() => setMutePreview((m) => !m)}
              title={mutePreview ? 'Unmute jingle preview' : 'Mute jingle preview'}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-gold-300 hover:bg-white/10"
            >
              {mutePreview ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}

          <span className="ml-auto font-mono text-xs font-bold text-gold-200">
            {currentTime.toFixed(1)}s / {ANIMATION_DURATION.toFixed(1)}s
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={ANIMATION_DURATION}
          step="0.05"
          value={currentTime}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentTime(Number(e.target.value));
          }}
          className="mt-2.5 h-1.5 w-full cursor-pointer accent-gold-400"
        />

        <div className="mt-1.5 flex flex-wrap justify-between gap-1 text-[10px] text-stone-400">
          {TIMELINE_MILESTONES.map((m) => (
            <button
              key={m.t}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(m.t);
              }}
              className="rounded px-1.5 py-0.5 transition hover:bg-gold-500/15 hover:text-gold-200"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
