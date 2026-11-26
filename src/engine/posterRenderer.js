import { BRAND_INFO } from '../constants/themes';
import { buildMalayalamStatusText, formatINR } from '../utils/formatters';

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#0A3622').replace('#', '');
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

export function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawTrackedText(ctx, text, cx, y, tracking = 4) {
  const chars = Array.from(String(text || ''));
  if (chars.length === 0) return;
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalW =
    widths.reduce((acc, w) => acc + w, 0) + Math.max(0, chars.length - 1) * tracking;
  let curX = cx - totalW / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i += 1) {
    ctx.fillText(chars[i], curX, y);
    curX += widths[i] + tracking;
  }
  ctx.textAlign = prevAlign;
}

export function drawPhoneIcon(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(22, 16.92);
  ctx.lineTo(22, 19.92);
  ctx.quadraticCurveTo(22, 22, 19.8, 21.8);
  ctx.bezierCurveTo(11.4, 21, 3, 12.6, 2.2, 4.2);
  ctx.quadraticCurveTo(2, 2, 4.08, 2);
  ctx.lineTo(7.08, 2);
  ctx.quadraticCurveTo(8.9, 2, 9.2, 3.7);
  ctx.lineTo(9.8, 6.6);
  ctx.quadraticCurveTo(10, 7.8, 9.1, 8.7);
  ctx.lineTo(7.6, 10.2);
  ctx.quadraticCurveTo(9.6, 14.4, 13.8, 16.4);
  ctx.lineTo(15.3, 14.9);
  ctx.quadraticCurveTo(16.2, 14, 17.4, 14.2);
  ctx.lineTo(20.3, 14.8);
  ctx.quadraticCurveTo(22, 15.1, 22, 16.92);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw crisp fallback 3-point geometric Majestic crown + typography matching the official logo
 */
export function drawMajesticCrownVector(ctx, cx, cy, boxW, boxH, goldFill) {
  ctx.save();
  ctx.fillStyle = goldFill;

  // 3-point geometric crown (matching Majestic Jewellers' official logo silhouette)
  const cw = boxW * 0.52;
  const ch = boxH * 0.34;
  const topY = cy - boxH * 0.38;
  const botY = topY + ch;

  // Left & right crown wings + curved base
  ctx.beginPath();
  ctx.moveTo(cx - cw * 0.48, topY + ch * 0.14);
  ctx.lineTo(cx, botY - ch * 0.16);
  ctx.lineTo(cx + cw * 0.48, topY + ch * 0.14);
  ctx.lineTo(cx + cw * 0.42, botY);
  ctx.quadraticCurveTo(cx, botY - ch * 0.08, cx - cw * 0.42, botY);
  ctx.closePath();
  ctx.fill();

  // Center diamond peak
  ctx.beginPath();
  ctx.moveTo(cx, topY + ch * 0.12);
  ctx.lineTo(cx + cw * 0.18, topY + ch * 0.56);
  ctx.lineTo(cx, topY + ch * 0.8);
  ctx.lineTo(cx - cw * 0.18, topY + ch * 0.56);
  ctx.closePath();
  ctx.fill();

  // Center pearl + outer half-dots
  const r = Math.max(3, cw * 0.042);
  ctx.beginPath();
  ctx.arc(cx, topY + r * 1.1, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - cw * 0.48, topY + r * 1.3, r * 0.85, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + cw * 0.48, topY + r * 1.3, r * 0.85, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();

  // Typography
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const mainSize = Math.round(boxW * 0.165);
  ctx.font = `700 ${mainSize}px "Cinzel", "Playfair Display", Georgia, serif`;
  ctx.fillText('MAJESTIC', cx, cy + boxH * 0.11, boxW * 0.88);

  const subSize = Math.round(mainSize * 0.36);
  ctx.font = `600 ${subSize}px "Cinzel", "Playfair Display", Georgia, serif`;
  drawTrackedText(ctx, 'JEWELLERS', cx, cy + boxH * 0.27, Math.max(2, subSize * 0.28));

  const sinceSize = Math.round(mainSize * 0.35);
  ctx.font = `600 ${sinceSize}px "Cinzel", "Playfair Display", Georgia, serif`;
  ctx.fillText('SINCE 1970', cx, cy + boxH * 0.41, boxW * 0.8);

  ctx.restore();
}

/**
 * Draw the official Majestic Jewellers (Since 1970) Square Emerald & Gold Crown Logo Box:
 * #0E3B2C emerald square box, #D4A359 gold border, 3-point gold crown, MAJESTIC, JEWELLERS, SINCE 1970.
 */
export function drawOfficialSquareLogoBox(ctx, x, y, size, logoImage) {
  ctx.save();

  // Subtle ambient shadow beneath square emblem
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = BRAND_INFO.squareBoxHex; // #0E3B2C
  drawRoundedRect(ctx, x, y, size, size, 8);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Subtle emerald radial depth inside the square box
  const innerGrad = ctx.createRadialGradient(
    x + size * 0.5,
    y + size * 0.42,
    size * 0.05,
    x + size * 0.5,
    y + size * 0.5,
    size * 0.72
  );
  innerGrad.addColorStop(0, '#144D3A');
  innerGrad.addColorStop(1, '#0A2D21');
  ctx.fillStyle = innerGrad;
  drawRoundedRect(ctx, x, y, size, size, 8);
  ctx.fill();

  // Crisp #D4A359 outer border + subtle inner hairline
  ctx.strokeStyle = BRAND_INFO.squareBorderHex; // #D4A359
  ctx.lineWidth = Math.max(3, size * 0.013);
  drawRoundedRect(ctx, x + 1.5, y + 1.5, size - 3, size - 3, 8);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 163, 89, 0.38)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x + 9, y + 9, size - 18, size - 18, 4);
  ctx.stroke();

  // Official transparent Majestic logo PNG (or exact 3-point crown vector fallback)
  const pad = size * 0.11;
  const innerW = size - pad * 2;
  const innerH = size - pad * 2;
  if (logoImage) {
    const sw = logoImage.naturalWidth || logoImage.width || 600;
    const sh = logoImage.naturalHeight || logoImage.height || 500;
    const fit = Math.min(innerW / sw, innerH / sh);
    const dw = sw * fit;
    const dh = sh * fit;
    ctx.drawImage(logoImage, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  } else {
    drawMajesticCrownVector(ctx, x + size / 2, y + size / 2, innerW, innerH, '#E8B384');
  }

  ctx.restore();
}

/**
 * PART 1: LUXURY STATIC POSTER RENDERER (1080 × 1920)
 * - Top 58%: Gemini AI Studio-staged product photograph (resting naturally on velvet stand/cushion)
 *   drawn seamlessly into the upper 58% of the canvas.
 * - Vertical Gradient Fade Mask (42% → 58% height): Smoothly dissolves the lower edge of the
 *   velvet stand directly into the solid bottom theme color (#0E3B2C, #4A0E17, #0D1B3E, #E6D3BE)
 *   with zero hard edges or cutout boxes.
 * - Bottom Section: Adaptive Light Mode / Dark Mode typography + Large 28%-width Official Square Logo.
 */
export function renderStaticPosterFrame(
  ctx,
  {
    width = 1080,
    height = 1920,
    theme,
    rateData,
    ornamentImage,
    logoImage,
    isAiStaged = false,
  }
) {
  const W = width;
  const H = height;
  const isLight = theme.mode === 'light';
  const topH = Math.round(H * 0.58); // 1114px (58% height)
  const fadeStartY = Math.round(H * 0.42); // 806px (42% height)
  const fadeEndY = topH; // 1114px (58% height)

  // 1. Base Solid Bottom Theme Background
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, 0, W, H);

  // Rich ambient studio gradient behind the upper 58% (for un-staged preview fallback)
  const topStudioGrad = ctx.createRadialGradient(
    W * 0.5,
    topH * 0.38,
    W * 0.06,
    W * 0.5,
    topH * 0.44,
    W * 0.78
  );
  topStudioGrad.addColorStop(0, theme.centerGlow);
  topStudioGrad.addColorStop(0.62, theme.primary);
  topStudioGrad.addColorStop(1, theme.edgeDark);
  ctx.fillStyle = topStudioGrad;
  ctx.fillRect(0, 0, W, topH);

  // Subtle velvet drapery sheen folds when not yet AI-staged
  if (!isAiStaged) {
    ctx.save();
    for (let i = 0; i < 4; i += 1) {
      const foldGrad = ctx.createLinearGradient(0, i * 240, W, i * 240 + 360);
      foldGrad.addColorStop(0, 'rgba(255,255,255,0)');
      foldGrad.addColorStop(
        0.5,
        isLight ? 'rgba(255,255,255,0.22)' : 'rgba(255,240,196,0.045)'
      );
      foldGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = foldGrad;
      ctx.beginPath();
      ctx.moveTo(0, i * 230);
      ctx.bezierCurveTo(W * 0.35, i * 230 + 90, W * 0.65, i * 230 - 70, W, i * 230 + 60);
      ctx.lineTo(W, i * 230 + 250);
      ctx.bezierCurveTo(W * 0.65, i * 230 + 110, W * 0.35, i * 230 + 260, 0, i * 230 + 180);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Top 58% — Draw AI Studio-Staged Product Photograph (or raw preview image before staging)
  if (ornamentImage) {
    const sw = ornamentImage.naturalWidth || ornamentImage.width || 1024;
    const sh = ornamentImage.naturalHeight || ornamentImage.height || 1024;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, topH);
    ctx.clip();

    if (isAiStaged) {
      // Full-bleed studio cover crop into top 58%, anchoring ornament naturally in upper center
      const coverScale = Math.max(W / sw, topH / sh);
      const dw = sw * coverScale;
      const dh = sh * coverScale;
      const dx = (W - dw) / 2;
      const dy = Math.min(0, (topH - dh) * 0.25);
      ctx.drawImage(ornamentImage, dx, dy, dw, dh);
    } else {
      // Pre-staging fallback: smooth soft-vignette center presentation (never a harsh sticker cutout)
      const fitScale = Math.min((W * 0.84) / sw, (topH * 0.78) / sh);
      const dw = sw * fitScale;
      const dh = sh * fitScale;
      const dx = (W - dw) / 2;
      const dy = (topH - dh) * 0.38;

      ctx.shadowColor = isLight ? 'rgba(65, 42, 24, 0.22)' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 16;
      ctx.drawImage(ornamentImage, dx, dy, dw, dh);

      // Soft outer radial feather blending non-staged photo smoothly into the velvet backdrop
      ctx.shadowColor = 'transparent';
      const radialMask = ctx.createRadialGradient(
        W * 0.5,
        topH * 0.42,
        W * 0.24,
        W * 0.5,
        topH * 0.42,
        W * 0.62
      );
      radialMask.addColorStop(0, hexToRgba(theme.primary, 0));
      radialMask.addColorStop(0.68, hexToRgba(theme.primary, 0));
      radialMask.addColorStop(1, hexToRgba(theme.primary, 0.88));
      ctx.fillStyle = radialMask;
      ctx.fillRect(0, 0, W, topH);
    }
    ctx.restore();
  }

  // 3. Smooth Vertical Alpha/Gradient Fade Mask (42% → 58% height) into Solid Bottom Theme Color
  const vertFade = ctx.createLinearGradient(0, fadeStartY, 0, fadeEndY);
  vertFade.addColorStop(0, hexToRgba(theme.primary, 0));
  vertFade.addColorStop(0.38, hexToRgba(theme.primary, 0.34));
  vertFade.addColorStop(0.72, hexToRgba(theme.primary, 0.84));
  vertFade.addColorStop(1, hexToRgba(theme.primary, 1));
  ctx.fillStyle = vertFade;
  ctx.fillRect(0, fadeStartY, W, fadeEndY - fadeStartY + 6);

  // Solid bottom theme surface below 58%
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, fadeEndY, W, H - fadeEndY);

  // 4. Adaptive Color Tokens (Light Mode vs Dark Mode)
  const headingColor = isLight ? theme.textPrimary : '#FFFFFF';
  const rateNumberColor = isLight ? theme.textPrimary : '#FFFFFF';
  const labelColor = isLight ? theme.textSecondary : theme.goldLight;
  const subTextColor = isLight ? theme.textSecondary : '#F6EFE0';
  const thinBorderColor = isLight
    ? 'rgba(138, 94, 20, 0.65)'
    : 'rgba(232, 197, 99, 0.72)';
  const cardSurface = isLight
    ? 'rgba(255, 252, 246, 0.56)'
    : 'rgba(0, 0, 0, 0.24)';

  const cx = W / 2;

  // ---- HEADER: "TODAY'S GOLD RATE" in wide-tracked Cinzel Serif ----
  ctx.save();
  ctx.font = `700 50px "Cinzel", "Playfair Display", Georgia, serif`;
  ctx.fillStyle = headingColor;
  ctx.textBaseline = 'middle';
  if (!isLight) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
  }
  drawTrackedText(ctx, "TODAY'S GOLD RATE", cx, 1086, 6);
  ctx.restore();

  // ---- DATE BADGE: Framed Ornamental Bracket Box ----
  {
    const boxW = 430;
    const boxH = 62;
    const bx = cx - boxW / 2;
    const by = 1138;
    const bLen = 42;

    ctx.save();
    ctx.fillStyle = cardSurface;
    drawRoundedRect(ctx, bx, by, boxW, boxH, 6);
    ctx.fill();

    // Thin top & bottom horizontal accent lines
    ctx.strokeStyle = isLight ? 'rgba(138, 94, 20, 0.35)' : 'rgba(232, 197, 99, 0.42)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx + 12, by + 3);
    ctx.lineTo(bx + boxW - 12, by + 3);
    ctx.moveTo(bx + 12, by + boxH - 3);
    ctx.lineTo(bx + boxW - 12, by + boxH - 3);
    ctx.stroke();

    // Ornamental Left & Right Brackets
    ctx.strokeStyle = thinBorderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx + bLen, by);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by + boxH);
    ctx.lineTo(bx + bLen, by + boxH);
    ctx.moveTo(bx + boxW - bLen, by);
    ctx.lineTo(bx + boxW, by);
    ctx.lineTo(bx + boxW, by + boxH);
    ctx.lineTo(bx + boxW - bLen, by + boxH);
    ctx.stroke();

    // Side ornamental diamonds
    ctx.fillStyle = thinBorderColor;
    for (const dx of [bx - 16, bx + boxW + 16]) {
      const dy = by + boxH / 2;
      ctx.beginPath();
      ctx.moveTo(dx, dy - 6);
      ctx.lineTo(dx + 6, dy);
      ctx.lineTo(dx, dy + 6);
      ctx.lineTo(dx - 6, dy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.font = `700 30px "Cinzel", "Playfair Display", Georgia, serif`;
    ctx.fillStyle = headingColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawTrackedText(ctx, String(rateData.date || '').toUpperCase(), cx, by + boxH / 2 + 1, 3.5);
    ctx.restore();
  }

  // ---- 22K HIGHLIGHT BOX: Two-Column Split Box with Thin Metallic Borders ----
  {
    const bx = 72;
    const by = 1226;
    const bw = W - 144;
    const bh = 186;

    ctx.save();
    drawRoundedRect(ctx, bx, by, bw, bh, 16);
    ctx.fillStyle = cardSurface;
    ctx.fill();

    ctx.strokeStyle = thinBorderColor;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Subtle inner hairline
    drawRoundedRect(ctx, bx + 7, by + 7, bw - 14, bh - 14, 11);
    ctx.strokeStyle = isLight ? 'rgba(138, 94, 20, 0.22)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top 22K pill centered on top border
    const pillW = 200;
    const pillH = 34;
    drawRoundedRect(ctx, cx - pillW / 2, by - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = isLight ? theme.textPrimary : theme.goldMid;
    ctx.fill();

    ctx.font = `800 18px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = isLight ? '#FFF8EB' : '#181004';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('22K GOLD • 916', cx, by + 1);

    // Center vertical split divider
    ctx.strokeStyle = thinBorderColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, by + 28);
    ctx.lineTo(cx, by + bh - 22);
    ctx.stroke();

    const leftCx = bx + bw * 0.25;
    const rightCx = bx + bw * 0.75;

    ctx.font = `700 26px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = labelColor;
    ctx.fillText('1 GRAM', leftCx, by + 62);
    ctx.fillText('8 GRAM', rightCx, by + 62);

    ctx.font = `800 66px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = rateNumberColor;
    ctx.fillText(`₹${formatINR(rateData.rate_22k_1g)}`, leftCx, by + 132, bw * 0.44);
    ctx.fillText(`₹${formatINR(rateData.rate_22k_8g)}`, rightCx, by + 132, bw * 0.44);
    ctx.restore();
  }

  // ---- SUB-RATES: 18K & 9K Centered Below ----
  {
    ctx.save();
    ctx.font = `700 28px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = subTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subLine = `18K - ₹${formatINR(rateData.rate_18k_1g)}/GRAM    ◆    9K - ₹${formatINR(
      rateData.rate_9k_1g
    )}/GRAM`;
    ctx.fillText(subLine, cx, 1456, W - 120);
    ctx.restore();
  }

  // ---- MALAYALAM TREND LINE ----
  {
    const malText =
      (rateData.customMalayalamText || '').trim() ||
      buildMalayalamStatusText(rateData.change_1g, rateData.trend);
    const arrow = rateData.trend === 'UP' ? '▲ ' : rateData.trend === 'DOWN' ? '▼ ' : '● ';
    const fullMal = `${arrow}${malText}`;

    ctx.save();
    ctx.font = `700 30px "Noto Sans Malayalam", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textW = ctx.measureText(fullMal).width;
    const pillW = Math.min(W - 110, textW + 56);
    const pillH = 58;
    const py = 1516;

    drawRoundedRect(ctx, cx - pillW / 2, py - pillH / 2, pillW, pillH, pillH / 2);
    if (isLight) {
      ctx.fillStyle =
        rateData.trend === 'UP'
          ? 'rgba(14, 92, 60, 0.14)'
          : rateData.trend === 'DOWN'
            ? 'rgba(153, 27, 27, 0.14)'
            : 'rgba(138, 94, 20, 0.14)';
      ctx.fill();
      ctx.strokeStyle =
        rateData.trend === 'UP'
          ? '#0E6B45'
          : rateData.trend === 'DOWN'
            ? '#991B1B'
            : '#8A5E14';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle =
        rateData.trend === 'UP'
          ? '#0B4F33'
          : rateData.trend === 'DOWN'
            ? '#7F1D1D'
            : theme.textPrimary;
    } else {
      ctx.fillStyle =
        rateData.trend === 'UP'
          ? 'rgba(6, 78, 59, 0.62)'
          : rateData.trend === 'DOWN'
            ? 'rgba(127, 29, 29, 0.62)'
            : 'rgba(120, 90, 24, 0.45)';
      ctx.fill();
      ctx.strokeStyle =
        rateData.trend === 'UP'
          ? '#6EE7B7'
          : rateData.trend === 'DOWN'
            ? '#FCA5A5'
            : theme.goldLight;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
    }

    ctx.fillText(fullMal, cx, py + 2, pillW - 28);
    ctx.restore();
  }

  // ---- FOOTER SEPARATOR HAIRLINE ----
  ctx.save();
  ctx.strokeStyle = isLight ? 'rgba(138, 94, 20, 0.28)' : 'rgba(232, 197, 99, 0.32)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(64, 1568);
  ctx.lineTo(W - 64, 1568);
  ctx.stroke();
  ctx.restore();

  // ---- FOOTER RIGHT: OFFICIAL SQUARE LOGO AT EXACTLY 28% OF POSTER WIDTH (302 × 302px) ----
  const logoSize = Math.round(W * 0.28); // 302px on 1080w poster
  const logoX = W - 64 - logoSize;
  const logoY = 1586;
  drawOfficialSquareLogoBox(ctx, logoX, logoY, logoSize, logoImage);

  // ---- FOOTER LEFT: Sunday Pill Badge, Phone Icon + Numbers, Dotted Line, Website ----
  {
    const leftX = 64;
    const maxLeftW = logoX - leftX - 36;

    ctx.save();

    // Pill Badge: "WE ARE OPEN ON ALL SUNDAYS"
    ctx.font = `800 20px "Plus Jakarta Sans", sans-serif`;
    const badgeW = Math.min(maxLeftW, ctx.measureText(BRAND_INFO.sundayBadge).width + 38);
    const badgeH = 44;
    const badgeY = 1618;

    drawRoundedRect(ctx, leftX, badgeY, badgeW, badgeH, badgeH / 2);
    const pillGrad = ctx.createLinearGradient(leftX, badgeY, leftX + badgeW, badgeY + badgeH);
    pillGrad.addColorStop(0, '#D4202C');
    pillGrad.addColorStop(1, '#9E121C');
    ctx.fillStyle = pillGrad;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(BRAND_INFO.sundayBadge, leftX + 19, badgeY + badgeH / 2 + 1, badgeW - 30);

    // Phone Icon + Both Numbers
    const phoneIconColor = isLight ? theme.textPrimary : theme.goldLight;
    const phoneY1 = 1704;
    drawPhoneIcon(ctx, leftX, phoneY1 - 14, 28, phoneIconColor);

    ctx.font = `700 30px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = headingColor;
    ctx.fillText(BRAND_INFO.phonePrimary, leftX + 42, phoneY1 + 1, maxLeftW - 42);
    ctx.fillText(BRAND_INFO.phoneSecondary, leftX + 42, phoneY1 + 42, maxLeftW - 42);

    // Dotted Divider Line
    const dotY = 1790;
    ctx.save();
    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = thinBorderColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(leftX, dotY);
    ctx.lineTo(leftX + Math.min(maxLeftW * 0.92, 460), dotY);
    ctx.stroke();
    ctx.restore();

    // Website URL
    ctx.font = `700 27px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = labelColor;
    ctx.fillText(BRAND_INFO.website, leftX, 1836, maxLeftW);

    ctx.restore();
  }
}
