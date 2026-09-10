import { NextRequest, NextResponse } from 'next/server';

function normalizeTpCookie(cookie: string): string {
  const trimmed = cookie.trim();
  if (trimmed.startsWith('Production_tpAuth=')) {
    return trimmed;
  }
  return `Production_tpAuth=${trimmed}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      athleteId,
      apiKey,
      cookie,
      activityId,
      cachedTpToken,
      cachedTpAthleteId,
    } = await req.json();

    if (!activityId) {
      return NextResponse.json({ error: 'activityId é obrigatório' }, { status: 400 });
    }
    if (!athleteId || !apiKey) {
      return NextResponse.json({ error: 'Credenciais do Intervals ausentes' }, { status: 400 });
    }
    if (!cookie && !cachedTpToken) {
      return NextResponse.json({ error: 'Credenciais do TrainingPeaks ausentes' }, { status: 400 });
    }

    // 1. Ensure TrainingPeaks token and athlete ID
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
      tpToken = tokenData.access_token;
      tpAthleteId =
        tokenData.athleteId ||
        (tokenData.user && (tokenData.user.athleteId || tokenData.user.id));

      if (!tpToken || !tpAthleteId) {
        return NextResponse.json(
          { error: 'Não foi possível extrair token de acesso ou Athlete ID do TrainingPeaks.' },
          { status: 500 }
        );
      }
    }

    // 2. Download .fit file from Intervals
    const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
    const intervalsUrl = `https://intervals.icu/api/v1/activity/${activityId}/file`;

    const fileRes = await fetch(intervalsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (!fileRes.ok) {
      const errText = await fileRes.text();
      return NextResponse.json(
        {
          error: `Falha ao baixar arquivo FIT do Intervals (${fileRes.status}): ${errText.slice(0, 200)}`,
        },
        { status: fileRes.status }
      );
    }

    const fitArrayBuffer = await fileRes.arrayBuffer();
    const fitByteLength = fitArrayBuffer.byteLength;

    if (fitByteLength === 0) {
      return NextResponse.json(
        { error: `O arquivo FIT retornado pelo Intervals para o treino ${activityId} está vazio.` },
        { status: 400 }
      );
    }

    // 3. Upload to TrainingPeaks
    const filename = `${activityId}.fit`;
    const formData = new FormData();
    const blob = new Blob([fitArrayBuffer], { type: 'application/octet-stream' });
    formData.append('file', blob, filename);

    const uploadUrl = `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/workouts`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tpToken}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!uploadRes.ok && uploadRes.status !== 204) {
      const errText = await uploadRes.text();
      return NextResponse.json(
        {
          error: `Erro ao enviar para TrainingPeaks (${uploadRes.status}): ${errText.slice(0, 300)}`,
        },
        { status: uploadRes.status }
      );
    }

    let tpResponseData: any = {};
    try {
      if (uploadRes.status !== 204) {
        tpResponseData = await uploadRes.json();
      }
    } catch {
      // 204 No Content or non-json response is normal
    }

    return NextResponse.json({
      ok: true,
      activityId,
      workoutId: tpResponseData?.id || tpResponseData?.workoutId || 'uploaded',
      tpAthleteId: String(tpAthleteId),
      tpToken,
      bytes: fitByteLength,
      tpResponse: tpResponseData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro inesperado durante a sincronização' },
      { status: 500 }
    );
  }
}
