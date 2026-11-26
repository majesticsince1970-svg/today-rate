import React, { useRef, useState } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { extractGoldRatesFromPoster } from '../services/geminiService';
import {
  buildMalayalamStatusText,
  calculatePavanChange,
  formatDateDDMMMYYYY,
  formatINR,
} from '../utils/formatters';

export default function PosterUploadPanel({
  rateData,
  setRateData,
  onSaveRate,
  savingRate,
  geminiConnected,
  onOpenSettings,
  notify,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [posterPreview, setPosterPreview] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [autoSync8g, setAutoSync8g] = useState(true);

  const handlePosterFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setExtractError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);
    setExtractError('');
    setExtractSuccess(false);

    if (!geminiConnected) {
      setExtractError(
        'Gemini API key not set yet. Click "Configure Key" below or edit the gold rates manually.'
      );
      return;
    }

    setExtracting(true);
    try {
      const extracted = await extractGoldRatesFromPoster(file);
      setRateData((prev) => ({
        ...prev,
        ...extracted,
        customMalayalamText: '',
      }));
      setExtractSuccess(true);
      notify('Gold rates extracted cleanly by Gemini 2.5 Flash!', 'success');
    } catch (err) {
      setExtractError(err.message || 'Extraction failed. You can still edit rates manually.');
    } finally {
      setExtracting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handlePosterFile(file);
  };

  const updateField = (field, rawValue) => {
    setRateData((prev) => {
      if (field === 'date' || field === 'trend' || field === 'customMalayalamText') {
        return { ...prev, [field]: rawValue };
      }
      const num = rawValue === '' ? '' : Number(rawValue);
      const next = { ...prev, [field]: num };
      if (field === 'rate_22k_1g' && autoSync8g && Number.isFinite(num) && num > 0) {
        next.rate_22k_8g = Math.round(num * 8);
      }
      return next;
    });
  };

  const loadSampleKGSMA = () => {
    setRateData({
      date: formatDateDDMMMYYYY(),
      rate_22k_1g: 11250,
      rate_22k_8g: 90000,
      rate_18k_1g: 9280,
      rate_9k_1g: 4650,
      change_1g: 60,
      trend: 'UP',
      customMalayalamText: '',
    });
    setExtractError('');
    setExtractSuccess(true);
    notify('Loaded sample KGSMA board rates for preview.', 'info');
  };

  const pavanChange = calculatePavanChange(rateData.change_1g);
  const autoMalayalam = buildMalayalamStatusText(rateData.change_1g, rateData.trend);

  return (
    <section className="studio-card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Step 1 • AI Rate Extraction
          </span>
          <h2 className="font-serif text-lg font-bold text-stone-100">
            Association Poster & Daily Rates
          </h2>
        </div>
        <button
          type="button"
          onClick={loadSampleKGSMA}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-stone-300 transition hover:border-gold-400/35 hover:text-gold-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Sample KGSMA
        </button>
      </div>

      {/* Drag & Drop / Mobile Camera Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-xl border-2 border-dashed p-4 transition-all ${
          dragging
            ? 'border-gold-400 bg-gold-500/10'
            : 'border-gold-500/25 bg-black/25 hover:border-gold-400/45'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handlePosterFile(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handlePosterFile(e.target.files[0]);
            e.target.value = '';
          }}
        />

        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          {posterPreview ? (
            <img
              src={posterPreview}
              alt="Uploaded association rate poster"
              className="h-20 w-20 shrink-0 rounded-lg border border-gold-400/30 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300">
              <Sparkles className="h-7 w-7" />
            </div>
          )}

          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-100">
              Upload KGSMA / Association Rate Poster
            </p>
            <p className="mt-0.5 text-xs text-stone-400">
              Gemini 2.5 Flash extracts 22K, 18K, 9K rates, 1g change &amp; Malayalam pavan status automatically.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                disabled={extracting}
                onClick={() => fileInputRef.current?.click()}
                className="gold-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-60"
              >
                {extracting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {extracting ? 'Extracting with Gemini...' : 'Upload Poster'}
              </button>

              <button
                type="button"
                disabled={extracting}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold-400/25 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:bg-white/10 disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5 text-gold-300" />
                Camera
              </button>
            </div>
          </div>
        </div>

        {extractSuccess && !extracting && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Rates populated! Review or fine-tune any field below before generating.</span>
          </div>
        )}

        {extractError && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>{extractError}</span>
            </div>
            {!geminiConnected && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="rounded-md bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-400/30"
              >
                Configure Key
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editable Gold Rate Form */}
      <div className="mt-4 space-y-3.5">
        {/* Date & Trend Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Poster Date (DD-MMM-YYYY)
            </label>
            <input
              type="text"
              value={rateData.date}
              onChange={(e) => updateField('date', e.target.value.toUpperCase())}
              placeholder="26-NOV-2026"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-semibold tracking-wide text-gold-100 outline-none transition focus:border-gold-400/60"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Market Trend
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
              {[
                { id: 'UP', label: 'UP', icon: TrendingUp, activeClass: 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50' },
                { id: 'DOWN', label: 'DOWN', icon: TrendingDown, activeClass: 'bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50' },
                { id: 'UNCHANGED', label: 'SAME', icon: Minus, activeClass: 'bg-gold-500/25 text-gold-200 ring-1 ring-gold-400/50' },
              ].map((item) => {
                const Icon = item.icon;
                const active = rateData.trend === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateField('trend', item.id)}
                    className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                      active ? item.activeClass : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 22K 1g & 8g Primary Rates */}
        <div className="rounded-xl border border-gold-400/20 bg-gold-500/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-300">
              22K (916) Primary Rates
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-stone-400">
              <input
                type="checkbox"
                checked={autoSync8g}
                onChange={(e) => setAutoSync8g(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-gold-400"
              />
              Auto-calc 8g (×8)
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-stone-400">
                1 GRAM (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={rateData.rate_22k_1g}
                onChange={(e) => updateField('rate_22k_1g', e.target.value)}
                className="w-full rounded-xl border border-gold-400/25 bg-black/50 px-3 py-2 text-base font-bold text-white outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-stone-400">
                8 GRAM / PAVAN (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={rateData.rate_22k_8g}
                onChange={(e) => updateField('rate_22k_8g', e.target.value)}
                className="w-full rounded-xl border border-gold-400/25 bg-black/50 px-3 py-2 text-base font-bold text-white outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>

        {/* 18K, 9K & 1g Change */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-stone-400">
              18K / 1g (₹)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={rateData.rate_18k_1g}
              onChange={(e) => updateField('rate_18k_1g', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 text-sm font-bold text-stone-100 outline-none focus:border-gold-400/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-stone-400">
              9K / 1g (₹)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={rateData.rate_9k_1g}
              onChange={(e) => updateField('rate_9k_1g', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 text-sm font-bold text-stone-100 outline-none focus:border-gold-400/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-stone-400">
              1g Change (₹)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={rateData.change_1g}
              onChange={(e) => updateField('change_1g', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 text-sm font-bold text-gold-200 outline-none focus:border-gold-400/60"
            />
          </div>
        </div>

        {/* Auto-calculated Malayalam Status Line Preview & Optional Override */}
        <div className="rounded-xl border border-white/10 bg-black/35 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Malayalam Pavan Status (Auto: ₹{formatINR(pavanChange)} / Pavan)
            </span>
            {rateData.customMalayalamText && (
              <button
                type="button"
                onClick={() => updateField('customMalayalamText', '')}
                className="text-[11px] font-semibold text-gold-300 hover:underline"
              >
                Reset to Auto
              </button>
            )}
          </div>
          <input
            type="text"
            value={rateData.customMalayalamText || autoMalayalam}
            onChange={(e) => updateField('customMalayalamText', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-malayalam text-sm font-semibold text-gold-100 outline-none focus:border-gold-400/50"
          />
        </div>

        {/* Save Rate History Button */}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={savingRate}
            onClick={onSaveRate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold-400/30 bg-gold-500/10 px-3.5 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-500/20 disabled:opacity-50"
          >
            {savingRate ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Today&apos;s Rate to History
          </button>
        </div>
      </div>
    </section>
  );
}
