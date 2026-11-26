import React from 'react';
import {
  Settings,
  Database,
  Sparkles,
  FolderHeart,
  History,
  LayoutGrid,
  Download,
} from 'lucide-react';
import { DEFAULT_BRAND_BADGE_URL } from '../constants/themes';

export default function Header({
  activeTab,
  setActiveTab,
  supabaseConnected,
  geminiConnected,
  onOpenSettings,
  ornamentCount,
  generatedCount,
}) {
  const navItems = [
    { id: 'studio', label: 'Daily Studio', icon: LayoutGrid },
    { id: 'ornaments', label: 'Ornament Folder', icon: FolderHeart, badge: ornamentCount },
    { id: 'exports', label: 'Exports (4)', icon: Download, badge: generatedCount || null },
    { id: 'history', label: 'Rate History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/15 bg-[#0B0C10]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1640px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-gold-400/35 bg-[#013528] shadow-gold">
            <img
              src={DEFAULT_BRAND_BADGE_URL}
              alt="Majestic Jewellers Since 1970"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold tracking-wide gold-text-gradient sm:text-xl">
                Today Rate
              </h1>
              <span className="hidden rounded-full border border-gold-400/25 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold-200 sm:inline-block">
                Since 1970
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
              Majestic Jewellers • Tirur
            </p>
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <nav className="hidden items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-gold-400/20 to-gold-600/15 text-gold-100 ring-1 ring-gold-400/35 shadow-sm'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-gold-300' : 'text-stone-400'}`} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-gold-400 text-obsidian-950' : 'bg-white/10 text-stone-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Settings */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            title="Supabase Connection Status"
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition sm:flex ${
              supabaseConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>{supabaseConnected ? 'Supabase Live' : 'Local Mode'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Gemini AI Connection Status"
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition lg:flex ${
              geminiConnected
                ? 'border-gold-400/30 bg-gold-500/10 text-gold-200'
                : 'border-stone-700 bg-stone-800/70 text-stone-400'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{geminiConnected ? 'Gemini 2.5 Ready' : 'Add Gemini Key'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-xl border border-gold-400/20 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-stone-200 transition hover:border-gold-400/40 hover:bg-gold-500/10 hover:text-gold-100"
          >
            <Settings className="h-4 w-4 text-gold-300" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
