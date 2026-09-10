'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Key,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Play,
  RotateCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Filter,
  Layers,
  ChevronRight,
  ExternalLink,
  Sliders,
  CalendarPlus,
  Activity,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  PlannedWorkoutItem,
  ActivityItem,
  ConnectionStatus,
  LogItem,
  SessionStats,
  SyncMode,
  MobileTab
} from '@/lib/types';
import { formatDuration, formatRelativeDay, getSportBadge } from '@/lib/formatters';

interface MobileViewProps {
  syncMode: SyncMode;
  setSyncMode: (mode: SyncMode) => void;
  // Credentials
  athleteId: string;
  setAthleteId: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  cookie: string;
  setCookie: (v: string) => void;
  saveCredentials: () => void;
  restoreDefaults: () => void;
  clearAllCache: () => void;
  // Connection Test
  testConnections: () => void;
  isTesting: boolean;
  connectionStatus: ConnectionStatus;
  // Planned Workouts
  plannedWorkouts: PlannedWorkoutItem[];
  isLoadingPlanned: boolean;
  selectedPlannedIds: Set<string>;
  toggleSelectAllPlanned: () => void;
  toggleSelectOnePlanned: (id: string) => void;
  fetchPlannedWorkouts: () => void;
  syncSinglePlannedWorkout: (w: PlannedWorkoutItem) => void;
  runBatchSyncPlanned: () => void;
  onOpenDetailModal: (w: PlannedWorkoutItem) => void;
  // Date Filtering
  plannedDaysPreset: number;
  setPlannedDaysPreset: (days: number) => void;
  customRange: boolean;
  setCustomRange: (v: boolean) => void;
  plannedStartDate: string;
  setPlannedStartDate: (v: string) => void;
  plannedEndDate: string;
  setPlannedEndDate: (v: string) => void;
  // Completed Activities
  activities: ActivityItem[];
  isLoadingActivities: boolean;
  selectedActivityIds: Set<string>;
  toggleSelectAllCompleted: () => void;
  toggleSelectOneCompleted: (id: string) => void;
  fetchCompletedActivities: () => void;
  syncSingleCompletedActivity: (a: ActivityItem) => void;
  runBatchSyncCompleted: () => void;
  // Options & State
  ignoreCache: boolean;
  setIgnoreCache: (v: boolean) => void;
  syncedCache: Record<string, string>;
  isSyncing: boolean;
  syncProgress: { current: number; total: number; itemName: string };
  stats: SessionStats;
  logs: LogItem[];
  logFilter: 'all' | 'ok' | 'warn' | 'error';
  setLogFilter: (f: 'all' | 'ok' | 'warn' | 'error') => void;
  copyLogText: () => void;
  copiedLog: boolean;
  logContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function MobileView(props: MobileViewProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('workouts');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCookie, setShowCookie] = useState(false);

  const {
    syncMode,
    setSyncMode,
    athleteId,
    setAthleteId,
    apiKey,
    setApiKey,
    cookie,
    setCookie,
    saveCredentials,
    restoreDefaults,
    clearAllCache,
    testConnections,
    isTesting,
    connectionStatus,
    plannedWorkouts,
    isLoadingPlanned,
    selectedPlannedIds,
    toggleSelectAllPlanned,
    toggleSelectOnePlanned,
    fetchPlannedWorkouts,
    syncSinglePlannedWorkout,
    runBatchSyncPlanned,
    onOpenDetailModal,
    plannedDaysPreset,
    setPlannedDaysPreset,
    customRange,
    setCustomRange,
    plannedStartDate,
    setPlannedStartDate,
    plannedEndDate,
    setPlannedEndDate,
    activities,
    isLoadingActivities,
    selectedActivityIds,
    toggleSelectAllCompleted,
    toggleSelectOneCompleted,
    fetchCompletedActivities,
    syncSingleCompletedActivity,
    runBatchSyncCompleted,
    ignoreCache,
    setIgnoreCache,
    syncedCache,
    isSyncing,
    syncProgress,
    stats,
    logs,
    logFilter,
    setLogFilter,
    copyLogText,
    copiedLog,
    logContainerRef
  } = props;

  const selectedCount =
    syncMode === 'planned' ? selectedPlannedIds.size : selectedActivityIds.size;
  const totalCount =
    syncMode === 'planned' ? plannedWorkouts.length : activities.length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] pb-24 text-[#e6edf3]">
      {/* Mobile Top Subheader */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between gap-2 sticky top-[57px] z-20 backdrop-blur-md">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
          <button
            type="button"
            onClick={() => setSyncMode('planned')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              syncMode === 'planned'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Futuros</span>
          </button>
          <button
            type="button"
            onClick={() => setSyncMode('completed')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              syncMode === 'completed'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Executados</span>
          </button>
        </div>

        {/* Connection status pill */}
        <div
          onClick={() => setActiveTab('credentials')}
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] cursor-pointer"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSyncing
                ? 'bg-amber-400 animate-pulse'
                : connectionStatus.tested &&
                  connectionStatus.intervals?.ok &&
                  connectionStatus.tp?.ok
                ? 'bg-emerald-400'
                : 'bg-blue-400'
            }`}
          />
          <span className="truncate max-w-[90px]">
            {connectionStatus.tested &&
            connectionStatus.intervals?.ok &&
            connectionStatus.tp?.ok
              ? 'Conectado'
              : 'Verificar'}
          </span>
        </div>
      </div>

      {/* Syncing Progress Banner (if active) */}
      {isSyncing && (
        <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border-b border-blue-500/40 px-4 py-2.5 text-xs text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>
              Sincronizando {syncProgress.current} de {syncProgress.total}...
            </span>
          </div>
          <span className="font-mono font-bold text-white">
            {Math.round((syncProgress.current / (syncProgress.total || 1)) * 100)}%
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: WORKOUTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'workouts' && (
        <div className="p-4 space-y-4">
          {/* Quick Date Range Filters (Carousel) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                {syncMode === 'planned' ? 'Período dos Treinos' : 'Período das Atividades'}
              </span>
              <button
                type="button"
                onClick={
                  syncMode === 'planned' ? fetchPlannedWorkouts : fetchCompletedActivities
                }
                disabled={isLoadingPlanned || isLoadingActivities || isSyncing}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <RotateCw
                  className={`w-3 h-3 ${
                    isLoadingPlanned || isLoadingActivities ? 'animate-spin' : ''
                  }`}
                />
                Atualizar
              </button>
            </div>

            {syncMode === 'planned' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { label: 'Hoje + 7d', days: 7 },
                  { label: '14 dias', days: 14 },
                  { label: '30 dias', days: 30 },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => {
                      setPlannedDaysPreset(item.days);
                      setCustomRange(false);
                      setTimeout(fetchPlannedWorkouts, 50);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      !customRange && plannedDaysPreset === item.days
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCustomRange(!customRange)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    customRange
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-white'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            )}

            {customRange && (
              <div className="bg-[#161b22] p-3 rounded-xl border border-[#30363d] space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8b949e] mb-1">De</label>
                    <input
                      type="date"
                      value={plannedStartDate}
                      onChange={(e) => setPlannedStartDate(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8b949e] mb-1">Até</label>
                    <input
                      type="date"
                      value={plannedEndDate}
                      onChange={(e) => setPlannedEndDate(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchPlannedWorkouts}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Buscar Período
                </button>
              </div>
            )}
          </div>

          {/* Selection and Cache Bar */}
          <div className="bg-[#161b22] p-3 rounded-xl border border-[#30363d] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={
                syncMode === 'planned' ? toggleSelectAllPlanned : toggleSelectAllCompleted
              }
              className="flex items-center gap-2 text-xs font-medium text-white hover:text-blue-300"
            >
              {selectedCount === totalCount && totalCount > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>
                {selectedCount === totalCount && totalCount > 0
                  ? 'Desmarcar Todos'
                  : `Selecionar Todos (${selectedCount}/${totalCount})`}
              </span>
            </button>

            <label className="flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreCache}
                onChange={(e) => setIgnoreCache(e.target.checked)}
                className="rounded border-[#30363d] text-blue-500 bg-[#0d1117]"
              />
              <span>Pular já sincronizados</span>
            </label>
          </div>

          {/* WORKOUT LIST */}
          <div className="space-y-3">
            {syncMode === 'planned' ? (
              isLoadingPlanned ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-3">
                  <RotateCw className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
                  <p className="text-sm font-medium text-white">
                    Buscando treinos planejados no Intervals.icu...
                  </p>
                  <p className="text-xs text-[#8b949e]">
                    Acessando o calendário do atleta {athleteId}
                  </p>
                </div>
              ) : plannedWorkouts.length === 0 ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-gray-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">
                    Nenhum treino planejado encontrado
                  </h3>
                  <p className="text-xs text-[#8b949e] leading-relaxed max-w-xs mx-auto">
                    Não há treinos cadastrados na categoria de prescrição para este período no seu Intervals.
                  </p>
                  <button
                    type="button"
                    onClick={fetchPlannedWorkouts}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                plannedWorkouts.map((w) => {
                  const eventId = String(w.id);
                  const isSelected = selectedPlannedIds.has(eventId);
                  const isSynced = Boolean(syncedCache[`planned_${eventId}`]);
                  const badge = getSportBadge(w.type);
                  const rel = formatRelativeDay(w.start_date_local);

                  return (
                    <div
                      key={eventId}
                      className={`bg-[#161b22] border rounded-2xl p-4 transition-all ${
                        isSelected
                          ? 'border-blue-500/80 ring-1 ring-blue-500/50 shadow-md shadow-blue-950/20'
                          : 'border-[#30363d] opacity-95'
                      }`}
                    >
                      {/* Top Row: Checkbox + Date + Sport Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                          onClick={() => toggleSelectOnePlanned(eventId)}
                        >
                          <div className="p-1 -m-1">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-400 shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-500 shrink-0" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  rel.isToday
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : rel.isTomorrow
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-gray-800 text-gray-300 border border-gray-700'
                                }`}
                              >
                                {rel.label} {rel.sub}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isSynced ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> No TP
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 shrink-0">
                            Pendente
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div
                        className="cursor-pointer"
                        onClick={() => onOpenDetailModal(w)}
                      >
                        <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                          {w.name}
                        </h4>
                      </div>

                      {/* Metrics: Duration & TSS */}
                      <div className="flex items-center gap-3 text-xs text-[#8b949e] font-mono mt-2 pt-2 border-t border-[#30363d]/70">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-white font-semibold">
                            {formatDuration(w.moving_time || w.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 font-semibold">
                            {w.icu_training_load || '--'} TSS
                          </span>
                        </div>
                        {w.indoor && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                            Indoor
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#30363d]/50">
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(w)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition-colors text-center"
                        >
                          Ver Blocos & Zonas
                        </button>

                        <button
                          type="button"
                          onClick={() => syncSinglePlannedWorkout(w)}
                          disabled={isSyncing}
                          className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Completed Activities list */
              isLoadingActivities ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-3">
                  <RotateCw className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                  <p className="text-sm font-medium text-white">
                    Buscando atividades executadas no Intervals.icu...
                  </p>
                </div>
              ) : activities.length === 0 ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-3">
                  <Activity className="w-10 h-10 text-gray-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">
                    Nenhuma atividade encontrada no período
                  </h3>
                  <button
                    type="button"
                    onClick={fetchCompletedActivities}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white"
                  >
                    Buscar Atividades
                  </button>
                </div>
              ) : (
                activities.map((act) => {
                  const actId = String(act.id);
                  const isSelected = selectedActivityIds.has(actId);
                  const isSynced = Boolean(syncedCache[actId]);
                  const badge = getSportBadge(act.type);

                  return (
                    <div
                      key={actId}
                      className={`bg-[#161b22] border rounded-2xl p-4 transition-all ${
                        isSelected
                          ? 'border-purple-500/80 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/20'
                          : 'border-[#30363d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                          onClick={() => toggleSelectOneCompleted(actId)}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-purple-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-500 shrink-0" />
                          )}
                          <div>
                            <span className="text-xs text-[#8b949e]">
                              {act.start_date_local.split('T')[0]}
                            </span>
                            <h4 className="text-base font-bold text-white leading-snug">
                              {act.name}
                            </h4>
                          </div>
                        </div>

                        {isSynced ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Enviado
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                            Pendente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#8b949e] font-mono mt-2 pt-2 border-t border-[#30363d]/70">
                        <span>{badge.label}</span>
                        <span>•</span>
                        <span>{formatDuration(act.moving_time || act.elapsed_time)}</span>
                        <span>•</span>
                        <span>{act.icu_training_load || '--'} TSS</span>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-[#30363d]/50">
                        <a
                          href={`/api/download-fit?athleteId=${encodeURIComponent(athleteId)}&apiKey=${encodeURIComponent(apiKey)}&activityId=${actId}`}
                          download={`${act.name.replace(/\s+/g, '_')}.fit`}
                          className="py-1.5 px-3 rounded-lg text-xs font-medium bg-[#21262d] text-white border border-[#30363d] flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          .FIT
                        </a>

                        <button
                          type="button"
                          onClick={() => syncSingleCompletedActivity(act)}
                          disabled={isSyncing}
                          className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                        >
                          Enviar FIT ao TP
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CREDENTIALS & CONNECTIONS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'credentials' && (
        <div className="p-4 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Credenciais de Acesso
                </h3>
              </div>
              <button
                type="button"
                onClick={restoreDefaults}
                className="text-xs text-blue-400 hover:underline"
              >
                Restaurar Padrão
              </button>
            </div>

            {/* Intervals Athlete ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#8b949e]">
                Intervals.icu - Athlete ID
              </label>
              <input
                id="mobile-athlete-id"
                type="text"
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                placeholder="Ex: i482617"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
              />
            </div>

            {/* Intervals API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#8b949e]">
                  Intervals.icu - API Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showApiKey ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                id="mobile-api-key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Chave de API do Intervals"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
              />
            </div>

            {/* TrainingPeaks Cookie */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#8b949e]">
                  TrainingPeaks - Cookie de Sessão
                </label>
                <button
                  type="button"
                  onClick={() => setShowCookie(!showCookie)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  {showCookie ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showCookie ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <textarea
                id="mobile-cookie"
                rows={3}
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="Production_tpAuth=V001..."
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none resize-none"
              />
              <p className="text-[11px] text-[#8b949e]">
                Cookie <code>Production_tpAuth</code>. O servidor troca pelo Bearer Token oficial.
              </p>
            </div>

            {/* Test connection results */}
            {connectionStatus.tested && (
              <div className="space-y-2 pt-2 border-t border-[#30363d]">
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    connectionStatus.intervals?.ok
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border border-red-500/30'
                  }`}
                >
                  {connectionStatus.intervals?.ok ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>
                    Intervals.icu:{' '}
                    {connectionStatus.intervals?.ok
                      ? `Conectado (${connectionStatus.intervals.data.name || connectionStatus.intervals.data.id})`
                      : connectionStatus.intervals?.error || 'Falha'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    connectionStatus.tp?.ok
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border border-red-500/30'
                  }`}
                >
                  {connectionStatus.tp?.ok ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>
                    TrainingPeaks:{' '}
                    {connectionStatus.tp?.ok
                      ? `Conectado (Atleta ${connectionStatus.tp.data.athleteId})`
                      : connectionStatus.tp?.error || 'Falha'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={testConnections}
                disabled={isTesting}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <ShieldCheck className={`w-4 h-4 text-blue-400 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Verificando Conexões...' : 'Testar Conexões Agora'}</span>
              </button>

              <button
                type="button"
                onClick={saveCredentials}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors text-center shadow-sm"
              >
                Salvar Credenciais no Navegador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: STATS & LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="p-4 space-y-4">
          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5">
              <span className="text-[10px] uppercase font-semibold text-[#8b949e] block">
                Enviados ao TP
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {stats.uploaded}
              </span>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5">
              <span className="text-[10px] uppercase font-semibold text-[#8b949e] block">
                Pulados / Em Cache
              </span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {stats.skipped}
              </span>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5">
              <span className="text-[10px] uppercase font-semibold text-[#8b949e] block">
                Erros
              </span>
              <span className="text-2xl font-extrabold text-red-400 font-mono">
                {stats.errors}
              </span>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5">
              <span className="text-[10px] uppercase font-semibold text-[#8b949e] block">
                IDs em Memória
              </span>
              <span className="text-2xl font-extrabold text-blue-400 font-mono">
                {Object.keys(syncedCache).length}
              </span>
            </div>
          </div>

          {/* Console Section */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Console de Atividades
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyLogText}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLog ? 'Copiado' : 'Copiar'}</span>
                </button>
                <span className="text-gray-600">|</span>
                <button
                  type="button"
                  onClick={clearAllCache}
                  className="text-xs text-red-400 hover:underline"
                >
                  Limpar Cache
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              {(['all', 'ok', 'warn', 'error'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLogFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase transition-all ${
                    logFilter === filter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d]'
                  }`}
                >
                  {filter === 'all'
                    ? 'Todos'
                    : filter === 'ok'
                    ? 'Sucesso'
                    : filter === 'warn'
                    ? 'Avisos'
                    : 'Erros'}
                </button>
              ))}
            </div>

            {/* Logs feed */}
            <div
              ref={logContainerRef}
              className="bg-[#010409] border border-[#30363d] rounded-xl p-3 h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 select-text"
            >
              {logs.length === 0 ? (
                <span className="text-gray-500 italic">Sem eventos ainda.</span>
              ) : (
                logs
                  .filter((l) => logFilter === 'all' || l.level === logFilter)
                  .map((item) => (
                    <div key={item.id} className="leading-relaxed break-words">
                      <span className="text-gray-500 mr-1.5">[{item.timestamp}]</span>
                      <span
                        className={`font-semibold mr-1.5 uppercase text-[9px] px-1 py-0.2 rounded ${
                          item.level === 'ok'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.level === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : item.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {item.level}
                      </span>
                      <span
                        className={
                          item.level === 'ok'
                            ? 'text-emerald-300'
                            : item.level === 'error'
                            ? 'text-red-300'
                            : item.level === 'warn'
                            ? 'text-amber-300'
                            : 'text-gray-300'
                        }
                      >
                        {item.message}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) FOR BATCH SYNC (visible on workouts tab) */}
      {activeTab === 'workouts' && selectedCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-30 max-w-md mx-auto animate-fadeIn">
          <button
            type="button"
            onClick={syncMode === 'planned' ? runBatchSyncPlanned : runBatchSyncCompleted}
            disabled={isSyncing}
            className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-900/40 flex items-center justify-between border border-blue-400/30 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <CalendarPlus className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? `Enviando (${syncProgress.current}/${syncProgress.total})...`
                  : `Sincronizar ${selectedCount} Treino${selectedCount > 1 ? 's' : ''} no TP`}
              </span>
            </div>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
              {selectedCount} selecionados
            </span>
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#161b22]/95 backdrop-blur-md border-t border-[#30363d] px-6 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('workouts')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'workouts' ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Calendar className="w-5 h-5" />
              {selectedCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-mono">
                  {selectedCount}
                </span>
              )}
            </div>
            <span className="text-[11px]">Treinos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'credentials'
                ? 'text-blue-400 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-5 h-5" />
            <span className="text-[11px]">Acessos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'logs' ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">Logs</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
