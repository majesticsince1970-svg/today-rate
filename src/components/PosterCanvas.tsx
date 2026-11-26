import React, { useEffect, useRef } from 'react';
import { renderStaticPosterFrame } from '../engine/posterRenderer';

export interface PosterCanvasProps {
  theme: Record<string, unknown>;
  rateData: Record<string, unknown>;
  ornamentImage: HTMLImageElement | HTMLCanvasElement | null;
  logoImage: HTMLImageElement | null;
  isAiStaged: boolean;
  className?: string;
}

const PREVIEW_WIDTH = 540;
const PREVIEW_HEIGHT = 960;
const SCALE_RATIO = 0.5; // Maps full 1080×1920 virtual canvas cleanly into 540×960 live preview

/**
 * PosterCanvas: Crisp HTML5 Canvas component rendering the 1080×1920 Majestic Jewellers
 * Static Poster with top 58% AI Studio-Staged product photograph and smooth 42%→58%
 * vertical alpha/gradient dissolve into the solid bottom theme color.
 */
export default function PosterCanvas({
  theme,
  rateData,
  ornamentImage,
  logoImage,
  isAiStaged,
  className = 'h-auto w-full rounded-xl shadow-2xl ring-1 ring-gold-400/25',
}: PosterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(SCALE_RATIO, 0, 0, SCALE_RATIO, 0, 0);
    renderStaticPosterFrame(ctx, {
      width: 1080,
      height: 1920,
      theme,
      rateData,
      ornamentImage,
      logoImage,
      isAiStaged,
    });
    ctx.restore();
  }, [theme, rateData, ornamentImage, logoImage, isAiStaged]);

  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      className={className}
    />
  );
}
