import { NextRequest, NextResponse } from 'next/server';

function normalizeTpCookie(cookie: string): string {
  const trimmed = cookie.trim();
  if (trimmed.startsWith('Production_tpAuth=')) {
    return trimmed;
  }
  return `Production_tpAuth=${trimmed}`;
}

function mapIntervalsTypeToTp(type?: string): number {
  if (!type) return 2;
  const lower = type.toLowerCase();
  if (lower.includes('mountain') || lower.includes('mtb') || lower.includes('gravel')) return 8;
  if (lower.includes('ride') || lower.includes('bike') || lower.includes('cycling')) return 2;
  if (lower.includes('run')) return 3;
  if (lower.includes('swim')) return 1;
  if (lower.includes('weight') || lower.includes('strength') || lower.includes('gym')) return 5;
  if (lower.includes('walk') || lower.includes('hike')) return 6;
  if (lower.includes('row')) return 7;
  return 2;
}

function formatDuration(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  }
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m${s}s` : `${m} min`;
  }
  return `${sec}s`;
}

interface ConvertOptions {
  userLthr?: number;
  userMaxHr?: number;
  userFtp?: number;
}

interface StepTargetResult {
  minValue: number;
  maxValue: number;
  label: string;
  intensity: 'warmup' | 'active' | 'recovery' | 'cooldown';
  name: string;
}

function resolveHrTarget(
  sub: any,
  workoutDoc: any,
  options?: ConvertOptions
): StepTargetResult {
  const effectiveLthr =
    options?.userLthr ||
    workoutDoc.lthr ||
    workoutDoc.icu_lthr ||
    (workoutDoc.max_hr ? Math.round(workoutDoc.max_hr * 0.88) : null) ||
    (options?.userMaxHr ? Math.round(options.userMaxHr * 0.88) : null) ||
    165;

  const effectiveMaxHr =
    options?.userMaxHr ||
    workoutDoc.max_hr ||
    workoutDoc.icu_max_hr ||
    Math.round(effectiveLthr * 1.14);

  // Check step intent / intensity
  let intensity: 'warmup' | 'active' | 'recovery' | 'cooldown' = 'active';
  const textCheck = (sub.text || sub.name || sub.description || '').toLowerCase();
  if (sub.warmup || textCheck.includes('warm') || textCheck.includes('aquec')) {
    intensity = 'warmup';
  } else if (sub.cooldown || textCheck.includes('cool') || textCheck.includes('desaquec')) {
    intensity = 'cooldown';
  } else if (
    sub.recovery ||
    sub.rest ||
    textCheck.includes('recup') ||
    textCheck.includes('rest') ||
    textCheck.includes('recov')
  ) {
    intensity = 'recovery';
  }

  // Case 1: Resolved absolute BPM (_hr: { start, end }) or units === "bpm"
  if (sub._hr?.start && sub._hr?.end) {
    const startBpm = Math.round(sub._hr.start);
    const endBpm = Math.round(sub._hr.end);
    const minValue = Math.round((startBpm / effectiveLthr) * 100);
    const maxValue = Math.round((endBpm / effectiveLthr) * 100);
    return {
      minValue,
      maxValue,
      label: `${startBpm}-${endBpm} bpm`,
      intensity,
      name: sub.text || (intensity === 'warmup' ? 'Aquecimento' : intensity === 'cooldown' ? 'Desaquecimento' : intensity === 'recovery' ? 'Recuperação' : `Intervalo ${startBpm}-${endBpm} bpm`),
    };
  }

  if (sub.hr?.units === 'bpm') {
    const startBpm = Math.round(sub.hr.start || sub.hr.value || 140);
    const endBpm = Math.round(sub.hr.end || sub.hr.value || 150);
    const minValue = Math.round((startBpm / effectiveLthr) * 100);
    const maxValue = Math.round((endBpm / effectiveLthr) * 100);
    return {
      minValue,
      maxValue,
      label: `${startBpm}-${endBpm} bpm`,
      intensity,
      name: sub.text || `FC ${startBpm}-${endBpm} bpm`,
    };
  }

  // Case 2: Explicit HR Zone (units === 'hr_zone' or 'zone' or sub.hr?.value 1..7)
  const isZone =
    sub.hr?.units === 'hr_zone' ||
    sub.hr?.units === 'zone' ||
    (typeof sub.hr?.value === 'number' && sub.hr.value >= 1 && sub.hr.value <= 7);

  if (isZone) {
    const zStart = sub.hr.start || sub.hr.value || (intensity === 'warmup' || intensity === 'cooldown' ? 1 : 2);
    const zEnd = sub.hr.end || sub.hr.value || zStart;

    // Standard Joe Friel / TrainingPeaks LTHR Zone Boundaries (% of LTHR)
    // Matching TrainingPeaks Zone system exactly!
    const zoneTable: Record<number, { min: number; max: number; name: string }> = {
      1: { min: 65, max: 81, name: 'Z1 Recuperação' },
      2: { min: 82, max: 89, name: 'Z2 Aeróbico' },
      3: { min: 90, max: 93, name: 'Z3 Tempo' },
      4: { min: 94, max: 99, name: 'Z4 Sub-Limiar' },
      5: { min: 100, max: 105, name: 'Z5 Limiar/VO2' },
      6: { min: 106, max: 110, name: 'Z6 Anaeróbico' },
      7: { min: 111, max: 120, name: 'Z7 Neuromuscular' },
    };

    const minEntry = zoneTable[zStart] || zoneTable[2];
    const maxEntry = zoneTable[zEnd] || minEntry;
    const minValue = minEntry.min;
    const maxValue = maxEntry.max;

    const minBpm = Math.round((minValue / 100) * effectiveLthr);
    const maxBpm = Math.round((maxValue / 100) * effectiveLthr);

    const zoneLabel = zStart === zEnd ? `Z${zStart}` : `Z${zStart}-Z${zEnd}`;
    return {
      minValue,
      maxValue,
      label: `${zoneLabel} (${minBpm}-${maxBpm} bpm)`,
      intensity: zStart === 1 && intensity !== 'warmup' ? 'recovery' : intensity,
      name:
        sub.text ||
        (zStart === 1 && intensity === 'warmup'
          ? 'Aquecimento Z1'
          : zStart === 1
          ? 'Recuperação Z1'
          : `${zoneLabel} (${minBpm}-${maxBpm} bpm)`),
    };
  }

  // Case 3: % of LTHR (units === '%lthr' or raw % around 60-120)
  if (sub.hr?.units === '%lthr' || (sub.hr?.units === '%' && workoutDoc.target === 'HR')) {
    const minPct = Math.round(sub.hr.start || (sub.hr.value ? sub.hr.value * 0.96 : 82));
    const maxPct = Math.round(sub.hr.end || (sub.hr.value ? sub.hr.value * 1.04 : 89));
    const minBpm = Math.round((minPct / 100) * effectiveLthr);
    const maxBpm = Math.round((maxPct / 100) * effectiveLthr);
    return {
      minValue: minPct,
      maxValue: maxPct,
      label: `${minPct}-${maxPct}% LTHR (${minBpm}-${maxBpm} bpm)`,
      intensity,
      name: sub.text || `${minPct}-${maxPct}% LTHR`,
    };
  }

  // Case 4: % of Max HR (units === '%hr' or '%hrmax')
  if (sub.hr?.units === '%hr' || sub.hr?.units === '%hrmax') {
    const minPct = sub.hr.start || (sub.hr.value ? sub.hr.value * 0.96 : 70);
    const maxPct = sub.hr.end || (sub.hr.value ? sub.hr.value * 1.04 : 80);
    const minBpm = Math.round((minPct / 100) * effectiveMaxHr);
    const maxBpm = Math.round((maxPct / 100) * effectiveMaxHr);
    const minValue = Math.round((minBpm / effectiveLthr) * 100);
    const maxValue = Math.round((maxBpm / effectiveLthr) * 100);
    return {
      minValue,
      maxValue,
      label: `${minPct}-${maxPct}% FC Máx (${minBpm}-${maxBpm} bpm)`,
      intensity,
      name: sub.text || `${minPct}-${maxPct}% FC Máx`,
    };
  }

  // Fallback defaults based on step type
  if (intensity === 'warmup') {
    const minValue = 65;
    const maxValue = 81;
    const minBpm = Math.round((minValue / 100) * effectiveLthr);
    const maxBpm = Math.round((maxValue / 100) * effectiveLthr);
    return {
      minValue,
      maxValue,
      label: `Aquecimento Z1/Z2 (${minBpm}-${maxBpm} bpm)`,
      intensity,
      name: sub.text || 'Aquecimento',
    };
  }
  if (intensity === 'cooldown') {
    const minValue = 65;
    const maxValue = 81;
    const minBpm = Math.round((minValue / 100) * effectiveLthr);
    const maxBpm = Math.round((maxValue / 100) * effectiveLthr);
    return {
      minValue,
      maxValue,
      label: `Desaquecimento Z1 (${minBpm}-${maxBpm} bpm)`,
      intensity,
      name: sub.text || 'Desaquecimento',
    };
  }
  if (intensity === 'recovery') {
    const minValue = 60;
    const maxValue = 78;
    const minBpm = Math.round((minValue / 100) * effectiveLthr);
    const maxBpm = Math.round((maxValue / 100) * effectiveLthr);
    return {
      minValue,
      maxValue,
      label: `Recuperação Z1 (${minBpm}-${maxBpm} bpm)`,
      intensity,
      name: sub.text || 'Recuperação',
    };
  }

  // Default active step: Zone 2
  const minValue = 82;
  const maxValue = 89;
  const minBpm = Math.round((minValue / 100) * effectiveLthr);
  const maxBpm = Math.round((maxValue / 100) * effectiveLthr);
  return {
    minValue,
    maxValue,
    label: `Z2 Aeróbico (${minBpm}-${maxBpm} bpm)`,
    intensity,
    name: sub.text || 'Z2 Aeróbico',
  };
}

function resolvePowerTarget(sub: any, workoutDoc: any, options?: ConvertOptions) {
  const effectiveFtp = options?.userFtp || workoutDoc.ftp || 200;

  let intensity: 'warmup' | 'active' | 'recovery' | 'cooldown' = 'active';
  const textCheck = (sub.text || sub.name || sub.description || '').toLowerCase();
  if (sub.warmup || textCheck.includes('warm') || textCheck.includes('aquec')) intensity = 'warmup';
  else if (sub.cooldown || textCheck.includes('cool') || textCheck.includes('desaquec')) intensity = 'cooldown';
  else if (sub.recovery || sub.rest || textCheck.includes('recup') || textCheck.includes('rest')) intensity = 'recovery';

  if (sub._power?.start && sub._power?.end) {
    const startW = Math.round(sub._power.start);
    const endW = Math.round(sub._power.end);
    const minValue = Math.round((startW / effectiveFtp) * 100);
    const maxValue = Math.round((endW / effectiveFtp) * 100);
    return {
      minValue,
      maxValue,
      label: `${startW}-${endW}W (${minValue}-${maxValue}% FTP)`,
      intensity,
      name: sub.text || `${startW}-${endW}W`,
    };
  }

  if (sub.power?.units === '%ftp' || (sub.power?.units === '%' && workoutDoc.target === 'POWER')) {
    const minValue = sub.power.start || (sub.power.value ? Math.round(sub.power.value * 0.96) : 70);
    const maxValue = sub.power.end || (sub.power.value ? Math.round(sub.power.value * 1.04) : 80);
    const startW = Math.round((minValue / 100) * effectiveFtp);
    const endW = Math.round((maxValue / 100) * effectiveFtp);
    return {
      minValue,
      maxValue,
      label: `${minValue}-${maxValue}% FTP (${startW}-${endW}W)`,
      intensity,
      name: sub.text || `${minValue}-${maxValue}% FTP`,
    };
  }

  if (sub.power?.units === 'watts') {
    const startW = Math.round(sub.power.start || sub.power.value || 150);
    const endW = Math.round(sub.power.end || sub.power.value || 180);
    const minValue = Math.round((startW / effectiveFtp) * 100);
    const maxValue = Math.round((endW / effectiveFtp) * 100);
    return {
      minValue,
      maxValue,
      label: `${startW}-${endW}W`,
      intensity,
      name: sub.text || `${startW}-${endW}W`,
    };
  }

  const z = sub.power?.value || sub.power?.start || 2;
  const powerZones: Record<number, { min: number; max: number; name: string }> = {
    1: { min: 50, max: 55, name: 'Z1 Recuperação' },
    2: { min: 56, max: 75, name: 'Z2 Resistência' },
    3: { min: 76, max: 90, name: 'Z3 Tempo' },
    4: { min: 91, max: 105, name: 'Z4 Limiar' },
    5: { min: 106, max: 120, name: 'Z5 VO2Max' },
    6: { min: 121, max: 150, name: 'Z6 Anaeróbico' },
    7: { min: 151, max: 200, name: 'Z7 Potência' },
  };
  const entry = powerZones[z] || powerZones[2];
  const startW = Math.round((entry.min / 100) * effectiveFtp);
  const endW = Math.round((entry.max / 100) * effectiveFtp);
  return {
    minValue: entry.min,
    maxValue: entry.max,
    label: `Z${z} (${startW}-${endW}W)`,
    intensity,
    name: sub.text || `Z${z} (${entry.min}-${entry.max}%)`,
  };
}

function formatIntervalSummary(stepsSummary: string[], lthr: number, metric: string): string {
  if (stepsSummary.length === 0) return '';
  const header =
    metric === 'percentOfThresholdHr'
      ? `📋 Estrutura de Intervalos (FC Limiar: ${lthr} bpm):`
      : `📋 Estrutura de Intervalos:`;
  return `${header}\n${stepsSummary.map((s) => `• ${s}`).join('\n')}`;
}

// Convert Intervals workout_doc to TrainingPeaks structure with accurate HR targets
function convertIntervalsDocToTp(workoutDoc: any, options?: ConvertOptions) {
  if (!workoutDoc || !Array.isArray(workoutDoc.steps) || workoutDoc.steps.length === 0) {
    return null;
  }

  try {
    const isPower =
      workoutDoc.target === 'POWER' ||
      (!workoutDoc.target &&
        workoutDoc.steps.some((s: any) => s.power || (s.steps && s.steps.some((sub: any) => sub.power))));

    const isPace = workoutDoc.target === 'PACE';

    const primaryIntensityMetric = isPower
      ? 'percentOfFtp'
      : isPace
      ? 'percentOfThresholdPace'
      : 'percentOfThresholdHr';

    const effectiveLthr =
      options?.userLthr ||
      workoutDoc.lthr ||
      workoutDoc.icu_lthr ||
      (workoutDoc.max_hr ? Math.round(workoutDoc.max_hr * 0.88) : null) ||
      (options?.userMaxHr ? Math.round(options.userMaxHr * 0.88) : null) ||
      165;

    const summaryLines: string[] = [];
    const steps: any[] = [];
    const rawSteps = workoutDoc.steps;
    const totalStepCount = rawSteps.length;

    for (let i = 0; i < rawSteps.length; i++) {
      const step = rawSteps[i];
      if (step.reps && Array.isArray(step.steps) && step.steps.length > 0) {
        // Repetition block
        const subSteps: any[] = [];
        const repDescriptions: string[] = [];

        for (const sub of step.steps) {
          const duration = Math.max(5, Math.round(Number(sub.duration || sub.length?.value || 60)));
          const durStr = formatDuration(duration);

          let targetRes: StepTargetResult;
          if (primaryIntensityMetric === 'percentOfFtp') {
            targetRes = resolvePowerTarget(sub, workoutDoc, options);
          } else {
            targetRes = resolveHrTarget(sub, workoutDoc, options);
          }

          let minVal = Math.round(Number(targetRes.minValue) || 65);
          let maxVal = Math.round(Number(targetRes.maxValue) || minVal);
          if (minVal > maxVal) {
            const tmp = minVal;
            minVal = maxVal;
            maxVal = tmp;
          }
          if (minVal < 1) minVal = 1;
          if (maxVal < minVal) maxVal = minVal;

          // Inside repetition blocks, TP only allows active or rest (NO warmUp or coolDown!)
          const rawInt = (targetRes.intensity || '').toLowerCase();
          const subIntensityClass =
            rawInt.includes('recov') || rawInt.includes('recup') || rawInt.includes('rest')
              ? 'rest'
              : 'active';

          repDescriptions.push(`${durStr} @ ${targetRes.label}`);

          subSteps.push({
            type: 'step',
            length: { value: duration, unit: 'second' },
            targets: [{ minValue: minVal, maxValue: maxVal }],
            intensityClass: subIntensityClass,
            name: (targetRes.name || 'Intervalo').trim().slice(0, 50),
          });
        }

        if (subSteps.length > 0) {
          summaryLines.push(`${step.reps}x [ ${repDescriptions.join(' + ')} ]`);

          steps.push({
            type: 'repetition',
            length: { value: Math.max(1, Math.round(Number(step.reps) || 1)), unit: 'repetition' },
            steps: subSteps,
            structure: subSteps,
          });
        }
      } else {
        // Single step
        const duration = Math.max(5, Math.round(Number(step.duration || step.length?.value || 300)));
        const durStr = formatDuration(duration);

        let targetRes: StepTargetResult;
        if (primaryIntensityMetric === 'percentOfFtp') {
          targetRes = resolvePowerTarget(step, workoutDoc, options);
        } else {
          targetRes = resolveHrTarget(step, workoutDoc, options);
        }

        let minVal = Math.round(Number(targetRes.minValue) || 65);
        let maxVal = Math.round(Number(targetRes.maxValue) || minVal);
        if (minVal > maxVal) {
          const tmp = minVal;
          minVal = maxVal;
          maxVal = tmp;
        }
        if (minVal < 1) minVal = 1;
        if (maxVal < minVal) maxVal = minVal;

        // TrainingPeaks block ordering rules:
        // warmUp is only valid at index 0 (first step)
        // coolDown is only valid at the last step
        // rest is used for recovery periods
        const rawInt = (targetRes.intensity || '').toLowerCase();
        let stepIntensityClass: 'warmUp' | 'active' | 'rest' | 'coolDown' = 'active';
        if (i === 0 && (rawInt.includes('warm') || rawInt.includes('aquec'))) {
          stepIntensityClass = 'warmUp';
        } else if (i === totalStepCount - 1 && (rawInt.includes('cool') || rawInt.includes('desaquec'))) {
          stepIntensityClass = 'coolDown';
        } else if (rawInt.includes('recov') || rawInt.includes('recup') || rawInt.includes('rest')) {
          stepIntensityClass = 'rest';
        } else {
          stepIntensityClass = 'active';
        }

        summaryLines.push(`${durStr} - ${targetRes.name}: ${targetRes.label}`);

        steps.push({
          type: 'step',
          length: { value: duration, unit: 'second' },
          targets: [{ minValue: minVal, maxValue: maxVal }],
          intensityClass: stepIntensityClass,
          name: (targetRes.name || 'Intervalo').trim().slice(0, 50),
        });
      }
    }

    if (steps.length === 0) return null;

    const structureObj = {
      structure: steps,
      steps: steps,
      primaryLengthMetric: 'duration',
      primaryIntensityMetric,
      primaryIntensityTargetOrRange: 'range',
    };

    const intervalSummaryText = formatIntervalSummary(summaryLines, effectiveLthr, primaryIntensityMetric);

    return {
      structure: structureObj,
      intervalSummaryText,
      primaryIntensityMetric,
      effectiveLthr,
    };
  } catch (err) {
    console.error('Erro convertIntervalsDocToTp:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      athleteId,
      apiKey,
      cookie,
      workout,
      workoutId,
      cachedTpToken,
      cachedTpAthleteId,
      updateIfExists = true,
      userLthr,
      userMaxHr,
      userFtp,
    } = await req.json();

    if (!athleteId || !apiKey) {
      return NextResponse.json({ error: 'Credenciais do Intervals ausentes' }, { status: 400 });
    }
    if (!cookie && !cachedTpToken) {
      return NextResponse.json({ error: 'Credenciais do TrainingPeaks ausentes' }, { status: 400 });
    }

    let targetWorkout = workout;

    // If workout details weren't passed directly, fetch from Intervals with resolve=true
    if (!targetWorkout && workoutId) {
      const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
      const cleanAthleteId = athleteId.trim();
      const eventRes = await fetch(
        `https://intervals.icu/api/v1/athlete/${cleanAthleteId}/events/${workoutId}?resolve=true`,
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            Accept: 'application/json',
          },
        }
      );
      if (!eventRes.ok) {
        return NextResponse.json(
          { error: `Falha ao obter detalhes do treino ${workoutId} no Intervals (${eventRes.status})` },
          { status: eventRes.status }
        );
      }
      targetWorkout = await eventRes.json();
    } else if (
      targetWorkout &&
      targetWorkout.id &&
      (!targetWorkout.workout_doc?.lthr || !targetWorkout.workout_doc?.steps?.[0]?._hr)
    ) {
      // Re-fetch resolved workout to ensure exact LTHR and bpm calculations
      try {
        const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
        const cleanAthleteId = athleteId.trim();
        const eventRes = await fetch(
          `https://intervals.icu/api/v1/athlete/${cleanAthleteId}/events/${targetWorkout.id}?resolve=true`,
          {
            headers: {
              Authorization: `Basic ${basicAuth}`,
              Accept: 'application/json',
            },
          }
        );
        if (eventRes.ok) {
          const resolvedWorkout = await eventRes.json();
          if (resolvedWorkout.workout_doc) {
            targetWorkout.workout_doc = resolvedWorkout.workout_doc;
          }
        }
      } catch {
        // Continue with targetWorkout
      }
    }

    if (!targetWorkout) {
      return NextResponse.json({ error: 'Dados do treino planejado não fornecidos' }, { status: 400 });
    }

    // 1. Ensure TrainingPeaks access token & athlete ID
    let tpToken = cachedTpToken;
    let tpAthleteId = cachedTpAthleteId;

    if (!tpToken || !tpAthleteId) {
      const normalizedCookie = normalizeTpCookie(cookie);
      const tokenRes = await fetch('https://tpapi.trainingpeaks.com/users/v3/token', {
        method: 'GET',
        headers: {
          Cookie: normalizedCookie,
          Accept: 'application/json',
        },
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        return NextResponse.json(
          {
            error: `Falha na autenticação do TrainingPeaks (${tokenRes.status}): ${errText.slice(0, 200)}`,
            isAuthError: true,
          },
          { status: 401 }
        );
      }

      const tokenData = await tokenRes.json();
      tpToken = tokenData.token?.access_token || tokenData.access_token;
      tpAthleteId =
        tokenData.athleteId ||
        (tokenData.user && (tokenData.user.athleteId || tokenData.user.id));

      if (!tpToken || !tpAthleteId) {
        // Fallback to fetch /users/v3/user with the bearer token
        const userRes = await fetch('https://tpapi.trainingpeaks.com/users/v3/user', {
          headers: {
            Authorization: `Bearer ${tpToken}`,
            Accept: 'application/json',
          },
        });
        if (userRes.ok) {
          const uData = await userRes.json();
          tpAthleteId =
            uData.user?.athleteId ||
            (uData.user?.athletes && uData.user.athletes[0]?.athleteId) ||
            uData.user?.personId;
        }
      }

      if (!tpToken || !tpAthleteId) {
        return NextResponse.json(
          { error: 'Não foi possível extrair token de acesso ou Athlete ID do TrainingPeaks.' },
          { status: 500 }
        );
      }
    }

    // 2. Prepare workout Day & fields
    const rawDate = targetWorkout.start_date_local || targetWorkout.date || new Date().toISOString();
    const workoutDay = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`;
    const dayOnly = workoutDay.split('T')[0];

    const intervalsEventId = String(targetWorkout.id);
    const tpWorkoutTypeValueId = mapIntervalsTypeToTp(targetWorkout.type);
    const totalTimeHours = (targetWorkout.moving_time || targetWorkout.duration || 3600) / 3600;
    const tssPlanned = targetWorkout.icu_training_load || targetWorkout.load || null;

    // Structured description with marker
    const marker = `[intervalsId=${intervalsEventId}]`;
    const cleanDesc = (targetWorkout.description || '').trim();
    let finalDescription = cleanDesc ? `${cleanDesc}\n\n${marker}` : marker;

    // 3. Check if workout already exists in TP for that day
    let existingTpWorkout: any = null;
    try {
      const getRes = await fetch(
        `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/workouts/${dayOnly}/${dayOnly}`,
        {
          headers: {
            Authorization: `Bearer ${tpToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (getRes.ok) {
        const dayWorkouts = await getRes.json();
        if (Array.isArray(dayWorkouts)) {
          existingTpWorkout = dayWorkouts.find(
            (w: any) =>
              (w.description && w.description.includes(marker)) ||
              (w.title && w.title.trim().toLowerCase() === (targetWorkout.name || '').trim().toLowerCase())
          );
        }
      }
    } catch {
      // Ignore check errors and proceed to create
    }

    const payload: any = {
      athleteId: Number(tpAthleteId),
      workoutDay,
      workoutTypeValueId: tpWorkoutTypeValueId,
      title: targetWorkout.name || 'Treino Intervals',
      description: finalDescription,
      totalTimePlanned: totalTimeHours,
      ...(tssPlanned ? { tssPlanned: Number(tssPlanned) } : {}),
    };

    // Convert structure with accurate Heart Rate / Power calculation
    if (targetWorkout.workout_doc) {
      const conversion = convertIntervalsDocToTp(targetWorkout.workout_doc, {
        userLthr: userLthr ? Number(userLthr) : undefined,
        userMaxHr: userMaxHr ? Number(userMaxHr) : undefined,
        userFtp: userFtp ? Number(userFtp) : undefined,
      });

      if (conversion && conversion.structure) {
        // TrainingPeaks V6 API expects stringified JSON for structure
        payload.structure = JSON.stringify(conversion.structure);
        payload.hasStructure = true;

        // Prepend clean summary of interval targets into description
        if (conversion.intervalSummaryText) {
          finalDescription = `${conversion.intervalSummaryText}\n\n${finalDescription}`;
          payload.description = finalDescription;
        }
      } else {
        payload.hasStructure = false;
      }
    } else {
      payload.hasStructure = false;
    }

    let tpResponse: any = null;

    if (existingTpWorkout && updateIfExists) {
      // Update existing workout on TrainingPeaks calendar
      const updateUrl = `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/workouts/${existingTpWorkout.workoutId}`;
      
      const updateBody: any = {
        workoutId: existingTpWorkout.workoutId,
        athleteId: Number(tpAthleteId),
        workoutDay: payload.workoutDay,
        workoutTypeValueId: payload.workoutTypeValueId,
        title: payload.title,
        description: payload.description,
        totalTimePlanned: payload.totalTimePlanned,
        ...(payload.tssPlanned ? { tssPlanned: payload.tssPlanned } : {}),
      };

      if (payload.structure) {
        updateBody.structure = payload.structure;
        updateBody.hasStructure = true;
      } else {
        updateBody.hasStructure = false;
      }

      let updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tpToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(updateBody),
      });

      // Fallback: If TrainingPeaks rejects structure with 400 (e.g. "Invalid workout structure"),
      // retry without structure payload. The workout description already contains the full interval structure!
      if (!updateRes.ok && updateBody.structure) {
        const firstErrText = await updateRes.text();
        console.warn(`TP PUT error with structure (${updateRes.status}): ${firstErrText}. Retrying without structure...`);
        delete updateBody.structure;
        updateBody.structure = null;
        updateBody.hasStructure = false;

        updateRes = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tpToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(updateBody),
        });
      }

      // Self-healing: If PUT still fails with 400 (e.g. TrainingPeaks rejects modifying a workout with corrupted structure state),
      // delete the outdated entry and create a fresh one cleanly via POST.
      if (!updateRes.ok && updateRes.status === 400) {
        const putErrText = await updateRes.text();
        console.warn(`TP PUT persistent 400 (${putErrText}). Self-healing: recreating workout via DELETE + POST...`);

        await fetch(updateUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${tpToken}`,
          },
        }).catch(() => {});

        const createUrl = `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/workouts`;
        const reCreateRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tpToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (reCreateRes.ok) {
          const reData = await reCreateRes.json().catch(() => ({}));
          return NextResponse.json({
            ok: true,
            success: true,
            action: 'updated',
            workoutId: reData.workoutId || reData.id || existingTpWorkout.workoutId,
            tpWorkoutId: reData.workoutId || reData.id || existingTpWorkout.workoutId,
            intervalsId: intervalsEventId,
            workoutDay,
            title: targetWorkout.name,
            tpAthleteId: String(tpAthleteId),
            tpToken,
            tpResponse: reData,
          });
        }
      }

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        return NextResponse.json(
          {
            error: `Erro ao atualizar treino no TrainingPeaks (${updateRes.status}): ${errText.slice(0, 300)}`,
          },
          { status: updateRes.status }
        );
      }
      tpResponse = await updateRes.json().catch(() => ({ workoutId: existingTpWorkout.workoutId }));

      return NextResponse.json({
        ok: true,
        success: true,
        action: 'updated',
        workoutId: existingTpWorkout.workoutId,
        tpWorkoutId: existingTpWorkout.workoutId,
        intervalsId: intervalsEventId,
        workoutDay,
        title: targetWorkout.name,
        tpAthleteId: String(tpAthleteId),
        tpToken,
        tpResponse,
      });
    }

    // Create new planned workout on TrainingPeaks calendar
    const createUrl = `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/workouts`;
    let createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tpToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Fallback: If TrainingPeaks rejects structure with 400 on create, retry without structure
    if (!createRes.ok && payload.structure) {
      const firstErrText = await createRes.text();
      console.warn(`TP POST error with structure (${createRes.status}): ${firstErrText}. Retrying without structure...`);
      const fallbackPayload = { ...payload };
      delete fallbackPayload.structure;
      fallbackPayload.structure = null;
      fallbackPayload.hasStructure = false;

      createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tpToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(fallbackPayload),
      });
    }

    if (!createRes.ok) {
      const errText = await createRes.text();
      let customError = `Erro ao agendar no TrainingPeaks (${createRes.status}): ${errText.slice(0, 300)}`;

      if (createRes.status === 402) {
        customError =
          'Conta TrainingPeaks Básica (Gratuita): o TrainingPeaks bloqueia agendamento de treinos futuros com mais de 1 dia de antecedência para contas gratuitas. Treinos agendados para Hoje e Amanhã são sincronizados normalmente.';
      }

      return NextResponse.json(
        {
          error: customError,
          statusCode: createRes.status,
          date: dayOnly,
        },
        { status: createRes.status }
      );
    }

    tpResponse = await createRes.json().catch(() => ({}));
    const newWorkoutId = tpResponse.workoutId || tpResponse.id || 'created';

    return NextResponse.json({
      ok: true,
      success: true,
      action: 'created',
      workoutId: newWorkoutId,
      tpWorkoutId: newWorkoutId,
      intervalsId: intervalsEventId,
      workoutDay,
      title: targetWorkout.name,
      tpAthleteId: String(tpAthleteId),
      tpToken,
      tpResponse,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro inesperado ao sincronizar treino planejado' },
      { status: 500 }
    );
  }
}
