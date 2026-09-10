'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Layers,
  Smartphone,
  Monitor
} from 'lucide-react';
import {
  DEFAULT_INTERVALS_ATHLETE,
  DEFAULT_INTERVALS_KEY,
  DEFAULT_TP_COOKIE,
  STORAGE_KEY,
  LogItem,
  SessionStats,
  ActivityItem,
  PlannedWorkoutItem,
  ConnectionStatus,
  ViewMode,
  SyncMode,
  AthleteHrSettings
} from '@/lib/types';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { MobileView } from '@/components/MobileView';
import { DesktopView } from '@/components/DesktopView';
import { WorkoutDetailModal } from '@/components/WorkoutDetailModal';

export default function SyncApp() {
  // 1. Core State (deterministic initial states for SSR and client hydration)
  const [athleteId, setAthleteId] = useState(DEFAULT_INTERVALS_ATHLETE);
  const [apiKey, setApiKey] = useState(DEFAULT_INTERVALS_KEY);
  const [cookie, setCookie] = useState(DEFAULT_TP_COOKIE);

  // View Mode: 'auto' | 'mobile' | 'desktop'
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const isMounted = useIsMounted();

  // Sync Mode: 'planned' (calendário futuro) or 'completed' (atividades passadas)
  const [syncMode, setSyncMode] = useState<SyncMode>('planned');

  // Unexecuted Only Filter (Apenas treinos futuros não executados para o calendário do TP)
  const [unexecutedOnly, setUnexecutedOnly] = useState(true);

  // Athlete HR & Zones Settings (for exact GPS & TrainingPeaks calibration)
  const [athleteHr, setAthleteHr] = useState<AthleteHrSettings>({
    lthr: 165,
    maxHr: 190,
    ftp: 200,
    hrZones: [],
    source: 'auto',
  });
  const [userLthr, setUserLthr] = useState(165);
  const [userMaxHr, setUserMaxHr] = useState(190);
  const [userFtp, setUserFtp] = useState(200);

  // Cache & Session
  const [syncedCache, setSyncedCache] = useState<Record<string, string>>({});
  const [ignoreCache, setIgnoreCache] = useState(true);

  // Planned Workouts State
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkoutItem[]>([]);
  const [selectedPlannedIds, setSelectedPlannedIds] = useState<Set<string>>(new Set());
  const [isLoadingPlanned, setIsLoadingPlanned] = useState(false);
  const [plannedDaysPreset, setPlannedDaysPreset] = useState(7);
  const [customRange, setCustomRange] = useState(false);
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Completed Activities State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Modals & Details
  const [inspectWorkout, setInspectWorkout] = useState<PlannedWorkoutItem | null>(null);

  // Connection & Diagnostics
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ tested: false });

  // Sync Progress & Stats
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, itemName: '' });
  const [stats, setStats] = useState<SessionStats>({ uploaded: 0, skipped: 0, errors: 0 });

  // Logs (initialized empty for SSR, populated upon mount with client locale time)
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'ok' | 'warn' | 'error'>('all');
  const [copiedLog, setCopiedLog] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // 2. Logging helper
  const addLog = (level: 'info' | 'ok' | 'warn' | 'error', message: string) => {
    const item: LogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level,
      message,
    };
    setLogs((prev) => [item, ...prev].slice(0, 400));
  };

  // 3. Client mount initialization & screen resize detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const initTimer = setTimeout(() => {
      // Initial dates calculated in user's browser timezone
      const d = new Date();
      const startStr = d.toISOString().split('T')[0];
      const endD = new Date();
      endD.setDate(endD.getDate() + 7);
      const endStr = endD.toISOString().split('T')[0];
      setPlannedStartDate(startStr);
      setPlannedEndDate(endStr);

      // Initial startup log
      setLogs([
        {
          id: 'startup-log',
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'info',
          message: 'Sistema de sincronização Intervals ➜ TrainingPeaks iniciado.',
        },
      ]);

      // Restore saved credentials from localStorage safely after mount
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.athleteId) setAthleteId(parsed.athleteId);
          if (parsed.apiKey) setApiKey(parsed.apiKey);
          if (parsed.cookie) setCookie(parsed.cookie);
          if (parsed.syncedCache) setSyncedCache(parsed.syncedCache);
          if (parsed.savedViewMode) setViewMode(parsed.savedViewMode);
          if (parsed.userLthr) setUserLthr(parsed.userLthr);
          if (parsed.userMaxHr) setUserMaxHr(parsed.userMaxHr);
          if (parsed.userFtp) setUserFtp(parsed.userFtp);
          if (parsed.unexecutedOnly !== undefined) setUnexecutedOnly(parsed.unexecutedOnly);
        }
      } catch {
        // Ignore
      }
    }, 0);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const effectiveMode: 'mobile' | 'desktop' = !isMounted
    ? 'desktop'
    : viewMode === 'auto'
    ? isMobileScreen
      ? 'mobile'
      : 'desktop'
    : viewMode;

  // 5. Save credentials helper
  const saveCredentials = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          athleteId,
          apiKey,
          cookie,
          syncedCache,
          savedViewMode: viewMode,
          userLthr,
          userMaxHr,
          userFtp,
          unexecutedOnly,
        })
      );
      addLog('ok', 'Configurações, zonas de FC e chaves salvas localmente no navegador com sucesso.');
    } catch (err: any) {
      addLog('error', `Falha ao salvar no navegador: ${err.message}`);
    }
  };

  const restoreDefaults = () => {
    setAthleteId(DEFAULT_INTERVALS_ATHLETE);
    setApiKey(DEFAULT_INTERVALS_KEY);
    setCookie(DEFAULT_TP_COOKIE);
    setUserLthr(165);
    setUserMaxHr(190);
    setUserFtp(200);
    setUnexecutedOnly(true);
    addLog('info', 'Credenciais e limites restaurados para os valores padrão.');
  };

  const clearAllCache = () => {
    setSyncedCache({});
    setLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    addLog('ok', 'Cache local e histórico limpos.');
  };

  // Fetch Athlete HR & Zones from Intervals.icu / TrainingPeaks
  const fetchAthleteSettings = useCallback(async () => {
    if (!athleteId || !apiKey) return;
    try {
      const res = await fetch('/api/athlete-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athleteId.trim(),
          apiKey: apiKey.trim(),
          cookie: cookie.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.athlete) {
        setAthleteHr(data.athlete);
        if (data.athlete.lthr && (!userLthr || userLthr === 165)) {
          setUserLthr(data.athlete.lthr);
        }
        if (data.athlete.maxHr && (!userMaxHr || userMaxHr === 190)) {
          setUserMaxHr(data.athlete.maxHr);
        }
        if (data.athlete.ftp && (!userFtp || userFtp === 200)) {
          setUserFtp(data.athlete.ftp);
        }
        addLog(
          'info',
          `Limites de FC calibrados: LTHR=${data.athlete.lthr} bpm, MaxHR=${data.athlete.maxHr} bpm (${data.athlete.source === 'trainingpeaks' ? 'TrainingPeaks' : 'Intervals.icu'}).`
        );
      }
    } catch {
      // Ignore
    }
  }, [athleteId, apiKey, cookie, userLthr, userMaxHr, userFtp]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchAthleteSettings();
      }
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchAthleteSettings]);

  // 6. Test Connections
  const testConnections = async () => {
    setIsTesting(true);
    addLog('info', 'Iniciando teste de conectividade com Intervals.icu e TrainingPeaks...');

    try {
      const res = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, apiKey, cookie }),
      });
      const data = await res.json();
      setConnectionStatus({
        tested: true,
        intervals: data.intervals,
        tp: data.tp,
      });

      if (data.intervals?.ok) {
        addLog(
          'ok',
          `Intervals.icu OK: Conectado ao atleta "${data.intervals.data.name || data.intervals.data.id}"`
        );
      } else {
        addLog('error', `Intervals.icu Falha: ${data.intervals?.error || 'Erro desconhecido'}`);
      }

      if (data.tp?.ok) {
        addLog(
          'ok',
          `TrainingPeaks OK: Autenticado como atleta ID ${data.tp.data.athleteId} (${data.tp.data.username || ''})`
        );
      } else {
        addLog('error', `TrainingPeaks Falha: ${data.tp?.error || 'Verifique o cookie de sessão'}`);
      }

      // Also reload athlete settings
      await fetchAthleteSettings();
    } catch (err: any) {
      addLog('error', `Falha ao testar credenciais: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // 7. Fetch Planned Workouts from Intervals.icu
  const fetchPlannedWorkouts = async () => {
    if (!athleteId || !apiKey) {
      addLog('error', 'Informe o Athlete ID e a API Key do Intervals');
      return;
    }

    setIsLoadingPlanned(true);
    let oldest = plannedStartDate;
    let newest = plannedEndDate;

    if (!customRange) {
      const today = new Date();
      oldest = today.toISOString().split('T')[0];
      const end = new Date();
      end.setDate(end.getDate() + plannedDaysPreset);
      newest = end.toISOString().split('T')[0];
      setPlannedStartDate(oldest);
      setPlannedEndDate(newest);
    }

    addLog(
      'info',
      `Buscando treinos planejados (${unexecutedOnly ? 'apenas não executados' : 'todos'}) no Intervals entre ${oldest} e ${newest}...`
    );

    try {
      const res = await fetch('/api/planned-workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athleteId.trim(),
          apiKey: apiKey.trim(),
          oldest,
          newest,
          unexecutedOnly,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar treinos planejados');
      }

      const list: PlannedWorkoutItem[] = data.workouts || [];
      list.sort(
        (a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime()
      );
      setPlannedWorkouts(list);

      const allIds = new Set(list.map((w) => String(w.id)));
      setSelectedPlannedIds(allIds);

      addLog(
        'ok',
        `Encontrados ${list.length} treinos agendados/planejados no calendário do Intervals.`
      );
    } catch (err: any) {
      addLog('error', `Erro ao buscar treinos planejados: ${err.message}`);
    } finally {
      setIsLoadingPlanned(false);
    }
  };

  // Auto-fetch planned workouts on initial mount
  useEffect(() => {
    let ignore = false;
    if (athleteId && apiKey) {
      const timer = setTimeout(() => {
        if (!ignore) {
          fetchPlannedWorkouts();
        }
      }, 50);
      return () => {
        ignore = true;
        clearTimeout(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selection helpers for planned
  const toggleSelectAllPlanned = () => {
    if (selectedPlannedIds.size === plannedWorkouts.length) {
      setSelectedPlannedIds(new Set());
    } else {
      setSelectedPlannedIds(new Set(plannedWorkouts.map((w) => String(w.id))));
    }
  };

  const toggleSelectOnePlanned = (id: string) => {
    const next = new Set(selectedPlannedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPlannedIds(next);
  };

  // 8. Fetch Completed Activities (mode 2)
  const fetchCompletedActivities = async () => {
    if (!athleteId || !apiKey) {
      addLog('error', 'Informe o Athlete ID e API Key do Intervals.');
      return;
    }

    setIsLoadingActivities(true);
    addLog('info', 'Consultando atividades já concluídas no Intervals...');

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athleteId.trim(),
          apiKey: apiKey.trim(),
          limit: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar atividades');
      }

      const list: ActivityItem[] = data.activities || [];
      setActivities(list);
      setSelectedActivityIds(new Set(list.map((a) => String(a.id))));
      addLog('ok', `Carregadas ${list.length} atividades realizadas do Intervals.`);
    } catch (err: any) {
      addLog('error', `Erro ao buscar atividades: ${err.message}`);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const toggleSelectAllCompleted = () => {
    if (selectedActivityIds.size === activities.length) {
      setSelectedActivityIds(new Set());
    } else {
      setSelectedActivityIds(new Set(activities.map((a) => String(a.id))));
    }
  };

  const toggleSelectOneCompleted = (id: string) => {
    const next = new Set(selectedActivityIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedActivityIds(next);
  };

  // 9. Sync Single Planned Workout
  const syncSinglePlannedWorkout = async (w: PlannedWorkoutItem) => {
    const eventId = String(w.id);
    addLog('info', `Enviando treino planejado "${w.name}" (${w.start_date_local.split('T')[0]}) ao TP...`);

    try {
      const res = await fetch('/api/sync-planned-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athleteId.trim(),
          apiKey: apiKey.trim(),
          cookie: cookie.trim(),
          workout: w,
          userLthr,
          userMaxHr,
          userFtp,
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.ok && !data.success)) {
        throw new Error(data.error || 'Falha ao sincronizar treino planejado');
      }

      const updatedCache = {
        ...syncedCache,
        [`planned_${eventId}`]: new Date().toISOString(),
      };
      setSyncedCache(updatedCache);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ athleteId, apiKey, cookie, syncedCache: updatedCache, savedViewMode: viewMode })
        );
      } catch {
        // Ignore
      }

      setStats((prev) => ({ ...prev, uploaded: prev.uploaded + 1 }));
      addLog('ok', `Treino "${w.name}" agendado com sucesso no TrainingPeaks! (Workout ID: ${data.tpWorkoutId || 'OK'})`);
    } catch (err: any) {
      setStats((prev) => ({ ...prev, errors: prev.errors + 1 }));
      addLog('error', `Erro ao sincronizar treino "${w.name}": ${err.message}`);
    }
  };

  // 10. Run Batch Sync Planned Workouts
  const runBatchSyncPlanned = async () => {
    const toSync = plannedWorkouts.filter((w) => selectedPlannedIds.has(String(w.id)));

    if (toSync.length === 0) {
      addLog('warn', 'Nenhum treino planejado selecionado para sincronizar.');
      return;
    }

    setIsSyncing(true);
    addLog('info', `Iniciando lote de sincronização de ${toSync.length} treinos planejados para o TrainingPeaks...`);

    let current = 0;
    const total = toSync.length;

    for (const w of toSync) {
      current += 1;
      const eventId = String(w.id);
      setSyncProgress({ current, total, itemName: w.name });

      if (ignoreCache && syncedCache[`planned_${eventId}`]) {
        addLog('warn', `Pulando "${w.name}" (já enviado em ${syncedCache[`planned_${eventId}`].split('T')[0]})`);
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
        continue;
      }

      await syncSinglePlannedWorkout(w);
      // Small pause between requests to prevent API rate limiting
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsSyncing(false);
    addLog('ok', 'Processo de sincronização de treinos planejados concluído!');
  };

  // 11. Sync Single Completed Activity (.FIT)
  const syncSingleCompletedActivity = async (act: ActivityItem) => {
    const actId = String(act.id);
    addLog('info', `Baixando e enviando .FIT da atividade "${act.name}" ao TP...`);

    try {
      const res = await fetch('/api/sync-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athleteId.trim(),
          apiKey: apiKey.trim(),
          cookie: cookie.trim(),
          activityId: actId,
          activityName: act.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao sincronizar arquivo .FIT');
      }

      const updatedCache = {
        ...syncedCache,
        [actId]: new Date().toISOString(),
      };
      setSyncedCache(updatedCache);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ athleteId, apiKey, cookie, syncedCache: updatedCache, savedViewMode: viewMode })
        );
      } catch {
        // Ignore
      }

      setStats((prev) => ({ ...prev, uploaded: prev.uploaded + 1 }));
      addLog('ok', `Arquivo .FIT de "${act.name}" enviado com sucesso ao TrainingPeaks!`);
    } catch (err: any) {
      setStats((prev) => ({ ...prev, errors: prev.errors + 1 }));
      addLog('error', `Erro ao sincronizar .FIT de "${act.name}": ${err.message}`);
    }
  };

  // 12. Batch Sync Completed Activities (.FIT)
  const runBatchSyncCompleted = async () => {
    const toSync = activities.filter((a) => selectedActivityIds.has(String(a.id)));

    if (toSync.length === 0) {
      addLog('warn', 'Nenhuma atividade selecionada para sincronizar.');
      return;
    }

    setIsSyncing(true);
    addLog('info', `Iniciando lote de sincronização de ${toSync.length} arquivos .FIT...`);

    let current = 0;
    const total = toSync.length;

    for (const act of toSync) {
      current += 1;
      const actId = String(act.id);
      setSyncProgress({ current, total, itemName: act.name });

      if (ignoreCache && syncedCache[actId]) {
        addLog('warn', `Pulando "${act.name}" (já enviado anteriormente)`);
        setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
        continue;
      }

      await syncSingleCompletedActivity(act);
      await new Promise((r) => setTimeout(r, 800));
    }

    setIsSyncing(false);
    addLog('ok', 'Processo de envio de arquivos .FIT concluído!');
  };

  // 13. Copy Log text
  const copyLogText = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* GLOBAL TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#161b22]/90 backdrop-blur-md border-b border-[#30363d] px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  Intervals
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-extrabold text-blue-400 text-sm sm:text-base tracking-tight">
                  TrainingPeaks
                </span>
              </div>
              <span className="text-[10px] text-[#8b949e] block font-mono">
                Sync Engine v2.0
              </span>
            </div>
          </div>

          {/* Dual Interface Switcher (Mobile vs Web / Desktop) */}
          <div className="flex items-center gap-2">
            <ViewSwitcher
              currentMode={viewMode}
              effectiveMode={effectiveMode}
              onChange={(mode) => {
                setViewMode(mode);
                try {
                  const saved = localStorage.getItem(STORAGE_KEY);
                  const parsed = saved ? JSON.parse(saved) : {};
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ ...parsed, savedViewMode: mode })
                  );
                } catch {
                  // Ignore
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* ACTIVE INTERFACE CONTAINER */}
      <main className="flex-1 w-full">
        {effectiveMode === 'mobile' ? (
          <MobileView
            syncMode={syncMode}
            setSyncMode={setSyncMode}
            athleteId={athleteId}
            setAthleteId={setAthleteId}
            apiKey={apiKey}
            setApiKey={setApiKey}
            cookie={cookie}
            setCookie={setCookie}
            saveCredentials={saveCredentials}
            restoreDefaults={restoreDefaults}
            clearAllCache={clearAllCache}
            testConnections={testConnections}
            isTesting={isTesting}
            connectionStatus={connectionStatus}
            athleteHr={athleteHr}
            userLthr={userLthr}
            setUserLthr={setUserLthr}
            userMaxHr={userMaxHr}
            setUserMaxHr={setUserMaxHr}
            userFtp={userFtp}
            setUserFtp={setUserFtp}
            unexecutedOnly={unexecutedOnly}
            setUnexecutedOnly={setUnexecutedOnly}
            plannedWorkouts={plannedWorkouts}
            isLoadingPlanned={isLoadingPlanned}
            selectedPlannedIds={selectedPlannedIds}
            toggleSelectAllPlanned={toggleSelectAllPlanned}
            toggleSelectOnePlanned={toggleSelectOnePlanned}
            fetchPlannedWorkouts={fetchPlannedWorkouts}
            syncSinglePlannedWorkout={syncSinglePlannedWorkout}
            runBatchSyncPlanned={runBatchSyncPlanned}
            onOpenDetailModal={(w) => setInspectWorkout(w)}
            plannedDaysPreset={plannedDaysPreset}
            setPlannedDaysPreset={setPlannedDaysPreset}
            customRange={customRange}
            setCustomRange={setCustomRange}
            plannedStartDate={plannedStartDate}
            setPlannedStartDate={setPlannedStartDate}
            plannedEndDate={plannedEndDate}
            setPlannedEndDate={setPlannedEndDate}
            activities={activities}
            isLoadingActivities={isLoadingActivities}
            selectedActivityIds={selectedActivityIds}
            toggleSelectAllCompleted={toggleSelectAllCompleted}
            toggleSelectOneCompleted={toggleSelectOneCompleted}
            fetchCompletedActivities={fetchCompletedActivities}
            syncSingleCompletedActivity={syncSingleCompletedActivity}
            runBatchSyncCompleted={runBatchSyncCompleted}
            ignoreCache={ignoreCache}
            setIgnoreCache={setIgnoreCache}
            syncedCache={syncedCache}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            stats={stats}
            logs={logs}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            copyLogText={copyLogText}
            copiedLog={copiedLog}
            logContainerRef={logContainerRef}
          />
        ) : (
          <DesktopView
            syncMode={syncMode}
            setSyncMode={setSyncMode}
            athleteId={athleteId}
            setAthleteId={setAthleteId}
            apiKey={apiKey}
            setApiKey={setApiKey}
            cookie={cookie}
            setCookie={setCookie}
            saveCredentials={saveCredentials}
            restoreDefaults={restoreDefaults}
            clearAllCache={clearAllCache}
            testConnections={testConnections}
            isTesting={isTesting}
            connectionStatus={connectionStatus}
            athleteHr={athleteHr}
            userLthr={userLthr}
            setUserLthr={setUserLthr}
            userMaxHr={userMaxHr}
            setUserMaxHr={setUserMaxHr}
            userFtp={userFtp}
            setUserFtp={setUserFtp}
            unexecutedOnly={unexecutedOnly}
            setUnexecutedOnly={setUnexecutedOnly}
            plannedWorkouts={plannedWorkouts}
            isLoadingPlanned={isLoadingPlanned}
            selectedPlannedIds={selectedPlannedIds}
            toggleSelectAllPlanned={toggleSelectAllPlanned}
            toggleSelectOnePlanned={toggleSelectOnePlanned}
            fetchPlannedWorkouts={fetchPlannedWorkouts}
            syncSinglePlannedWorkout={syncSinglePlannedWorkout}
            runBatchSyncPlanned={runBatchSyncPlanned}
            onOpenDetailModal={(w) => setInspectWorkout(w)}
            plannedDaysPreset={plannedDaysPreset}
            setPlannedDaysPreset={setPlannedDaysPreset}
            customRange={customRange}
            setCustomRange={setCustomRange}
            plannedStartDate={plannedStartDate}
            setPlannedStartDate={setPlannedStartDate}
            plannedEndDate={plannedEndDate}
            setPlannedEndDate={setPlannedEndDate}
            activities={activities}
            isLoadingActivities={isLoadingActivities}
            selectedActivityIds={selectedActivityIds}
            toggleSelectAllCompleted={toggleSelectAllCompleted}
            toggleSelectOneCompleted={toggleSelectOneCompleted}
            fetchCompletedActivities={fetchCompletedActivities}
            syncSingleCompletedActivity={syncSingleCompletedActivity}
            runBatchSyncCompleted={runBatchSyncCompleted}
            ignoreCache={ignoreCache}
            setIgnoreCache={setIgnoreCache}
            syncedCache={syncedCache}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            stats={stats}
            logs={logs}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            copyLogText={copyLogText}
            copiedLog={copiedLog}
            logContainerRef={logContainerRef}
          />
        )}
      </main>

      {/* INSPECT WORKOUT MODAL (usable in both mobile and desktop) */}
      {inspectWorkout && (
        <WorkoutDetailModal
          workout={inspectWorkout}
          athleteId={athleteId}
          apiKey={apiKey}
          isSynced={Boolean(syncedCache[`planned_${inspectWorkout.id}`])}
          onClose={() => setInspectWorkout(null)}
          onSync={(w) => syncSinglePlannedWorkout(w)}
          isSyncing={isSyncing}
        />
      )}
    </div>
  );
}
