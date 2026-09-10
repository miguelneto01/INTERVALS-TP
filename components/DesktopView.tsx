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
  Search,
  ExternalLink,
  Sliders,
  CalendarPlus,
  Activity,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  HelpCircle,
  FileCode,
  Heart
} from 'lucide-react';
import {
  PlannedWorkoutItem,
  ActivityItem,
  ConnectionStatus,
  LogItem,
  SessionStats,
  SyncMode
} from '@/lib/types';
import { formatDuration, formatRelativeDay, getSportBadge } from '@/lib/formatters';

interface DesktopViewProps {
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

export function DesktopView(props: DesktopViewProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCookie, setShowCookie] = useState(false);
  const [showCredentialsCard, setShowCredentialsCard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

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

  // Search filter
  const filteredPlanned = plannedWorkouts.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.type && w.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredActivities = activities.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.type && a.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLogs = logs.filter(
    (item) => logFilter === 'all' || item.level === logFilter
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-[#e6edf3]">
      {/* 1. METRICS STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4.5 shadow-sm hover:border-[#8b949e]/30 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Enviados ao TP
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {stats.uploaded}
          </div>
          <div className="text-xs text-[#8b949e] mt-1">Sincronizados nesta sessão</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4.5 shadow-sm hover:border-[#8b949e]/30 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Pulados / Já no TP
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {stats.skipped}
          </div>
          <div className="text-xs text-[#8b949e] mt-1">Identificados em cache</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4.5 shadow-sm hover:border-[#8b949e]/30 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Erros / Restrições
            </span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-red-400 font-mono tracking-tight">
            {stats.errors}
          </div>
          <div className="text-xs text-[#8b949e] mt-1">Falhas ou timeouts</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4.5 shadow-sm hover:border-[#8b949e]/30 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Histórico Local
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">
            {Object.keys(syncedCache).length}
          </div>
          <div className="text-xs text-[#8b949e] mt-1">Treinos guardados no cache</div>
        </div>
      </section>

      {/* 2. CREDENTIALS & CONNECTION STATUS BAR */}
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Conexões: Intervals.icu & TrainingPeaks
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  Atleta: {athleteId}
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Autenticação via chave de API (Intervals) e cookie de sessão (TrainingPeaks)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={testConnections}
              disabled={isTesting}
              className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexões'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCredentialsCard(!showCredentialsCard)}
              className="py-2 px-3.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-[#21262d] border border-[#30363d] flex items-center gap-1.5 transition-colors"
            >
              <span>{showCredentialsCard ? 'Ocultar Chaves' : 'Editar Chaves'}</span>
              {showCredentialsCard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Connection quick badges */}
        {connectionStatus.tested && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#30363d]">
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                connectionStatus.intervals?.ok
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                  : 'bg-red-500/10 text-red-300 border border-red-500/25'
              }`}
            >
              {connectionStatus.intervals?.ok ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="truncate">
                Intervals.icu:{' '}
                {connectionStatus.intervals?.ok
                  ? `Atleta ${connectionStatus.intervals.data.name || athleteId} pronto`
                  : connectionStatus.intervals?.error || 'Erro'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                connectionStatus.tp?.ok
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                  : 'bg-red-500/10 text-red-300 border border-red-500/25'
              }`}
            >
              {connectionStatus.tp?.ok ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="truncate">
                TrainingPeaks:{' '}
                {connectionStatus.tp?.ok
                  ? `Token Ativo (Atleta ${connectionStatus.tp.data.athleteId})`
                  : connectionStatus.tp?.error || 'Erro'}
              </span>
            </div>
          </div>
        )}

        {/* Expandable credentials editing panel */}
        {showCredentialsCard && (
          <div className="mt-4 pt-4 border-t border-[#30363d] space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8b949e]">Intervals Athlete ID</label>
                <input
                  type="text"
                  value={athleteId}
                  onChange={(e) => setAthleteId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  placeholder="i482617"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8b949e]">Intervals API Key</label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-gray-400 hover:text-white"
                  >
                    {showApiKey ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8b949e]">TrainingPeaks Cookie</label>
                  <button
                    type="button"
                    onClick={() => setShowCookie(!showCookie)}
                    className="text-[11px] text-gray-400 hover:text-white"
                  >
                    {showCookie ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showCookie ? 'text' : 'password'}
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={restoreDefaults}
                className="text-xs text-gray-400 hover:text-white"
              >
                Restaurar Padrão
              </button>
              <button
                type="button"
                onClick={clearAllCache}
                className="text-xs text-red-400 hover:underline"
              >
                Limpar Cache Local
              </button>
              <button
                type="button"
                onClick={() => {
                  saveCredentials();
                  setShowCredentialsCard(false);
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. MODE SELECTOR (Treinos Planejados vs Atividades Passadas) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSyncMode('planned')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
            syncMode === 'planned'
              ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500 shadow-md shadow-blue-950/20'
              : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-white'
          }`}
        >
          <div
            className={`p-3 rounded-xl shrink-0 ${
              syncMode === 'planned' ? 'bg-blue-600 text-white' : 'bg-[#21262d] text-gray-400'
            }`}
          >
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Treinos Planejados (Calendário)</h3>
              {syncMode === 'planned' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 font-mono font-bold">
                  MODO ATIVO
                </span>
              )}
            </div>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
              Busca os treinos prescritos ainda não executados no Intervals.icu e agenda diretamente no calendário do TrainingPeaks com duração, TSS e descrição dos intervalos.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSyncMode('completed')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
            syncMode === 'completed'
              ? 'bg-purple-600/15 border-purple-500 text-white ring-1 ring-purple-500 shadow-md shadow-purple-950/20'
              : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-white'
          }`}
        >
          <div
            className={`p-3 rounded-xl shrink-0 ${
              syncMode === 'completed' ? 'bg-purple-600 text-white' : 'bg-[#21262d] text-gray-400'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Atividades Concluídas (Arquivos .FIT)</h3>
              {syncMode === 'completed' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 font-mono font-bold">
                  MODO ATIVO
                </span>
              )}
            </div>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
              Busca atividades já executadas no passado no Intervals e faz o upload do arquivo binário .FIT original gravado pelo GPS no TrainingPeaks.
            </p>
          </div>
        </button>
      </section>

      {/* 4. WORKOUT CONTROL TOOLBAR */}
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date presets & search */}
          <div className="flex items-center gap-3 flex-wrap">
            {syncMode === 'planned' && (
              <div className="flex items-center gap-1.5 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !customRange && plannedDaysPreset === item.days
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCustomRange(!customRange)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    customRange ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome ou esporte..."
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={syncMode === 'planned' ? fetchPlannedWorkouts : fetchCompletedActivities}
              disabled={isLoadingPlanned || isLoadingActivities || isSyncing}
              className="py-1.5 px-3 rounded-xl text-xs font-medium text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isLoadingPlanned || isLoadingActivities ? 'animate-spin text-blue-400' : ''
                }`}
              />
              <span>Atualizar Lista</span>
            </button>
          </div>

          {/* Actions & Layout Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Ignore Cache Checkbox */}
            <label className="flex items-center gap-2 text-xs text-[#8b949e] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignoreCache}
                onChange={(e) => setIgnoreCache(e.target.checked)}
                className="rounded border-[#30363d] text-blue-500 bg-[#0d1117]"
              />
              <span>Pular já sincronizados</span>
            </label>

            {/* Layout switch: table vs cards */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === 'table' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Tabela"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Grade de Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Big Batch Sync Button */}
            <button
              type="button"
              onClick={syncMode === 'planned' ? runBatchSyncPlanned : runBatchSyncCompleted}
              disabled={isSyncing || selectedCount === 0}
              className="py-2 px-5 rounded-xl text-xs font-bold bg-[#238636] hover:bg-[#2ea043] text-white flex items-center gap-2 shadow-md shadow-emerald-950/20 transition-all disabled:opacity-40"
            >
              <CalendarPlus className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? `Sincronizando (${syncProgress.current}/${syncProgress.total})...`
                  : `Sincronizar Selecionados (${selectedCount})`}
              </span>
            </button>
          </div>
        </div>

        {/* Custom Range picker expanded */}
        {customRange && syncMode === 'planned' && (
          <div className="flex items-center gap-3 pt-3 border-t border-[#30363d] text-xs">
            <span className="text-[#8b949e]">Intervalo:</span>
            <input
              type="date"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-white"
            />
            <span className="text-[#8b949e]">até</span>
            <input
              type="date"
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-white"
            />
            <button
              type="button"
              onClick={fetchPlannedWorkouts}
              className="py-1 px-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500"
            >
              Aplicar
            </button>
          </div>
        )}

        {/* 5. DATA TABLE OR CARDS */}
        {syncMode === 'planned' ? (
          isLoadingPlanned ? (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Carregando treinos planejados...</p>
              <p className="text-xs text-[#8b949e]">
                Consultando o calendário de eventos do Intervals.icu
              </p>
            </div>
          ) : filteredPlanned.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-[#30363d] rounded-2xl">
              <Calendar className="w-10 h-10 text-gray-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Nenhum treino planejado encontrado</h4>
              <p className="text-xs text-[#8b949e] max-w-md mx-auto">
                Não foram encontrados treinos na categoria WORKOUT cadastrados no período selecionado.
              </p>
              <button
                type="button"
                onClick={fetchPlannedWorkouts}
                className="py-2 px-4 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500"
              >
                Recarregar Treinos
              </button>
            </div>
          ) : viewLayout === 'table' ? (
            /* TABLE VIEW */
            <div className="overflow-x-auto border border-[#30363d] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1117] border-b border-[#30363d] text-[#8b949e] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAllPlanned}
                        className="hover:text-white"
                      >
                        {selectedCount === totalCount && totalCount > 0 ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Data Agendada</th>
                    <th className="p-3">Nome do Treino</th>
                    <th className="p-3">Esporte</th>
                    <th className="p-3 text-center">Duração</th>
                    <th className="p-3 text-center">TSS</th>
                    <th className="p-3 text-center">Status TP</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/60 font-sans">
                  {filteredPlanned.map((w) => {
                    const eventId = String(w.id);
                    const isSelected = selectedPlannedIds.has(eventId);
                    const isSynced = Boolean(syncedCache[`planned_${eventId}`]);
                    const badge = getSportBadge(w.type);
                    const rel = formatRelativeDay(w.start_date_local);

                    return (
                      <tr
                        key={eventId}
                        className={`hover:bg-[#21262d]/50 transition-colors ${
                          isSelected ? 'bg-blue-950/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOnePlanned(eventId)}
                            className="p-1"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                rel.isToday
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : rel.isTomorrow
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-gray-800 text-gray-300 border border-gray-700'
                              }`}
                            >
                              {rel.label}
                            </span>
                            <span className="font-mono text-gray-400">{rel.sub}</span>
                          </div>
                        </td>

                        <td className="p-3 font-semibold text-white max-w-xs truncate">
                          <button
                            type="button"
                            onClick={() => onOpenDetailModal(w)}
                            className="hover:text-blue-400 text-left truncate block max-w-xs transition-colors"
                          >
                            {w.name}
                          </button>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-3 text-center font-mono text-gray-300 whitespace-nowrap">
                          {formatDuration(w.moving_time || w.duration)}
                        </td>

                        <td className="p-3 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                          {w.icu_training_load || '--'}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          {isSynced ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> No TP
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/api/download-planned-workout?athleteId=${encodeURIComponent(athleteId)}&apiKey=${encodeURIComponent(apiKey)}&eventId=${eventId}&format=fit`}
                              download={`treino_${w.name.replace(/\s+/g, '_')}.fit`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-colors"
                              title="Baixar arquivo .FIT"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => onOpenDetailModal(w)}
                              className="py-1 px-2 rounded-lg text-[11px] font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                            >
                              Ver Blocos
                            </button>

                            <button
                              type="button"
                              onClick={() => syncSinglePlannedWorkout(w)}
                              disabled={isSyncing}
                              className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              <span>Enviar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARDS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlanned.map((w) => {
                const eventId = String(w.id);
                const isSelected = selectedPlannedIds.has(eventId);
                const isSynced = Boolean(syncedCache[`planned_${eventId}`]);
                const badge = getSportBadge(w.type);
                const rel = formatRelativeDay(w.start_date_local);

                return (
                  <div
                    key={eventId}
                    className={`bg-[#0d1117] border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500/80 ring-1 ring-blue-500/40 shadow-md shadow-blue-950/20'
                        : 'border-[#30363d]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleSelectOnePlanned(eventId)}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
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
                        </div>

                        {isSynced ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            No TP
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                            Pendente
                          </span>
                        )}
                      </div>

                      <h4
                        className="text-sm font-bold text-white leading-snug cursor-pointer hover:text-blue-400 line-clamp-2"
                        onClick={() => onOpenDetailModal(w)}
                      >
                        {w.name}
                      </h4>

                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#30363d] space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          {formatDuration(w.moving_time || w.duration)}
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          {w.icu_training_load || '--'} TSS
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(w)}
                          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] transition-colors text-center"
                        >
                          Blocos
                        </button>
                        <button
                          type="button"
                          onClick={() => syncSinglePlannedWorkout(w)}
                          disabled={isSyncing}
                          className="py-1.5 px-3 rounded-lg text-xs font-bold bg-[#238636] hover:bg-[#2ea043] text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* COMPLETED ACTIVITIES TABLE */
          <div className="overflow-x-auto border border-[#30363d] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1117] border-b border-[#30363d] text-[#8b949e] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllCompleted}
                      className="hover:text-white"
                    >
                      {selectedCount === totalCount && totalCount > 0 ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Nome da Atividade</th>
                  <th className="p-3">Esporte</th>
                  <th className="p-3 text-center">Duração</th>
                  <th className="p-3 text-center">TSS</th>
                  <th className="p-3 text-center">Status TP</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60 font-sans">
                {filteredActivities.map((act) => {
                  const actId = String(act.id);
                  const isSelected = selectedActivityIds.has(actId);
                  const isSynced = Boolean(syncedCache[actId]);
                  const badge = getSportBadge(act.type);

                  return (
                    <tr
                      key={actId}
                      className={`hover:bg-[#21262d]/50 transition-colors ${
                        isSelected ? 'bg-purple-950/10' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOneCompleted(actId)}
                          className="p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-gray-400 whitespace-nowrap">
                        {act.start_date_local.split('T')[0]}
                      </td>
                      <td className="p-3 font-semibold text-white max-w-xs truncate">
                        {act.name}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-gray-300 whitespace-nowrap">
                        {formatDuration(act.moving_time || act.elapsed_time)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                        {act.icu_training_load || '--'}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {isSynced ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Enviado
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/download-fit?athleteId=${encodeURIComponent(athleteId)}&apiKey=${encodeURIComponent(apiKey)}&activityId=${actId}`}
                            download={`${act.name.replace(/\s+/g, '_')}.fit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700"
                            title="Baixar arquivo original .FIT"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => syncSingleCompletedActivity(act)}
                            disabled={isSyncing}
                            className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                          >
                            <Activity className="w-3 h-3" />
                            <span>Enviar .FIT</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. LOG CONSOLE */}
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              Console de Sincronização em Tempo Real
            </span>

            <div className="flex items-center gap-1">
              {(['all', 'ok', 'warn', 'error'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLogFilter(filter)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase transition-all ${
                    logFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
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
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLogText}
              className="py-1 px-2.5 rounded-lg text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-600/20 border border-blue-500/30 flex items-center gap-1 transition-colors"
            >
              {copiedLog ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLog ? 'Copiado!' : 'Copiar Log'}</span>
            </button>
            <button
              type="button"
              onClick={clearAllCache}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Limpar logs e cache"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={logContainerRef}
          className="bg-[#010409] border border-[#30363d] rounded-xl p-3.5 h-64 overflow-y-auto font-mono text-xs space-y-1.5 select-text"
        >
          {filteredLogs.length === 0 ? (
            <span className="text-[#8b949e] italic">Aguardando eventos...</span>
          ) : (
            filteredLogs.map((item) => (
              <div key={item.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#8b949e] shrink-0 font-mono">[{item.timestamp}]</span>
                <span
                  className={`font-semibold shrink-0 uppercase text-[10px] px-1 py-0.2 rounded ${
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
                  className={`break-all ${
                    item.level === 'ok'
                      ? 'text-[#3fb950]'
                      : item.level === 'error'
                      ? 'text-[#f85149]'
                      : item.level === 'warn'
                      ? 'text-[#d29922]'
                      : 'text-[#e6edf3]'
                  }`}
                >
                  {item.message}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 7. INFORMATIVE FOOTER */}
      <footer className="bg-[#161b22]/60 border border-[#30363d] rounded-2xl p-4 text-xs text-[#8b949e] space-y-2">
        <div className="flex items-center gap-2 text-white font-medium">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          Como os treinos são sincronizados entre Intervals.icu e TrainingPeaks?
        </div>
        <p className="leading-relaxed">
          1. <b>Treinos Planejados</b>: O sistema lê os eventos futuros no seu calendário do Intervals.icu e envia para a data exata do calendário do TrainingPeaks com modalidade, duração e carga (TSS).
          <br />
          2. <b>Atividades Concluídas</b>: O sistema faz o download do arquivo <b>.FIT</b> gravado pelo GPS no Intervals e o envia diretamente para a API de upload do TrainingPeaks.
        </p>
      </footer>
    </div>
  );
}
