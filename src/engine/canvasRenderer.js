import { ANIMATION_DURATION, BRAND_INFO } from '../constants/themes';
import { buildMalayalamStatusText, formatINR } from '../utils/formatters';
import {
  drawMajesticCrownVector,
  drawOfficialSquareLogoBox,
  drawPhoneIcon,
  drawRoundedRect,
  drawTrackedText,
  renderStaticPosterFrame,
} from './posterRenderer';

export { renderStaticPosterFrame };

// ---------- Easing & Timeline Helpers ----------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const easeOutQuart = (x) => 1 - Math.pow(1 - clamp01(x), 4);
const easeInOutCubic = (x) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const phase = (t, start, end) => clamp01((t - start) / Math.max(0.0001, end - start));

let fontsPreloaded = false;
export async function ensureCanvasFontsLoaded() {
  if (fontsPreloaded) return;
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.allSettled([
      document.fonts.load('700 50px "Cinzel"'),
      document.fonts.load('800 64px "Cinzel"'),
      document.fonts.load('700 48px "Playfair Display"'),
      document.fonts.load('800 66px "Playfair Display"'),
      document.fonts.load('700 34px "Noto Sans Malayalam"'),
      document.fonts.load('700 30px "Plus Jakarta Sans"'),
    ]);
    await document.fonts.ready;
    fontsPreloaded = true;
  } catch {
    // Proceed gracefully offline
  }
}

function createMetallicGoldGradient(ctx, x0, y0, x1, y1, bright = true) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  if (bright) {
    g.addColorStop(0, '#FFF8D6');
    g.addColorStop(0.24, '#F1CA69');
    g.addColorStop(0.48, '#FFFBE6');
    g.addColorStop(0.72, '#D8A236');
    g.addColorStop(1, '#9E6B15');
  } else {
    g.addColorStop(0, '#F5D684');
    g.addColorStop(0.3, '#C78E23');
    g.addColorStop(0.55, '#FBE29D');
    g.addColorStop(0.8, '#A97316');
    g.addColorStop(1, '#6B460B');
  }
  return g;
}

/**
 * Flowing animated luxury silk waves backdrop strictly synchronized to the selected Daily Color Theme
 */
function drawFlowingSilkBackdrop(ctx, W, H, t, theme) {
  ctx.save();

  const isLightTheme = theme?.mode === 'light';

  // Solid base strictly in selected theme color
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient radial studio depth within the exact same theme hue
  const base = ctx.createRadialGradient(
    W * 0.42,
    H * 0.35,
    Math.min(W, H) * 0.08,
    W * 0.5,
    H * 0.5,
    Math.max(W, H) * 0.85
  );
  base.addColorStop(0, theme.centerGlow);
  base.addColorStop(0.55, theme.primary);
  base.addColorStop(1, theme.edgeDark);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Subtle animated tonal silk sheen ribbons in the same theme palette
  const waveCount = 5;
  for (let i = 0; i < waveCount; i += 1) {
    const phaseShift = t * (0.42 + i * 0.07) + i * 1.15;
    const baseY = H * (0.14 + i * 0.18);
    const amp = H * (0.04 + (i % 3) * 0.015);

    ctx.beginPath();
    ctx.moveTo(0, baseY + Math.sin(phaseShift) * amp);
    ctx.bezierCurveTo(
      W * 0.33,
      baseY + Math.sin(phaseShift + 1.4) * amp * 1.3,
      W * 0.66,
      baseY + Math.cos(phaseShift + 0.7) * amp * 1.2,
      W,
      baseY + Math.sin(phaseShift + 2.2) * amp
    );
    ctx.lineTo(W, baseY + amp * 3.0);
    ctx.bezierCurveTo(
      W * 0.66,
      baseY + amp * 2.3 + Math.sin(phaseShift + 1.1) * amp,
      W * 0.33,
      baseY + amp * 2.6 + Math.cos(phaseShift + 0.5) * amp,
      0,
      baseY + amp * 2.8
    );
    ctx.closePath();

    const ribbonGrad = ctx.createLinearGradient(0, baseY - amp, W, baseY + amp * 2.6);
    if (isLightTheme) {
      ribbonGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      ribbonGrad.addColorStop(0.4, 'rgba(255, 253, 245, 0.25)');
      ribbonGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else {
      ribbonGrad.addColorStop(0, 'rgba(255, 244, 200, 0)');
      ribbonGrad.addColorStop(0.45, 'rgba(245, 208, 118, 0.05)');
      ribbonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = ribbonGrad;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Floating Golden Bokeh Dust Particles
 */
function drawGoldenBokeh(ctx, W, H, t, isLightBackdrop, count = 34) {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const h1 = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const h2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
    const rx = h1 - Math.floor(h1);
    const ry = h2 - Math.floor(h2);

    const driftX = (rx + Math.sin(t * 0.35 + i) * 0.018 + 1) % 1;
    const driftY = (ry - t * (0.018 + (i % 4) * 0.004) + 2) % 1;
    const px = driftX * W;
    const py = driftY * H;

    const twinkle = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.6 + i * 1.7), 2);
    const isLargeBokeh = i % 5 === 0;
    const radius = isLargeBokeh ? 10 + (i % 7) * 2.5 : 2.5 + (i % 4) * 1.1;

    ctx.globalAlpha = twinkle * (isLightBackdrop ? 0.42 : 0.62);

    if (isLargeBokeh) {
      const bokeh = ctx.createRadialGradient(px, py, 0, px, py, radius);
      bokeh.addColorStop(0, isLightBackdrop ? 'rgba(218, 165, 52, 0.85)' : 'rgba(255, 245, 200, 0.9)');
      bokeh.addColorStop(0.55, 'rgba(229, 185, 76, 0.32)');
      bokeh.addColorStop(1, 'rgba(229, 185, 76, 0)');
      ctx.fillStyle = bokeh;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (i % 3 === 0) {
      // 4-point star glint
      ctx.fillStyle = isLightBackdrop ? '#C78E23' : '#FFF7D6';
      ctx.beginPath();
      ctx.moveTo(px, py - radius * 2.1);
      ctx.lineTo(px + radius * 0.42, py - radius * 0.42);
      ctx.lineTo(px + radius * 2.1, py);
      ctx.lineTo(px + radius * 0.42, py + radius * 0.42);
      ctx.lineTo(px, py + radius * 2.1);
      ctx.lineTo(px - radius * 0.42, py + radius * 0.42);
      ctx.lineTo(px - radius * 2.1, py);
      ctx.lineTo(px - radius * 0.42, py - radius * 0.42);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = isLightBackdrop ? '#D49E32' : '#FFE89E';
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Swirling Golden Particle Vortex / Ribbon Trail (used for 0.0-2.5s entrance & 7.8-9.2s logo finale)
 */
function drawParticleSwirl(ctx, cx, cy, maxRadius, progress, burstMode = false) {
  if (progress <= 0.001 || progress >= 0.999) return;
  const fade = Math.sin(progress * Math.PI);
  const count = burstMode ? 54 : 42;

  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const frac = i / count;
    const angle = frac * Math.PI * (burstMode ? 2 : 4.5) + progress * (burstMode ? 2.4 : 6.2);
    const radius = burstMode
      ? maxRadius * (0.1 + progress * 1.15) * (0.55 + 0.45 * Math.sin(i * 19.3))
      : maxRadius * (1.15 - progress * 0.85) * (0.45 + 0.55 * frac);

    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius * (burstMode ? 0.95 : 0.65);
    const size = (2.5 + (i % 5) * 1.4) * fade;

    ctx.globalAlpha = fade * (0.45 + 0.55 * Math.sin(i * 7.1 + progress * 8));
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : i % 2 === 0 ? '#FFF1B8' : '#E5B242';
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw Ornament with Simulated 3D Y-Axis Turn/Sway (-18deg to +18deg), realistic cast floor shadow,
 * and metallic diamond glint sweep
 */
function draw3DOrnamentStage(ctx, { cx, cy, maxW, maxH, ornamentImage, t, alpha = 1, isLightBackdrop, swayDeg = 18 }) {
  if (!ornamentImage || alpha <= 0.005) return;

  // Smooth 3D perspective sway: -18deg -> +18deg -> gentle breathing sway
  const introTurn = easeInOutCubic(phase(t, 0.3, 2.5));
  const angleDeg =
    t < 2.5
      ? -swayDeg + swayDeg * 2 * introTurn
      : swayDeg * Math.cos((t - 2.5) * 0.85) * 0.55;
  const rad = (angleDeg * Math.PI) / 180;
  const scaleX = Math.cos(rad);
  const skewY = Math.sin(rad) * 0.045;
  const floatY = Math.sin(t * 1.8) * 9;

  const sw = ornamentImage.naturalWidth || ornamentImage.width || 800;
  const sh = ornamentImage.naturalHeight || ornamentImage.height || 620;
  const fit = Math.min(maxW / sw, maxH / sh);
  const dw = sw * fit;
  const dh = sh * fit;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Realistic cast floor shadow shifting gently with 3D turn
  const floorY = cy + dh * 0.48 + 38;
  const shadowShiftX = Math.sin(rad) * 28;
  const shadowRx = dw * 0.44 * (0.9 + 0.1 * Math.abs(scaleX));
  const floorShadow = ctx.createRadialGradient(
    cx + shadowShiftX,
    floorY,
    8,
    cx + shadowShiftX,
    floorY,
    shadowRx
  );
  floorShadow.addColorStop(0, isLightBackdrop ? 'rgba(72, 48, 22, 0.34)' : 'rgba(0, 0, 0, 0.65)');
  floorShadow.addColorStop(0.55, isLightBackdrop ? 'rgba(72, 48, 22, 0.12)' : 'rgba(0, 0, 0, 0.25)');
  floorShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.translate(cx + shadowShiftX, floorY);
  ctx.scale(1, 0.22);
  ctx.fillStyle = floorShadow;
  ctx.beginPath();
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Warm ambient studio aura behind ornament
  const aura = ctx.createRadialGradient(cx, cy + floatY, 18, cx, cy + floatY, Math.max(dw, dh) * 0.62);
  aura.addColorStop(0, isLightBackdrop ? 'rgba(255, 245, 214, 0.55)' : 'rgba(248, 215, 126, 0.24)');
  aura.addColorStop(1, 'rgba(248, 215, 126, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy + floatY, Math.max(dw, dh) * 0.62, 0, Math.PI * 2);
  ctx.fill();

  // 3D Transformed Ornament
  ctx.save();
  ctx.translate(cx, cy + floatY);
  ctx.transform(scaleX, skewY, 0, 1, 0, 0);
  ctx.shadowColor = isLightBackdrop ? 'rgba(65, 42, 18, 0.28)' : 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  ctx.drawImage(ornamentImage, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  // Diamond / gold sparkle glints dancing along ornament peaks
  for (let i = 0; i < 4; i += 1) {
    const pulse = Math.pow(Math.max(0, Math.sin(t * 3.1 + i * 1.9)), 4);
    if (pulse > 0.08) {
      const gx = cx + Math.cos(i * 2.1 + 0.5) * dw * 0.26 * scaleX;
      const gy = cy + floatY + Math.sin(i * 2.3) * dh * 0.22;
      const gs = 14 * pulse;
      ctx.save();
      ctx.globalAlpha = alpha * pulse;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(gx, gy - gs * 1.8);
      ctx.lineTo(gx + gs * 0.28, gy - gs * 0.28);
      ctx.lineTo(gx + gs * 1.8, gy);
      ctx.lineTo(gx + gs * 0.28, gy + gs * 0.28);
      ctx.lineTo(gx, gy + gs * 1.8);
      ctx.lineTo(gx - gs * 0.28, gy + gs * 0.28);
      ctx.lineTo(gx - gs * 1.8, gy);
      ctx.lineTo(gx - gs * 0.28, gy - gs * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Thick 3D Metallic Gold Embossed Typography (with stacked extrusion depth, specular gradient,
 * and traveling highlight glint)
 */
function draw3DEmbossedText(ctx, text, x, y, { font, align = 'left', maxWidth, isLightBackdrop, glintProgress = 0, extrudeDepth = 4 }) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // Extruded 3D metallic thickness layers
  for (let d = extrudeDepth; d >= 1; d -= 1) {
    ctx.fillStyle = isLightBackdrop
      ? `rgba(110, 72, 16, ${0.42 + (extrudeDepth - d) * 0.1})`
      : `rgba(74, 46, 8, ${0.55 + (extrudeDepth - d) * 0.1})`;
    ctx.fillText(text, x + d * 0.7, y + d * 1.15, maxWidth);
  }

  // Soft studio drop shadow
  ctx.shadowColor = isLightBackdrop ? 'rgba(62, 38, 12, 0.28)' : 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // Metallic front face gradient
  const gradW = maxWidth || 620;
  const gx0 = align === 'center' ? x - gradW / 2 : x;
  const g = createMetallicGoldGradient(ctx, gx0, y - 36, gx0 + gradW, y + 36, !isLightBackdrop);
  ctx.fillStyle = g;
  ctx.fillText(text, x, y, maxWidth);

  // Subtle traveling specular sheen flash
  if (glintProgress > 0 && glintProgress < 1) {
    ctx.shadowColor = 'transparent';
    const flash = Math.sin(glintProgress * Math.PI);
    ctx.fillStyle = `rgba(255, 252, 232, ${0.45 * flash})`;
    ctx.fillText(text, x, y, maxWidth);
  }
  ctx.restore();
}

/**
 * FULL-SCREEN 3D SPINNING METALLIC GOLD MAJESTIC JEWELLERS LOGO FINALE (7.8s – 10.0s)
 * Shared centerpiece across 16:9 LED Wall, 9:16 Reel, and 4:5 Portrait Feed!
 */
function draw3DSpinningLogoFinale(ctx, W, H, t, logoImage, isLightBackdrop) {
  const finaleP = phase(t, 7.8, 10.0);
  if (finaleP <= 0.001) return;

  const cx = W / 2;
  const cy = H * 0.48;

  // Swirling golden sparkle ribbon / burst ushering in the finale
  const ribbonP = phase(t, 7.8, 9.15);
  drawParticleSwirl(ctx, cx, cy, Math.min(W, H) * 0.54, ribbonP, true);

  // Smooth 3D Y-axis spin (360° / 180° heroic spin settling into locked front-facing pose by 9.35s)
  const spinP = easeOutQuart(phase(t, 7.95, 9.45));
  const fadeP = easeOutCubic(phase(t, 7.9, 8.55));
  const scalePop = 0.72 + 0.28 * spinP;

  // Full 180-degree royal coin-spin into locked front view (angle: PI -> 0)
  const angle = (1 - spinP) * Math.PI;
  const cosX = Math.cos(angle);
  const absCosX = Math.max(0.05, Math.abs(cosX));
  const tiltY = Math.sin(angle) * 0.05;

  const heroW = Math.min(W * 0.68, H * 0.68);
  const heroH = heroW * 0.84;

  ctx.save();
  ctx.globalAlpha = fadeP;

  // Radiant golden studio backlight behind spinning 3D logo
  const backGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, heroW * 0.72);
  backGlow.addColorStop(
    0,
    isLightBackdrop ? 'rgba(230, 178, 70, 0.34)' : 'rgba(251, 224, 140, 0.32)'
  );
  backGlow.addColorStop(0.55, 'rgba(212, 163, 89, 0.08)');
  backGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = backGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, heroW * 0.72, 0, Math.PI * 2);
  ctx.fill();

  // Realistic Studio Floor Shadow beneath the 3D logo (stretches/contracts with Y-spin!)
  const floorY = cy + heroH * 0.56;
  const shadowRx = heroW * 0.42 * (0.35 + 0.65 * absCosX);
  const shadowGrad = ctx.createRadialGradient(cx, floorY, 6, cx, floorY, shadowRx);
  shadowGrad.addColorStop(0, isLightBackdrop ? 'rgba(72, 48, 22, 0.36)' : 'rgba(0, 0, 0, 0.7)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.translate(cx, floorY);
  ctx.scale(1, 0.16);
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3D Metallic Extrusion Slices + Front Logo Face
  const drawLogoFace = (offsetX, offsetY, alphaScale) => {
    ctx.save();
    ctx.globalAlpha = fadeP * alphaScale;
    ctx.translate(cx + offsetX, cy + offsetY);
    ctx.scale(absCosX * scalePop, scalePop);
    ctx.transform(1, tiltY, 0, 1, 0, 0);

    if (logoImage) {
      const sw = logoImage.naturalWidth || logoImage.width || 604;
      const sh = logoImage.naturalHeight || logoImage.height || 503;
      const fit = Math.min(heroW / sw, heroH / sh);
      const dw = sw * fit;
      const dh = sh * fit;
      ctx.drawImage(logoImage, -dw / 2, -dh / 2, dw, dh);
    } else {
      const g = createMetallicGoldGradient(ctx, -heroW / 2, -heroH / 2, heroW / 2, heroH / 2, true);
      drawMajesticCrownVector(ctx, 0, 0, heroW, heroH, g);
    }
    ctx.restore();
  };

  // Subtle 3D thickness edge layers visible during the turn
  const thicknessDir = Math.sin(angle) >= 0 ? 1 : -1;
  const edgeLayers = Math.round(10 * Math.abs(Math.sin(angle))) + 3;
  for (let l = edgeLayers; l >= 1; l -= 1) {
    drawLogoFace(thicknessDir * l * 1.15, l * 0.5, 0.18);
  }

  // Front crisp metallic face
  ctx.save();
  ctx.shadowColor = isLightBackdrop ? 'rgba(92, 60, 18, 0.34)' : 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  drawLogoFace(0, 0, 1);
  ctx.restore();

  // Traveling metallic sheen flare right as logo locks into front hero pose (9.0s – 9.85s)
  const glintP = phase(t, 8.95, 9.85);
  if (glintP > 0 && glintP < 1) {
    const flareX = cx - heroW * 0.45 + heroW * 0.9 * glintP;
    const flareY = cy - heroH * 0.12;
    const flareR = heroW * 0.34;
    const flare = ctx.createRadialGradient(flareX, flareY, 2, flareX, flareY, flareR);
    flare.addColorStop(0, `rgba(255, 252, 232, ${0.55 * Math.sin(glintP * Math.PI)})`);
    flare.addColorStop(1, 'rgba(255, 252, 232, 0)');
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(flareX, flareY, flareR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle heritage tagline & website settling cleanly under the locked hero logo
  const tagP = easeOutCubic(phase(t, 8.8, 9.6));
  if (tagP > 0.01) {
    ctx.save();
    ctx.globalAlpha = tagP;
    const tagY = Math.min(H - 68, floorY + 54);
    ctx.font = `700 ${Math.round(Math.min(W, H) * 0.025)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = isLightBackdrop ? '#5A3A14' : '#F6E2A8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawTrackedText(
      ctx,
      `${BRAND_INFO.website.toUpperCase()}  •  ${BRAND_INFO.phonePrimary}`,
      cx,
      tagY,
      2.2
    );
    ctx.restore();
  }

  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#0E3B2C').replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Draw AI Studio-Staged product photograph into Top 58% of vertical video (9:16 / 4:5)
 * with cinematic Ken Burns breathing, diamond glints, and smooth 42%→58% vertical fade mask.
 */
function drawStagedVerticalHero(ctx, { W, H, ornamentImage, theme, t, alpha }) {
  if (!ornamentImage || alpha <= 0.005) return;

  const topH = Math.round(H * 0.58);
  const fadeStartY = Math.round(H * 0.42);
  const sw = ornamentImage.naturalWidth || ornamentImage.width || 1024;
  const sh = ornamentImage.naturalHeight || ornamentImage.height || 1024;

  // Gentle cinematic Ken Burns zoom + subtle horizontal velvet parallax
  const zoom = 1.04 + 0.065 * clamp01(t / 7.8);
  const panX = Math.sin(t * 0.65) * 14;
  const coverScale = Math.max(W / sw, topH / sh) * zoom;
  const dw = sw * coverScale;
  const dh = sh * coverScale;
  const dx = (W - dw) / 2 + panX;
  const dy = Math.min(0, (topH - dh) * 0.25);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(0, 0, W, topH);
  ctx.clip();
  ctx.drawImage(ornamentImage, dx, dy, dw, dh);

  // Smooth vertical gradient dissolve from 42% to 58% height into the theme color
  const vertFade = ctx.createLinearGradient(0, fadeStartY, 0, topH);
  vertFade.addColorStop(0, hexToRgba(theme.primary, 0));
  vertFade.addColorStop(0.38, hexToRgba(theme.primary, 0.38));
  vertFade.addColorStop(0.75, hexToRgba(theme.primary, 0.86));
  vertFade.addColorStop(1, hexToRgba(theme.primary, 1));
  ctx.fillStyle = vertFade;
  ctx.fillRect(0, fadeStartY, W, topH - fadeStartY + 4);
  ctx.restore();
}

/**
 * Draw Studio-Staged Ornament on the Left 42% of the 16:9 LED Wall Canvas
 * with a smooth horizontal gradient feather (transparent at 28% width -> 100% solid theme.primary
 * from 42% to 100% width) so there are ZERO hard vertical box edges.
 */
function drawStagedLandscapeHero(ctx, { W, H, ornamentImage, theme, t, alpha, centerOffsetFrac = 0 }) {
  if (!ornamentImage || alpha <= 0.005) return;

  const featherStart = Math.round(W * 0.28); // 28% width
  const stageEnd = Math.round(W * 0.42); // 42% width
  const sw = ornamentImage.naturalWidth || ornamentImage.width || 1024;
  const sh = ornamentImage.naturalHeight || ornamentImage.height || 1024;

  // Gentle 3D shimmer zoom + subtle sway
  const zoom = 1.05 + 0.065 * clamp01(t / 8.0);
  const swayX = Math.sin(t * 0.9) * 10 + centerOffsetFrac * W;
  const coverScale = Math.max((stageEnd + 80) / sw, H / sh) * zoom;
  const dw = sw * coverScale;
  const dh = sh * coverScale;
  const dx = (stageEnd - dw) / 2 + swayX;
  const dy = (H - dh) * 0.26;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(0, 0, stageEnd + 2, H);
  ctx.clip();
  ctx.drawImage(ornamentImage, dx, dy, dw, dh);

  // Smooth horizontal gradient feather: transparent at 28% width -> 100% solid theme color at 42% width
  const horizFade = ctx.createLinearGradient(featherStart, 0, stageEnd, 0);
  horizFade.addColorStop(0, hexToRgba(theme.primary, 0));
  horizFade.addColorStop(0.4, hexToRgba(theme.primary, 0.45));
  horizFade.addColorStop(0.78, hexToRgba(theme.primary, 0.88));
  horizFade.addColorStop(1, hexToRgba(theme.primary, 1));
  ctx.fillStyle = horizFade;
  ctx.fillRect(featherStart, 0, stageEnd - featherStart + 4, H);

  // Soft bottom & top edge dissolve into unified theme color
  const botFade = ctx.createLinearGradient(0, H * 0.78, 0, H);
  botFade.addColorStop(0, hexToRgba(theme.primary, 0));
  botFade.addColorStop(1, hexToRgba(theme.primary, 0.92));
  ctx.fillStyle = botFade;
  ctx.fillRect(0, H * 0.78, stageEnd, H * 0.22);

  const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.1);
  topFade.addColorStop(0, hexToRgba(theme.primary, 0.65));
  topFade.addColorStop(1, hexToRgba(theme.primary, 0));
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, stageEnd, H * 0.1);

  // Subtle diagonal gold light shimmer during 0.4s – 2.3s entrance
  const shimmerP = phase(t, 0.4, 2.3);
  if (shimmerP > 0 && shimmerP < 1) {
    const sx = -200 + (stageEnd + 400) * shimmerP;
    const sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, H * 0.6);
    sg.addColorStop(0, 'rgba(255, 248, 215, 0)');
    sg.addColorStop(0.5, `rgba(255, 248, 215, ${0.28 * Math.sin(shimmerP * Math.PI)})`);
    sg.addColorStop(1, 'rgba(255, 248, 215, 0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, stageEnd, H);
  }

  ctx.restore();
}

/**
 * Full-Screen Official Majestic Jewellers (Since 1970) Emerald & Gold Crown Logo Finale
 * for 16:9 LED Wall (8.0s – 10.0s) with sweeping golden light gleam!
 */
function drawLEDWallLogoFinale(ctx, W, H, t, logoImage, theme) {
  const finaleP = phase(t, 8.0, 10.0);
  if (finaleP <= 0.001) return;

  const isLight = theme.mode === 'light';
  const cx = W / 2;
  const cy = H * 0.47;

  // Radial golden sparkle burst ushering in the finale
  drawParticleSwirl(ctx, cx, cy, 460, phase(t, 7.95, 9.2), true);

  const revealP = easeOutQuart(phase(t, 8.0, 9.05));
  const scale = 0.8 + 0.2 * revealP;
  const angle = (1 - revealP) * Math.PI * 0.45; // Smooth luxury 3D turn into locked front hero pose
  const cosX = Math.max(0.15, Math.cos(angle));
  const logoBoxSize = 560;

  ctx.save();
  ctx.globalAlpha = easeOutCubic(phase(t, 8.0, 8.5));

  // Warm golden backlight halo behind the official emerald & gold crown logo
  const halo = ctx.createRadialGradient(cx, cy, 40, cx, cy, 480);
  halo.addColorStop(0, 'rgba(245, 208, 118, 0.32)');
  halo.addColorStop(0.55, 'rgba(212, 163, 89, 0.08)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 480, 0, Math.PI * 2);
  ctx.fill();

  // Official Square Emerald (#0E3B2C) & Gold (#D4A359) Crown Logo scaled large in center
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(cosX * scale, scale);
  drawOfficialSquareLogoBox(ctx, -logoBoxSize / 2, -logoBoxSize / 2, logoBoxSize, logoImage);

  // Diagonal golden light sweep across the locked official logo (8.8s – 9.85s)
  const sweepP = phase(t, 8.8, 9.85);
  if (sweepP > 0 && sweepP < 1) {
    ctx.beginPath();
    drawRoundedRect(ctx, -logoBoxSize / 2, -logoBoxSize / 2, logoBoxSize, logoBoxSize, 8);
    ctx.clip();
    const sx = -logoBoxSize * 0.9 + logoBoxSize * 1.8 * sweepP;
    const sweepGrad = ctx.createLinearGradient(sx - 110, -logoBoxSize / 2, sx + 110, logoBoxSize / 2);
    sweepGrad.addColorStop(0, 'rgba(255, 250, 224, 0)');
    sweepGrad.addColorStop(0.5, `rgba(255, 250, 224, ${0.42 * Math.sin(sweepP * Math.PI)})`);
    sweepGrad.addColorStop(1, 'rgba(255, 250, 224, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(-logoBoxSize / 2, -logoBoxSize / 2, logoBoxSize, logoBoxSize);
  }
  ctx.restore();

  // Crisp store contact tagline underneath the large official logo
  const tagP = easeOutCubic(phase(t, 8.6, 9.3));
  if (tagP > 0.01) {
    ctx.save();
    ctx.globalAlpha = tagP;
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isLight ? theme.textPrimary : '#F5D076';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawTrackedText(
      ctx,
      `${BRAND_INFO.website.toUpperCase()}   •   ${BRAND_INFO.phonePrimary}   •   ${BRAND_INFO.phoneSecondary}`,
      cx,
      H * 0.865,
      2.5
    );
    ctx.restore();
  }

  ctx.restore();
}

/**
 * VIDEO A — 16:9 LANDSCAPE / OUTDOOR LED WALL (1920 × 1080, 10.0s)
 * - 100% Unified Daily Color Theme (ZERO split white/cream mismatch)
 * - Left 42% ornament with seamless horizontal gradient feather (28% → 42% solid theme color)
 * - Right 58% High-Contrast Outdoor LED Wall Typography (Pure White #FFFFFF + Bright Gold #F5D076)
 * - Clean 3-Stage Choreography:
 *     0.0s – 2.5s: Ornament Showcase (3D gentle turn/shimmer, settles into left 42%)
 *     2.5s – 8.0s: ALL Gold Rates (22K 1G & 8G, 18K, 9K, Malayalam Pavan Banner, Bottom Bar) clearly visible together
 *     8.0s – 10.0s: Full-Screen Official Majestic Jewellers (Since 1970) Emerald & Gold Crown Logo Finale
 */
function renderLandscapeLEDVideo(ctx, { width: W, height: H, theme, rateData, ornamentImage, logoImage, time: t, isAiStaged }) {
  const isLight = theme.mode === 'light';

  // 1. Unified Single-Color Theme Background across the ENTIRE 1920×1080 canvas
  drawFlowingSilkBackdrop(ctx, W, H, t, theme);

  // Smooth exit fade of the main showcase right before 8.0s Logo Finale
  const mainAlpha = 1 - easeInOutCubic(phase(t, 7.8, 8.2));

  // ---- STAGE 1 (0.0s – 2.5s) & Persistent Left 42% Ornament Showcase (up to 8.0s) ----
  if (mainAlpha > 0.01) {
    const enterP = easeOutCubic(phase(t, 0.1, 1.4));
    const settleP = easeInOutCubic(phase(t, 1.55, 2.5));

    if (isAiStaged) {
      drawStagedLandscapeHero(ctx, {
        W,
        H,
        ornamentImage,
        theme,
        t,
        alpha: enterP * mainAlpha,
        centerOffsetFrac: 0.04 * (1 - settleP),
      });
      // Ensure 42%..100% right side blends seamlessly with 100% unified theme color
      const rightStart = Math.round(W * 0.42);
      ctx.save();
      ctx.globalAlpha = mainAlpha;
      ctx.fillStyle = theme.primary;
      ctx.fillRect(rightStart, 0, W - rightStart, H);
      const rightGlow = ctx.createRadialGradient(
        W * 0.72,
        H * 0.42,
        40,
        W * 0.72,
        H * 0.48,
        W * 0.42
      );
      rightGlow.addColorStop(0, isLight ? 'rgba(255,255,255,0.18)' : 'rgba(245, 208, 118, 0.06)');
      rightGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(rightStart, 0, W - rightStart, H);
      ctx.restore();

      drawParticleSwirl(ctx, W * 0.21, H * 0.48, 320, phase(t, 0.0, 1.9), false);
    } else {
      // Non-AI-staged ornament smoothly enters center-left and settles into left 42%
      const ornCx = W * (0.34 - 0.13 * settleP);
      const ornCy = H * 0.5;
      drawParticleSwirl(ctx, ornCx, ornCy, 340, phase(t, 0.0, 1.9), false);
      draw3DOrnamentStage(ctx, {
        cx: ornCx,
        cy: ornCy,
        maxW: W * 0.34,
        maxH: H * 0.74,
        ornamentImage,
        t,
        alpha: enterP * mainAlpha,
        isLightBackdrop: isLight,
        swayDeg: 18,
      });
    }
  }

  // Floating Golden Bokeh across entire unified 1920×1080 backdrop
  drawGoldenBokeh(ctx, W, H, t, isLight, 38);

  // Subtle thin gold perimeter frame
  ctx.save();
  ctx.strokeStyle = isLight ? 'rgba(138, 94, 20, 0.38)' : 'rgba(245, 208, 118, 0.34)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 26, 26, W - 52, H - 52, 16);
  ctx.stroke();
  ctx.restore();

  // ---- STAGE 2 (2.5s – 8.0s): ALL GOLD RATES CLEARLY DISPLAYED TOGETHER ON RIGHT 58% ----
  if (t >= 2.45 && mainAlpha > 0.01) {
    const rightStart = Math.round(W * 0.42); // 806px
    const rightW = W - rightStart - 64; // 1050px usable width
    const rightCx = rightStart + rightW / 2 + 12; // ~1343px

    // High-contrast outdoor LED color tokens
    const brightGold = isLight ? '#7A4F0A' : '#F5D076';
    const crispWhite = isLight ? theme.textPrimary : '#FFFFFF';
    const boxSurface = isLight ? 'rgba(255, 252, 245, 0.65)' : 'rgba(0, 0, 0, 0.28)';

    // 1. Top Header: "TODAY'S GOLD RATE" + Date Pill Badge (2.5s – 8.0s)
    const headP = easeOutCubic(phase(t, 2.5, 3.05)) * mainAlpha;
    if (headP > 0.01) {
      const slideY = (1 - easeOutCubic(phase(t, 2.5, 3.05))) * 24;
      ctx.save();
      ctx.globalAlpha = headP;

      ctx.font = '800 62px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.fillStyle = brightGold;
      ctx.textBaseline = 'middle';
      if (!isLight) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 5;
      }
      drawTrackedText(ctx, "TODAY'S GOLD RATE", rightCx, 108 + slideY, 5.5);
      ctx.shadowColor = 'transparent';

      // Crisp Gold-Bordered Date Pill Badge right below header
      const pillW = 360;
      const pillH = 54;
      const py = 184 + slideY;
      drawRoundedRect(ctx, rightCx - pillW / 2, py - pillH / 2, pillW, pillH, pillH / 2);
      ctx.fillStyle = boxSurface;
      ctx.fill();
      ctx.strokeStyle = brightGold;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.font = '700 30px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.fillStyle = crispWhite;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawTrackedText(ctx, String(rateData.date || '').toUpperCase(), rightCx, py + 1, 3.5);
      ctx.restore();
    }

    // 2. Prominent 22K Gold Highlight Split Box (2.7s – 8.0s, ALWAYS visible!)
    const boxP = easeOutQuart(phase(t, 2.68, 3.25)) * mainAlpha;
    if (boxP > 0.01) {
      const bw = Math.min(960, rightW - 24);
      const bh = 250;
      const bx = rightCx - bw / 2;
      const by = 248;
      const scalePop = 0.94 + 0.06 * easeOutQuart(phase(t, 2.68, 3.25));

      ctx.save();
      ctx.globalAlpha = boxP;
      ctx.translate(rightCx, by + bh / 2);
      ctx.scale(scalePop, scalePop);
      ctx.translate(-rightCx, -(by + bh / 2));

      // Dark translucent luxury surface + bright gold border
      drawRoundedRect(ctx, bx, by, bw, bh, 22);
      ctx.fillStyle = boxSurface;
      ctx.fill();
      ctx.strokeStyle = brightGold;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Inner hairline
      drawRoundedRect(ctx, bx + 8, by + 8, bw - 16, bh - 16, 15);
      ctx.strokeStyle = isLight ? 'rgba(122, 79, 10, 0.25)' : 'rgba(245, 208, 118, 0.32)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Top centered "22K GOLD • 916" badge overlapping top border
      const badgeW = 240;
      const badgeH = 38;
      drawRoundedRect(ctx, rightCx - badgeW / 2, by - badgeH / 2, badgeW, badgeH, badgeH / 2);
      ctx.fillStyle = isLight ? theme.textPrimary : '#F5D076';
      ctx.fill();
      ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isLight ? '#FFF8EB' : '#181004';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('22K GOLD • 916', rightCx, by + 1);

      // Center vertical gold divider
      ctx.strokeStyle = brightGold;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(rightCx, by + 32);
      ctx.lineTo(rightCx, by + bh - 24);
      ctx.stroke();

      const colLeft = bx + bw * 0.25;
      const colRight = bx + bw * 0.75;

      // "1 GRAM" & "8 GRAM" bright gold labels
      ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = brightGold;
      ctx.fillText('1 GRAM', colLeft, by + 76);
      ctx.fillText('8 GRAM', colRight, by + 76);

      // Large Bold Crisp White Numbers for outdoor LED visibility
      ctx.font = '800 88px "Playfair Display", Georgia, serif';
      ctx.fillStyle = crispWhite;
      if (!isLight) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
      }
      ctx.fillText(`₹${formatINR(rateData.rate_22k_1g)}`, colLeft, by + 168, bw * 0.45);
      ctx.fillText(`₹${formatINR(rateData.rate_22k_8g)}`, colRight, by + 168, bw * 0.45);
      ctx.shadowColor = 'transparent';

      // Periodic subtle metallic glint sweep across the 22K box (at 3.6s and 6.0s)
      for (const glintStart of [3.5, 5.9]) {
        const gp = phase(t, glintStart, glintStart + 1.1);
        if (gp > 0 && gp < 1) {
          ctx.save();
          drawRoundedRect(ctx, bx, by, bw, bh, 22);
          ctx.clip();
          const gx = bx - 220 + (bw + 440) * gp;
          const gg = ctx.createLinearGradient(gx - 110, by, gx + 110, by + bh * 0.55);
          gg.addColorStop(0, 'rgba(255, 250, 225, 0)');
          gg.addColorStop(0.5, `rgba(255, 250, 225, ${0.28 * Math.sin(gp * Math.PI)})`);
          gg.addColorStop(1, 'rgba(255, 250, 225, 0)');
          ctx.fillStyle = gg;
          ctx.fillRect(bx, by, bw, bh);
          ctx.restore();
        }
      }

      ctx.restore();
    }

    // 3. Secondary Rates: "18K - ₹.../GRAM" & "9K - ₹.../GRAM" (2.9s – 8.0s)
    const subP = easeOutCubic(phase(t, 2.92, 3.42)) * mainAlpha;
    if (subP > 0.01) {
      const slideY = (1 - easeOutCubic(phase(t, 2.92, 3.42))) * 20;
      ctx.save();
      ctx.globalAlpha = subP;
      ctx.font = '800 37px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = crispWhite;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `18K - ₹${formatINR(rateData.rate_18k_1g)} / GRAM    ◆    9K - ₹${formatINR(
          rateData.rate_9k_1g
        )} / GRAM`,
        rightCx,
        566 + slideY,
        rightW - 20
      );
      ctx.restore();
    }

    // 4. Malayalam Pavan Change Pill Banner (3.1s – 8.0s)
    const malP = easeOutCubic(phase(t, 3.1, 3.6)) * mainAlpha;
    if (malP > 0.01) {
      const malText =
        (rateData.customMalayalamText || '').trim() ||
        buildMalayalamStatusText(rateData.change_1g, rateData.trend);
      const arrow = rateData.trend === 'UP' ? '▲ ' : rateData.trend === 'DOWN' ? '▼ ' : '● ';
      const displayMal = `${arrow}${malText}`;
      const slideY = (1 - easeOutCubic(phase(t, 3.1, 3.6))) * 20;
      const my = 666 + slideY;

      ctx.save();
      ctx.globalAlpha = malP;
      ctx.font = '800 40px "Noto Sans Malayalam", sans-serif';
      const mw = Math.min(rightW - 24, ctx.measureText(displayMal).width + 78);
      const mh = 84;

      drawRoundedRect(ctx, rightCx - mw / 2, my - mh / 2, mw, mh, mh / 2);
      if (isLight) {
        ctx.fillStyle =
          rateData.trend === 'DOWN'
            ? 'rgba(153, 27, 27, 0.14)'
            : 'rgba(14, 92, 60, 0.14)';
        ctx.fill();
        ctx.strokeStyle = rateData.trend === 'DOWN' ? '#991B1B' : '#0E6B45';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.fillStyle = rateData.trend === 'DOWN' ? '#7F1D1D' : '#0A472E';
      } else {
        ctx.fillStyle =
          rateData.trend === 'DOWN'
            ? 'rgba(153, 27, 27, 0.78)'
            : rateData.trend === 'UP'
              ? 'rgba(6, 95, 70, 0.82)'
              : 'rgba(133, 94, 22, 0.72)';
        ctx.fill();
        ctx.strokeStyle =
          rateData.trend === 'DOWN'
            ? '#FCA5A5'
            : rateData.trend === 'UP'
              ? '#6EE7B7'
              : '#F5D076';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayMal, rightCx, my + 2, mw - 42);
      ctx.restore();
    }

    // 5. Bottom Outdoor LED Contact Bar (3.25s – 8.0s)
    const footP = easeOutCubic(phase(t, 3.25, 3.75)) * mainAlpha;
    if (footP > 0.01) {
      ctx.save();
      ctx.globalAlpha = footP;

      // Subtle gold divider rule
      ctx.strokeStyle = isLight ? 'rgba(122, 79, 10, 0.3)' : 'rgba(245, 208, 118, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rightCx - rightW * 0.44, 756);
      ctx.lineTo(rightCx + rightW * 0.44, 756);
      ctx.stroke();

      // Red pill: "WE ARE OPEN ON ALL SUNDAYS"
      ctx.font = '800 23px "Plus Jakarta Sans", sans-serif';
      const sbW = ctx.measureText(BRAND_INFO.sundayBadge).width + 44;
      const sbH = 46;
      const sbY = 812;
      drawRoundedRect(ctx, rightCx - sbW / 2, sbY - sbH / 2, sbW, sbH, sbH / 2);
      ctx.fillStyle = '#CE1B28';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(BRAND_INFO.sundayBadge, rightCx, sbY + 1);

      // Phone icon + Crisp White Phone Numbers
      const phoneStr = `${BRAND_INFO.phonePrimary}   /   ${BRAND_INFO.phoneSecondary}`;
      ctx.font = '800 35px "Plus Jakarta Sans", sans-serif';
      const pWidth = ctx.measureText(phoneStr).width;
      drawPhoneIcon(ctx, rightCx - pWidth / 2 - 44, 874, 32, brightGold);
      ctx.fillStyle = crispWhite;
      ctx.fillText(phoneStr, rightCx + 12, 890);

      // Website URL
      ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = brightGold;
      ctx.fillText(BRAND_INFO.website, rightCx, 954);
      ctx.restore();
    }
  }

  // ---- STAGE 3 (8.0s – 10.0s): Full-Screen Official Majestic Jewellers Logo Finale ----
  drawLEDWallLogoFinale(ctx, W, H, t, logoImage, theme);
}

/**
 * VIDEO B (9:16 Reel — 1080×1920) & VIDEO C (4:5 Feed — 1080×1350)
 * Luxury Glassmorphism & Sparkle Style + Full-Screen 3D Spinning Logo Finale (10.0s)
 */
function renderVerticalGlassVideo(ctx, { width: W, height: H, formatKey, theme, rateData, ornamentImage, logoImage, time: t, isAiStaged }) {
  const isFeed = formatKey === '4:5';
  const isLightBackdrop = theme.mode === 'light';
  const cx = W / 2;

  // 1. Draped Silk/Velvet Animated Backdrop strictly in the selected Daily Color Theme
  drawFlowingSilkBackdrop(ctx, W, H, t, theme);

  const mainExitAlpha = 1 - easeInOutCubic(phase(t, 7.65, 8.2));

  // ---- 0.0s – 2.0s: Golden Particle Vortex reveals Staged Studio Ornament (Top 58% with 42%→58% fade) ----
  if (mainExitAlpha > 0.01) {
    const ornEnter = easeOutCubic(phase(t, 0.25, 1.8));
    const ornCy = isFeed ? H * 0.215 : H * 0.21;

    if (isAiStaged) {
      drawStagedVerticalHero(ctx, {
        W,
        H,
        ornamentImage,
        theme,
        t,
        alpha: ornEnter * mainExitAlpha,
      });
      drawParticleSwirl(ctx, cx, ornCy, isFeed ? 280 : 320, phase(t, 0.0, 2.0), false);
    } else {
      drawParticleSwirl(ctx, cx, ornCy, isFeed ? 280 : 320, phase(t, 0.0, 2.0), false);
      draw3DOrnamentStage(ctx, {
        cx,
        cy: ornCy,
        maxW: W * 0.72,
        maxH: isFeed ? H * 0.31 : H * 0.31,
        ornamentImage,
        t,
        alpha: ornEnter * mainExitAlpha,
        isLightBackdrop,
        swayDeg: 14,
      });
    }
  }

  // Floating Golden Bokeh & Perimeter Frame above the faded studio hero
  drawGoldenBokeh(ctx, W, H, t, isLightBackdrop, 38);

  ctx.save();
  ctx.strokeStyle = isLightBackdrop ? 'rgba(138, 94, 20, 0.35)' : 'rgba(232, 197, 99, 0.32)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 26, 26, W - 52, H - 52, 20);
  ctx.stroke();
  ctx.restore();

  // ---- 2.0s – 4.0s: "TODAY'S GOLD RATE" + "ഇന്നത്തെ സ്വർണ്ണവില" + Glowing {date} Badge ----
  const headerP = easeOutCubic(phase(t, 2.0, 3.1)) * mainExitAlpha;
  const dateP = easeOutCubic(phase(t, 2.75, 3.85)) * mainExitAlpha;

  if (headerP > 0.01) {
    const titleY = isFeed ? H * 0.415 : H * 0.418;
    const malTitleY = isFeed ? H * 0.456 : H * 0.456;
    const slideY = (1 - easeOutCubic(phase(t, 2.0, 3.1))) * 28;

    ctx.save();
    ctx.globalAlpha = headerP;
    ctx.font = `800 ${isFeed ? 52 : 60}px "Cinzel", "Playfair Display", Georgia, serif`;
    ctx.fillStyle = isLightBackdrop
      ? theme.textPrimary
      : createMetallicGoldGradient(ctx, cx - 340, titleY - 30, cx + 340, titleY + 30, true);
    ctx.textBaseline = 'middle';
    if (!isLightBackdrop) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 5;
    }
    drawTrackedText(ctx, "TODAY'S GOLD RATE", cx, titleY + slideY, isFeed ? 4 : 5.5);

    // Malayalam subtitle "ഇന്നത്തെ സ്വർണ്ണവില"
    ctx.shadowColor = 'transparent';
    ctx.font = `700 ${isFeed ? 25 : 29}px "Noto Sans Malayalam", sans-serif`;
    ctx.fillStyle = isLightBackdrop ? theme.textSecondary : theme.goldLight;
    ctx.textAlign = 'center';
    ctx.fillText('ഇന്നത്തെ സ്വർണ്ണവില', cx, malTitleY + slideY);
    ctx.restore();
  }

  if (dateP > 0.01) {
    const dy = isFeed ? H * 0.505 : H * 0.505;
    const bw = isFeed ? 360 : 410;
    const bh = isFeed ? 52 : 60;

    ctx.save();
    ctx.globalAlpha = dateP;
    drawRoundedRect(ctx, cx - bw / 2, dy - bh / 2, bw, bh, bh / 2);
    ctx.fillStyle = isLightBackdrop ? 'rgba(255, 252, 245, 0.72)' : 'rgba(255, 242, 200, 0.12)';
    ctx.fill();

    // Glowing gold border
    ctx.shadowColor = isLightBackdrop ? 'rgba(180, 128, 32, 0.35)' : 'rgba(242, 204, 108, 0.65)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = isLightBackdrop ? theme.borderColor : '#F5D680';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.font = `700 ${isFeed ? 26 : 30}px "Cinzel", "Playfair Display", Georgia, serif`;
    ctx.fillStyle = isLightBackdrop ? theme.textPrimary : '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawTrackedText(ctx, String(rateData.date || '').toUpperCase(), cx, dy + 1, 3.5);
    ctx.restore();
  }

  // ---- 4.0s – 7.8s: Frosted-Glass Card with Glowing Thin Gold Border ----
  const cardP = easeOutQuart(phase(t, 4.0, 4.85)) * mainExitAlpha;
  if (cardP > 0.01) {
    const cardW = W - 112;
    const cardH = isFeed ? 395 : 535;
    const cardX = (W - cardW) / 2;
    const cardY = isFeed ? H * 0.555 : H * 0.555;
    const liftY = (1 - easeOutQuart(phase(t, 4.0, 4.85))) * 34;

    ctx.save();
    ctx.globalAlpha = cardP;
    ctx.translate(0, liftY);

    // Frosted Glass Fill + Specular Top Highlight
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fillStyle = isLightBackdrop
      ? 'rgba(255, 253, 248, 0.62)'
      : 'rgba(18, 22, 28, 0.44)';
    ctx.fill();

    const glassSheen = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    glassSheen.addColorStop(0, isLightBackdrop ? 'rgba(255,255,255,0.52)' : 'rgba(255,248,225,0.16)');
    glassSheen.addColorStop(0.45, 'rgba(255,255,255,0.02)');
    glassSheen.addColorStop(1, isLightBackdrop ? 'rgba(212,163,89,0.12)' : 'rgba(212,163,89,0.08)');
    ctx.fillStyle = glassSheen;
    ctx.fill();

    // Glowing Thin Gold Border
    ctx.shadowColor = isLightBackdrop ? 'rgba(190, 140, 40, 0.35)' : 'rgba(242, 206, 114, 0.55)';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = createMetallicGoldGradient(ctx, cardX, cardY, cardX + cardW, cardY + cardH, !isLightBackdrop);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // Traveling light sweep across frosted glass card (4.5s – 6.2s)
    const sweepP = phase(t, 4.55, 6.1);
    if (sweepP > 0 && sweepP < 1) {
      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
      ctx.clip();
      const sx = cardX - 240 + (cardW + 480) * sweepP;
      const sg = ctx.createLinearGradient(sx - 120, cardY, sx + 120, cardY + cardH * 0.6);
      sg.addColorStop(0, 'rgba(255,250,230,0)');
      sg.addColorStop(0.5, `rgba(255,250,230,${0.25 * Math.sin(sweepP * Math.PI)})`);
      sg.addColorStop(1, 'rgba(255,250,230,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.restore();
    }

    // Sequential Reveal 1 (4.35s – 5.25s): 1 GRAM | 22K | 8 GRAM
    const r22P = easeOutCubic(phase(t, 4.35, 5.25));
    if (r22P > 0.01) {
      ctx.save();
      ctx.globalAlpha = cardP * r22P;
      const rowY = cardY + (isFeed ? 98 : 132);

      // Center glowing 22K circular emblem
      const badgeR = isFeed ? 44 : 54;
      ctx.beginPath();
      ctx.arc(cx, rowY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = createMetallicGoldGradient(ctx, cx - badgeR, rowY - badgeR, cx + badgeR, rowY + badgeR, true);
      ctx.fill();

      ctx.font = `900 ${isFeed ? 28 : 34}px "Cinzel", serif`;
      ctx.fillStyle = '#1C1204';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('22K', cx, rowY - 6);
      ctx.font = `800 ${isFeed ? 13 : 15}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText('916 GOLD', cx, rowY + (isFeed ? 18 : 22));

      // Left: 1 GRAM
      const leftCx = cardX + cardW * 0.22;
      const rightCx = cardX + cardW * 0.78;
      ctx.font = `700 ${isFeed ? 22 : 25}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = isLightBackdrop ? theme.textSecondary : theme.goldLight;
      ctx.fillText('1 GRAM', leftCx, rowY - (isFeed ? 28 : 36));
      ctx.fillText('8 GRAM', rightCx, rowY - (isFeed ? 28 : 36));

      ctx.font = `800 ${isFeed ? 54 : 64}px "Playfair Display", Georgia, serif`;
      ctx.fillStyle = isLightBackdrop ? theme.textPrimary : '#FFFFFF';
      ctx.fillText(`₹${formatINR(rateData.rate_22k_1g)}`, leftCx, rowY + (isFeed ? 24 : 30), cardW * 0.36);
      ctx.fillText(`₹${formatINR(rateData.rate_22k_8g)}`, rightCx, rowY + (isFeed ? 24 : 30), cardW * 0.36);
      ctx.restore();
    }

    // Horizontal glass divider
    const divY = cardY + (isFeed ? 196 : 258);
    ctx.strokeStyle = isLightBackdrop ? 'rgba(138, 94, 20, 0.28)' : 'rgba(242, 222, 158, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cardX + 46, divY);
    ctx.lineTo(cardX + cardW - 46, divY);
    ctx.stroke();

    // Sequential Reveal 2 (5.2s – 6.0s): 18K & 9K Rates
    const rSubP = easeOutCubic(phase(t, 5.2, 6.0));
    if (rSubP > 0.01) {
      ctx.save();
      ctx.globalAlpha = cardP * rSubP;
      const subY = divY + (isFeed ? 54 : 74) + (1 - rSubP) * 18;
      ctx.font = `700 ${isFeed ? 26 : 31}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = isLightBackdrop ? theme.textPrimary : '#FFF9EB';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `18K - ₹${formatINR(rateData.rate_18k_1g)}/GRAM    ◆    9K - ₹${formatINR(
          rateData.rate_9k_1g
        )}/GRAM`,
        cx,
        subY,
        cardW - 60
      );
      ctx.restore();
    }

    // Sequential Reveal 3 (5.9s – 6.8s): Malayalam Pavan Change Line
    const rMalP = easeOutCubic(phase(t, 5.9, 6.8));
    if (rMalP > 0.01) {
      const malText =
        (rateData.customMalayalamText || '').trim() ||
        buildMalayalamStatusText(rateData.change_1g, rateData.trend);
      const arrow = rateData.trend === 'UP' ? '▲ ' : rateData.trend === 'DOWN' ? '▼ ' : '● ';
      const displayLine = `${arrow}${malText}`;

      ctx.save();
      ctx.globalAlpha = cardP * rMalP;
      const my = divY + (isFeed ? 132 : 178) + (1 - rMalP) * 20;
      ctx.font = `700 ${isFeed ? 27 : 32}px "Noto Sans Malayalam", sans-serif`;
      const mw = Math.min(cardW - 64, ctx.measureText(displayLine).width + 58);
      const mh = isFeed ? 56 : 66;

      drawRoundedRect(ctx, cx - mw / 2, my - mh / 2, mw, mh, mh / 2);
      ctx.fillStyle = isLightBackdrop
        ? rateData.trend === 'DOWN'
          ? 'rgba(153, 27, 27, 0.14)'
          : 'rgba(14, 92, 60, 0.14)'
        : rateData.trend === 'DOWN'
          ? 'rgba(127, 29, 29, 0.65)'
          : 'rgba(6, 78, 59, 0.65)';
      ctx.fill();
      ctx.strokeStyle =
        rateData.trend === 'DOWN'
          ? isLightBackdrop
            ? '#991B1B'
            : '#FCA5A5'
          : isLightBackdrop
            ? '#0E6B45'
            : '#6EE7B7';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.fillStyle = isLightBackdrop
        ? rateData.trend === 'DOWN'
          ? '#7F1D1D'
          : '#0A472E'
        : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayLine, cx, my + 2, mw - 28);
      ctx.restore();
    }

    ctx.restore();
  }

  // ---- Bottom Store Contact Strip (4.8s – 7.8s) ----
  const footP = easeOutCubic(phase(t, 4.8, 5.6)) * mainExitAlpha;
  if (footP > 0.01) {
    ctx.save();
    ctx.globalAlpha = footP;
    const fy = isFeed ? H * 0.912 : H * 0.892;

    // Red Sunday Pill
    ctx.font = `800 ${isFeed ? 16 : 19}px "Plus Jakarta Sans", sans-serif`;
    const bw = ctx.measureText(BRAND_INFO.sundayBadge).width + 34;
    const bh = isFeed ? 30 : 36;
    drawRoundedRect(ctx, cx - bw / 2, fy - bh - 12, bw, bh, bh / 2);
    ctx.fillStyle = '#C81E2B';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BRAND_INFO.sundayBadge, cx, fy - bh / 2 - 11);

    // Phone numbers + website
    const phoneLine = `${BRAND_INFO.phonePrimary}  •  ${BRAND_INFO.phoneSecondary}`;
    ctx.font = `700 ${isFeed ? 22 : 26}px "Plus Jakarta Sans", sans-serif`;
    const pW = ctx.measureText(phoneLine).width;
    drawPhoneIcon(ctx, cx - pW / 2 - 34, fy + 2, isFeed ? 20 : 24, isLightBackdrop ? theme.textPrimary : theme.goldLight);
    ctx.fillStyle = isLightBackdrop ? theme.textPrimary : '#FFFFFF';
    ctx.fillText(phoneLine, cx + 10, fy + 14);

    ctx.font = `600 ${isFeed ? 19 : 22}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = isLightBackdrop ? theme.textSecondary : theme.goldLight;
    ctx.fillText(BRAND_INFO.website, cx, fy + (isFeed ? 46 : 56));
    ctx.restore();
  }

  // ---- 7.8s – 10.0s: Full-Screen 3D Spinning Metallic Gold Logo Finale ----
  draw3DSpinningLogoFinale(ctx, W, H, t, logoImage, isLightBackdrop);
}

/**
 * Master Dispatcher for All 3 Cinematic 10-Second Animated Video Formats
 */
export function renderGoldRateFrame(
  ctx,
  {
    width,
    height,
    formatKey = '9:16',
    theme,
    rateData,
    ornamentImage,
    logoImage,
    isAiStaged = false,
    time = ANIMATION_DURATION,
  }
) {
  const t = Math.max(0, Math.min(ANIMATION_DURATION, time));
  ctx.clearRect(0, 0, width, height);

  if (formatKey === '16:9') {
    renderLandscapeLEDVideo(ctx, {
      width,
      height,
      theme,
      rateData,
      ornamentImage,
      logoImage,
      time: t,
      isAiStaged,
    });
    return;
  }

  renderVerticalGlassVideo(ctx, {
    width,
    height,
    formatKey,
    theme,
    rateData,
    ornamentImage,
    logoImage,
    isAiStaged,
    time: t,
  });
}
