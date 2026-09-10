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

// Convert Intervals workout_doc to TrainingPeaks structure if possible
function convertIntervalsDocToTp(workoutDoc: any) {
  if (!workoutDoc || !Array.isArray(workoutDoc.steps) || workoutDoc.steps.length === 0) {
    return null;
  }

  try {
    const steps: any[] = [];
    for (const step of workoutDoc.steps) {
      // Repetition block
      if (step.reps && Array.isArray(step.steps)) {
        const subSteps: any[] = [];
        for (const sub of step.steps) {
          const duration = sub.duration || (sub.length?.value ?? 60);
          const targets: any[] = [];
          if (sub.hr?.value) {
            targets.push({ minValue: sub.hr.value * 20, maxValue: sub.hr.value * 25 });
          } else if (sub.hr?.start && sub.hr?.end) {
            targets.push({ minValue: sub.hr.start * 20, maxValue: sub.hr.end * 25 });
          }
          subSteps.push({
            length: { value: duration, unit: 'second' },
            targets: targets.length > 0 ? targets : [{ minValue: 65, maxValue: 85 }],
          });
        }
        steps.push({
          type: 'repetition',
          length: { value: step.reps, unit: 'repetition' },
          steps: subSteps,
        });
      } else {
        // Normal step
        const duration = step.duration || 300;
        const targets: any[] = [];
        if (step.hr?.value) {
          targets.push({ minValue: step.hr.value * 20, maxValue: step.hr.value * 25 });
        } else if (step.hr?.start && step.hr?.end) {
          targets.push({ minValue: step.hr.start * 20, maxValue: step.hr.end * 25 });
        }
        steps.push({
          type: 'step',
          length: { value: 1, unit: 'repetition' },
          steps: [
            {
              length: { value: duration, unit: 'second' },
              targets: targets.length > 0 ? targets : [{ minValue: 65, maxValue: 85 }],
            },
          ],
        });
      }
    }

    if (steps.length === 0) return null;

    return {
      structure: steps,
      primaryLengthMetric: 'duration',
      primaryIntensityMetric: 'percentOfThresholdHr',
    };
  } catch {
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
    } = await req.json();

    if (!athleteId || !apiKey) {
      return NextResponse.json({ error: 'Credenciais do Intervals ausentes' }, { status: 400 });
    }
    if (!cookie && !cachedTpToken) {
      return NextResponse.json({ error: 'Credenciais do TrainingPeaks ausentes' }, { status: 400 });
    }

    let targetWorkout = workout;

    // If workout details weren't passed directly, fetch from Intervals
    if (!targetWorkout && workoutId) {
      const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
      const cleanAthleteId = athleteId.trim();
      const eventRes = await fetch(
        `https://intervals.icu/api/v1/athlete/${cleanAthleteId}/events/${workoutId}`,
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
    const finalDescription = cleanDesc ? `${cleanDesc}\n\n${marker}` : marker;

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

    // Optional structure
    if (targetWorkout.workout_doc) {
      const convertedStructure = convertIntervalsDocToTp(targetWorkout.workout_doc);
      if (convertedStructure) {
        payload.structure = convertedStructure;
      }
    }

    let tpResponse: any = null;

    if (existingTpWorkout && updateIfExists) {
      // Update existing workout on TrainingPeaks calendar
      const updateUrl = `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/workouts/${existingTpWorkout.workoutId}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tpToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...existingTpWorkout,
          ...payload,
          workoutId: existingTpWorkout.workoutId,
        }),
      });

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
        action: 'updated',
        workoutId: existingTpWorkout.workoutId,
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
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tpToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

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

    return NextResponse.json({
      ok: true,
      action: 'created',
      workoutId: tpResponse.workoutId || tpResponse.id || 'created',
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
