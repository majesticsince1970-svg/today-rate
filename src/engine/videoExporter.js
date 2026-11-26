import { ANIMATION_DURATION, VIDEO_FORMATS } from '../constants/themes';
import {
  ensureCanvasFontsLoaded,
  renderGoldRateFrame,
  renderStaticPosterFrame,
} from './canvasRenderer';
import { sanitizeDateForFilename } from '../utils/formatters';

export function selectBestVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: '', extension: 'webm' };
  }

  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ];

  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: '', extension: 'webm' };
}

/**
 * PART 1: Render Static High-Res Poster Image (1080 × 1920 PNG or JPG)
 * Top 55% staged ornament + vertical gradient fade + Bottom 45% adaptive typography + 28% official square logo.
 */
export async function exportStaticPoster({
  theme,
  rateData,
  ornamentImage,
  logoImage,
  isAiStaged = false,
  format = 'png',
}) {
  await ensureCanvasFontsLoaded();

  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  renderStaticPosterFrame(ctx, {
    width,
    height,
    theme,
    rateData,
    ornamentImage,
    logoImage,
    isAiStaged,
  });

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpg' ? 0.96 : 1.0;

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas failed to export poster image.'));
      },
      mimeType,
      quality
    );
  });

  const dateSlug = sanitizeDateForFilename(rateData.date);
  return {
    id: 'poster',
    name: 'Luxury Static Poster',
    aspectLabel: '9:16 • 1080×1920',
    blob,
    url: URL.createObjectURL(blob),
    mimeType,
    extension: format === 'jpg' ? 'jpg' : 'png',
    filename: `Majestic-Today-Rate-${dateSlug}.${format === 'jpg' ? 'jpg' : 'png'}`,
    sizeBytes: blob.size,
  };
}

async function setupBackgroundAudioTrack(audioUrl) {
  if (!audioUrl) return null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    const resp = await fetch(audioUrl);
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();

    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = audioBuffer.duration < ANIMATION_DURATION;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.85, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.85, audioCtx.currentTime + ANIMATION_DURATION - 0.8);
    gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + ANIMATION_DURATION);

    source.connect(gainNode);
    gainNode.connect(dest);

    return {
      audioCtx,
      source,
      tracks: dest.stream.getAudioTracks(),
      start: () => {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => { });
        }
        source.start(0);
      },
      cleanup: () => {
        try {
          source.stop();
        } catch {
          // ignore
        }
        audioCtx.close().catch(() => { });
      },
    };
  } catch {
    return null;
  }
}

/**
 * Render a single 10-second cinematic video format (9:16, 4:5, or 16:9)
 */
export async function exportAnimatedVideo({
  formatSpec,
  theme,
  rateData,
  ornamentImage,
  logoImage,
  isAiStaged = false,
  fps = 30,
  audioUrl = '',
  onProgress,
}) {
  const results = await exportVideosBatch({
    formatSpecs: [formatSpec],
    theme,
    rateData,
    ornamentImage,
    logoImage,
    isAiStaged,
    fps,
    audioUrl,
    onProgress: (id, pct) => {
      if (onProgress) onProgress(pct, id);
    },
  });
  return results[formatSpec.id];
}

/**
 * PART 2: Simultaneous 3-Video Cinematic 10-Second Canvas Exporter.
 * Records all requested formats concurrently in one synchronized 10-second render pass,
 * strictly sharing the exact selected Daily Color Theme, cached AI studio photo, and MP3 jingle.
 */
export async function exportVideosBatch({
  formatSpecs = VIDEO_FORMATS,
  theme,
  rateData,
  ornamentImage,
  logoImage,
  isAiStaged = false,
  fps = 30,
  audioUrl = '',
  onProgress,
}) {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('This browser does not support HTML5 Canvas video recording (MediaRecorder).');
  }

  await ensureCanvasFontsLoaded();
  const { mimeType, extension } = selectBestVideoMimeType();
  const audioSetup = await setupBackgroundAudioTrack(audioUrl);
  const dateSlug = sanitizeDateForFilename(rateData.date);

  const jobs = formatSpecs.map((spec) => {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Initial frame at t = 0
    renderGoldRateFrame(ctx, {
      width: spec.width,
      height: spec.height,
      formatKey: spec.key,
      theme,
      rateData,
      ornamentImage,
      logoImage,
      isAiStaged,
      time: 0,
    });

    const canvasStream = canvas.captureStream(fps);
    const combinedStream = new MediaStream();
    for (const vTrack of canvasStream.getVideoTracks()) {
      combinedStream.addTrack(vTrack);
    }
    if (audioSetup && audioSetup.tracks.length > 0) {
      for (const aTrack of audioSetup.tracks) {
        combinedStream.addTrack(aTrack.clone ? aTrack.clone() : aTrack);
      }
    }

    const recorderOptions = {
      videoBitsPerSecond: spec.width >= 1920 || spec.height >= 1920 ? 7_500_000 : 6_000_000,
      ...(mimeType ? { mimeType } : {}),
    };
    const recorder = new MediaRecorder(combinedStream, recorderOptions);
    const chunks = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    const stoppedPromise = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = (ev) => reject(ev.error || new Error(`Recorder error on ${spec.name}`));
    });

    return {
      spec,
      canvas,
      ctx,
      combinedStream,
      recorder,
      chunks,
      stoppedPromise,
    };
  });

  // Start all recorders synchronously
  for (const job of jobs) {
    job.recorder.start(250);
  }
  if (audioSetup) {
    audioSetup.start();
  }

  const startMs = performance.now();
  const durationMs = ANIMATION_DURATION * 1000;
  const holdTailMs = 180;

  await new Promise((resolve) => {
    let finished = false;
    const step = () => {
      if (finished) return;
      const elapsedMs = performance.now() - startMs;
      const clampedT = Math.min(ANIMATION_DURATION, elapsedMs / 1000);
      const pct = Math.min(99, Math.round((clampedT / ANIMATION_DURATION) * 100));

      for (const job of jobs) {
        renderGoldRateFrame(job.ctx, {
          width: job.spec.width,
          height: job.spec.height,
          formatKey: job.spec.key,
          theme,
          rateData,
          ornamentImage,
          logoImage,
          isAiStaged,
          time: clampedT,
        });
        if (onProgress) onProgress(job.spec.id, pct);
      }

      if (elapsedMs >= durationMs + holdTailMs) {
        finished = true;
        resolve();
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });

  // Stop all recorders & assemble blobs
  for (const job of jobs) {
    if (job.recorder.state !== 'inactive') {
      job.recorder.stop();
    }
  }
  await Promise.all(jobs.map((j) => j.stoppedPromise));

  if (audioSetup) {
    audioSetup.cleanup();
  }

  const outputMap = {};
  for (const job of jobs) {
    for (const track of job.combinedStream.getTracks()) {
      track.stop();
    }
    if (onProgress) onProgress(job.spec.id, 100);

    const finalMime = job.recorder.mimeType || mimeType || 'video/webm';
    const finalExt = finalMime.includes('mp4') ? 'mp4' : extension;
    const blob = new Blob(job.chunks, { type: finalMime });

    outputMap[job.spec.id] = {
      id: job.spec.id,
      name: job.spec.name,
      aspectLabel: job.spec.aspectLabel,
      blob,
      url: URL.createObjectURL(blob),
      mimeType: finalMime,
      extension: finalExt,
      filename: `${job.spec.filenamePrefix}-${dateSlug}.${finalExt}`,
      sizeBytes: blob.size,
      hasAudio: Boolean(audioSetup),
    };
  }

  return outputMap;
}

export function triggerFileDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
