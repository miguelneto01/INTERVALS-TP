'use client';

import React, { useState } from 'react';
import { Heart, Activity, Sliders, Check, RotateCcw, Info, Zap } from 'lucide-react';
import { AthleteHrSettings } from '@/lib/types';

interface HrZonesCardProps {
  athleteHr: AthleteHrSettings;
  userLthr: number;
  setUserLthr: (val: number) => void;
  userMaxHr: number;
  setUserMaxHr: (val: number) => void;
  userFtp?: number;
  setUserFtp?: (val: number) => void;
  onSave?: () => void;
}

export function HrZonesCard({
  athleteHr,
  userLthr,
  setUserLthr,
  userMaxHr,
  setUserMaxHr,
  userFtp,
  setUserFtp,
  onSave,
}: HrZonesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLthr, setTempLthr] = useState(userLthr);
  const [tempMaxHr, setTempMaxHr] = useState(userMaxHr);
  const [tempFtp, setTempFtp] = useState(userFtp || 200);

  // Recalculate preview zones based on current LTHR
  const effectiveLthr = userLthr || athleteHr.lthr || 165;
  const effectiveMaxHr = userMaxHr || athleteHr.maxHr || 190;

  const zoneConfigs = [
    { zone: 1, name: 'Z1 Recuperação', minPct: 65, maxPct: 81, bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { zone: 2, name: 'Z2 Aeróbico (Endurance)', minPct: 82, maxPct: 89, bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { zone: 3, name: 'Z3 Tempo', minPct: 90, maxPct: 93, bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { zone: 4, name: 'Z4 Sub-Limiar', minPct: 94, maxPct: 99, bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { zone: 5, name: 'Z5 Limiar / VO2Max', minPct: 100, maxPct: 106, bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  ];

  const handleApply = () => {
    setUserLthr(tempLthr);
    setUserMaxHr(tempMaxHr);
    if (setUserFtp) setUserFtp(tempFtp);
    setIsEditing(false);
    if (onSave) onSave();
  };

  const handleResetToDetected = () => {
    setTempLthr(athleteHr.lthr || 165);
    setTempMaxHr(athleteHr.maxHr || 190);
    if (athleteHr.ftp) setTempFtp(athleteHr.ftp);
    setUserLthr(athleteHr.lthr || 165);
    setUserMaxHr(athleteHr.maxHr || 190);
    if (setUserFtp && athleteHr.ftp) setUserFtp(athleteHr.ftp);
    setIsEditing(false);
    if (onSave) onSave();
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Calibração de Frequência Cardíaca (GPS & TP)
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Padrão Joe Friel / TP
              </span>
            </h3>
            <p className="text-xs text-[#8b949e]">
              Garante que as metas de FC dos treinos no GPS Garmin/Wahoo correspondam às zonas do TrainingPeaks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setTempLthr(effectiveLthr);
                setTempMaxHr(effectiveMaxHr);
                if (userFtp) setTempFtp(userFtp);
                setIsEditing(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Ajustar Limiares
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDetected}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-[#21262d] hover:bg-[#30363d] transition-colors flex items-center gap-1"
                title="Restaurar valores detectados"
              >
                <RotateCcw className="w-3 h-3" />
                Auto
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Badges / Inputs */}
      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              FC Limiar (LTHR / FTHR) em BPM:
            </label>
            <input
              type="number"
              min="100"
              max="220"
              value={tempLthr}
              onChange={(e) => setTempLthr(Number(e.target.value))}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              FC Máxima (Max HR) em BPM:
            </label>
            <input
              type="number"
              min="120"
              max="230"
              value={tempMaxHr}
              onChange={(e) => setTempMaxHr(Number(e.target.value))}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              FTP de Ciclismo (Watts):
            </label>
            <input
              type="number"
              min="50"
              max="600"
              value={tempFtp}
              onChange={(e) => setTempFtp(Number(e.target.value))}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-center">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Limiar LTHR
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-red-400">
              {effectiveLthr} <span className="text-xs font-normal text-gray-400">bpm</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-center">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              FC Máxima
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-pink-400">
              {effectiveMaxHr} <span className="text-xs font-normal text-gray-400">bpm</span>
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-center">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              FTP Potência
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-amber-400">
              {userFtp || athleteHr.ftp || '--'} <span className="text-xs font-normal text-gray-400">W</span>
            </span>
          </div>
        </div>
      )}

      {/* 5 HR Zones breakdown */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-gray-400 block mb-1">
          Zonas Mapeadas para o GPS (Baseadas no Limiar de {effectiveLthr} bpm):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
          {zoneConfigs.map((zc) => {
            const minBpm = Math.round((zc.minPct / 100) * effectiveLthr);
            const maxBpm = Math.round((zc.maxPct / 100) * effectiveLthr);
            return (
              <div
                key={zc.zone}
                className={`p-2 rounded-xl border ${zc.bg} flex sm:flex-col justify-between items-center sm:items-start`}
              >
                <div className="font-bold text-xs">{zc.name}</div>
                <div className="font-mono text-[11px] mt-0.5 sm:mt-1 font-semibold">
                  {minBpm} - {maxBpm} bpm
                </div>
                <div className="text-[10px] opacity-75 font-mono">
                  {zc.minPct}% - {zc.maxPct}% LTHR
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2 text-xs text-blue-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
        <div>
          <strong>Correção de Frequência Cardíaca Ativa:</strong> Cada passo do treino no Intervals é convertido para porcentagem precisa do Limiar de Frequência Cardíaca (% LTHR) do TrainingPeaks, sem multiplicadores arbitrários. No seu GPS Garmin ou Wahoo, a zona exibida e os alertas de batimento coincidirão com os do TrainingPeaks.
        </div>
      </div>
    </div>
  );
}
