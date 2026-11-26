import React from 'react';
import { History, TrendingUp, TrendingDown, Minus, Trash2, ArrowUpRight, RefreshCw } from 'lucide-react';
import { buildMalayalamStatusText, formatINR } from '../utils/formatters';

export default function RateHistoryPanel({
  rates,
  loading,
  onRefresh,
  onLoadRate,
  onDeleteRate,
}) {
  return (
    <section className="studio-card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Supabase Archive • daily_rates
          </span>
          <h2 className="font-serif text-xl font-bold text-stone-100">
            Daily Gold Rate History
          </h2>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-stone-200 hover:border-gold-400/40 hover:text-gold-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {rates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <History className="h-10 w-10 text-gold-400/35" />
          <p className="mt-3 text-sm font-semibold text-stone-200">No saved daily rates yet</p>
          <p className="mt-1 max-w-sm text-xs text-stone-400">
            Click &ldquo;Save Today&apos;s Rate to History&rdquo; in the Daily Studio to store your daily gold board rates in Supabase.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rates.map((row) => {
            const malLine = buildMalayalamStatusText(row.change_1g, row.trend);
            const TrendIcon =
              row.trend === 'UP' ? TrendingUp : row.trend === 'DOWN' ? TrendingDown : Minus;
            const trendBadge =
              row.trend === 'UP'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                : row.trend === 'DOWN'
                  ? 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                  : 'border-gold-500/30 bg-gold-500/15 text-gold-200';

            return (
              <div
                key={row.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/35 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-base font-bold text-gold-100">
                      {row.rate_date}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${trendBadge}`}
                    >
                      <TrendIcon className="h-3 w-3" />
                      {row.trend} {row.change_1g > 0 ? `₹${row.change_1g}/g` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-300">
                    <span>
                      22K 1g: <strong className="text-white">₹{formatINR(row.rate_22k_1g)}</strong>
                    </span>
                    <span>
                      22K 8g: <strong className="text-white">₹{formatINR(row.rate_22k_8g)}</strong>
                    </span>
                    <span>
                      18K: <strong className="text-stone-200">₹{formatINR(row.rate_18k_1g)}</strong>
                    </span>
                    <span>
                      9K: <strong className="text-stone-200">₹{formatINR(row.rate_9k_1g)}</strong>
                    </span>
                  </div>
                  <p className="font-malayalam text-xs text-gold-200/90">{malLine}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadRate(row)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gold-400/30 bg-gold-500/10 px-3 py-2 text-xs font-bold text-gold-200 hover:bg-gold-500/20"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Load in Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRate(row.id)}
                    title="Delete entry"
                    className="rounded-xl border border-white/10 p-2 text-stone-400 hover:bg-rose-500/20 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
