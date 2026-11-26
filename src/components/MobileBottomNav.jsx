import React from 'react';
import { LayoutGrid, FolderHeart, Download, History } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, generatedCount }) {
  const tabs = [
    { id: 'studio', label: 'Studio', icon: LayoutGrid },
    { id: 'ornaments', label: 'Ornaments', icon: FolderHeart },
    { id: 'exports', label: 'Exports', icon: Download, badge: generatedCount },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/20 bg-[#0C0D12]/95 px-2 pt-1.5 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition ${
                active
                  ? 'bg-gold-500/15 text-gold-200'
                  : 'text-stone-400 active:bg-white/5'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? 'text-gold-300' : 'text-stone-400'}`} />
                {tab.badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold-400 px-1 text-[9px] font-bold text-obsidian-950">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
