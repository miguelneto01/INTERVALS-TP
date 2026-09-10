'use client';

import React from 'react';
import { X, Download, Calendar, Clock, Flame, Zap, Heart, FileCode, CheckCircle2 } from 'lucide-react';
import { PlannedWorkoutItem } from '@/lib/types';
import { formatDuration, formatRelativeDay, getSportBadge } from '@/lib/formatters';

interface WorkoutDetailModalProps {
  workout: PlannedWorkoutItem | null;
  athleteId: string;
  apiKey: string;
  isSynced: boolean;
  onClose: () => void;
  onSync: (workout: PlannedWorkoutItem) => void;
  isSyncing: boolean;
}

export function WorkoutDetailModal({
  workout,
  athleteId,
  apiKey,
  isSynced,
  onClose,
  onSync,
  isSyncing,
}: WorkoutDetailModalProps) {
  if (!workout) return null;

  const badge = getSportBadge(workout.type);
  const relDay = formatRelativeDay(workout.start_date_local);
  const eventId = String(workout.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all animate-fadeIn">
      {/* Modal / Sheet Container */}
      <div
        className="w-full sm:max-w-xl bg-[#161b22] border border-[#30363d] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-start justify-between gap-3 bg-[#0d1117]">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                {relDay.label} {relDay.sub}
              </span>
              {isSynced && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> No TP
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{workout.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
            <div className="text-center">
              <div className="text-[10px] uppercase text-[#8b949e] font-semibold flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" /> Duração
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {formatDuration(workout.moving_time || workout.duration)}
              </div>
            </div>

            <div className="text-center border-x border-[#30363d]">
              <div className="text-[10px] uppercase text-[#8b949e] font-semibold flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> TSS Previsto
              </div>
              <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                {workout.icu_training_load || '--'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-[10px] uppercase text-[#8b949e] font-semibold flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 text-red-400" /> Ambiente
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {workout.indoor ? 'Indoor (Rolo)' : 'Outdoor'}
              </div>
            </div>
          </div>

          {/* Description & Structured Prescriptions */}
          <div>
            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" /> Prescrição & Blocos de Treino
            </h3>
            {workout.description ? (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 text-xs text-[#c9d1d9] font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {workout.description}
              </div>
            ) : (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-xs text-[#8b949e] text-center italic">
                Sem descrição textual de intervalos cadastrada.
              </div>
            )}
          </div>

          {/* Download structured file options */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-semibold text-white block">Exportar Arquivo do Treino:</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/api/download-planned-workout?athleteId=${encodeURIComponent(athleteId)}&apiKey=${encodeURIComponent(apiKey)}&eventId=${eventId}&format=fit`}
                download={`treino_${workout.name.replace(/\s+/g, '_')}.fit`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Baixar .FIT
              </a>
              <a
                href={`/api/download-planned-workout?athleteId=${encodeURIComponent(athleteId)}&apiKey=${encodeURIComponent(apiKey)}&eventId=${eventId}&format=zwo`}
                download={`treino_${workout.name.replace(/\s+/g, '_')}.zwo`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                Baixar .ZWO (Zwift)
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={() => {
              onSync(workout);
              onClose();
            }}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            {isSynced ? 'Re-sincronizar no TrainingPeaks' : 'Enviar para o TrainingPeaks'}
          </button>
        </div>
      </div>
    </div>
  );
}
