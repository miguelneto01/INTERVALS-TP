'use client';

import React from 'react';
import { Smartphone, Monitor, Sparkles } from 'lucide-react';
import { ViewMode } from '@/lib/types';

interface ViewSwitcherProps {
  currentMode: ViewMode;
  effectiveMode: 'mobile' | 'desktop';
  onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ currentMode, effectiveMode, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d] text-xs font-medium">
      <button
        id="btn-switch-auto"
        type="button"
        onClick={() => onChange('auto')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
          currentMode === 'auto'
            ? 'bg-[#1f6feb] text-white shadow-sm font-semibold'
            : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
        }`}
        title="Adapta automaticamente com base no tamanho da tela"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Auto</span>
      </button>

      <button
        id="btn-switch-mobile"
        type="button"
        onClick={() => onChange('mobile')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
          currentMode === 'mobile'
            ? 'bg-[#1f6feb] text-white shadow-sm font-semibold'
            : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
        }`}
        title="Forçar visualização interface Mobile (Celular)"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Mobile</span>
        {currentMode === 'auto' && effectiveMode === 'mobile' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      <button
        id="btn-switch-desktop"
        type="button"
        onClick={() => onChange('desktop')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
          currentMode === 'desktop'
            ? 'bg-[#1f6feb] text-white shadow-sm font-semibold'
            : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
        }`}
        title="Forçar visualização interface Web / Desktop"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Web / PC</span>
        {currentMode === 'auto' && effectiveMode === 'desktop' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}
      </button>
    </div>
  );
}
