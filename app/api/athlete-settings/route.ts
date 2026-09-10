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
      cachedTpToken,
      cachedTpAthleteId,
    } = await req.json();

    const responseData: {
      intervals?: any;
      trainingPeaks?: any;
      recommendedSettings: {
        lthr: number;
        maxHr: number;
        ftp?: number;
        hrZones: Array<{ zone: number; name: string; minPercent: number; maxPercent: number; minBpm: number; maxBpm: number }>;
      };
    } = {
      recommendedSettings: {
        lthr: 165,
        maxHr: 190,
        hrZones: [],
      },
    };

    let detectedLthr: number | null = null;
    let detectedMaxHr: number | null = null;
    let detectedFtp: number | null = null;

    // 1. Fetch from Intervals.icu
    if (athleteId && apiKey) {
      try {
        const cleanAthleteId = athleteId.trim();
        const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');

        // Athlete info
        const athleteRes = await fetch(`https://intervals.icu/api/v1/athlete/${cleanAthleteId}`, {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            Accept: 'application/json',
          },
        });

        if (athleteRes.ok) {
          const aData = await athleteRes.json();
          responseData.intervals = {
            id: aData.id,
            name: aData.name,
            icu_lthr: aData.icu_lthr,
            icu_max_hr: aData.icu_max_hr,
            icu_ftp: aData.icu_ftp,
          };
          if (aData.icu_lthr) detectedLthr = aData.icu_lthr;
          if (aData.icu_max_hr) detectedMaxHr = aData.icu_max_hr;
          if (aData.icu_ftp) detectedFtp = aData.icu_ftp;
        }

        // Sport settings (for Ride and Run)
        const sportRes = await fetch(`https://intervals.icu/api/v1/athlete/${cleanAthleteId}/sport-settings`, {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            Accept: 'application/json',
          },
        });
        if (sportRes.ok) {
          const sData = await sportRes.json();
          if (Array.isArray(sData) && sData.length > 0) {
            const rideOrRun = sData.find((s: any) => s.types?.includes('Ride') || s.types?.includes('Run')) || sData[0];
            if (rideOrRun) {
              if (rideOrRun.lthr) detectedLthr = rideOrRun.lthr;
              if (rideOrRun.max_hr) detectedMaxHr = rideOrRun.max_hr;
              if (rideOrRun.ftp) detectedFtp = rideOrRun.ftp;
              if (rideOrRun.hr_zones && Array.isArray(rideOrRun.hr_zones)) {
                responseData.intervals.hr_zones = rideOrRun.hr_zones;
              }
            }
          }
        }
      } catch {
        // Ignore intervals fetch error
      }
    }

    // 2. Fetch from TrainingPeaks if token available
    let tpToken = cachedTpToken;
    let tpAthleteId = cachedTpAthleteId;

    if (!tpToken && cookie) {
      try {
        const normalizedCookie = normalizeTpCookie(cookie);
        const tokenRes = await fetch('https://tpapi.trainingpeaks.com/users/v3/token', {
          headers: { Cookie: normalizedCookie, Accept: 'application/json' },
        });
        if (tokenRes.ok) {
          const tData = await tokenRes.json();
          tpToken = tData.token?.access_token || tData.access_token;
          tpAthleteId = tData.athleteId || (tData.user && (tData.user.athleteId || tData.user.id));
        }
      } catch {
        // Ignore token error
      }
    }

    if (tpToken && tpAthleteId) {
      try {
        const zonesRes = await fetch(`https://tpapi.trainingpeaks.com/fitness/v6/athletes/${tpAthleteId}/zones`, {
          headers: {
            Authorization: `Bearer ${tpToken}`,
            Accept: 'application/json',
          },
        });
        if (zonesRes.ok) {
          const zData = await zonesRes.json();
          responseData.trainingPeaks = {
            zones: zData,
          };
          // Try to extract HR threshold or zones from TP response
          if (Array.isArray(zData)) {
            const hrZoneSet = zData.find((z: any) => z.metric === 'heartRate' || z.type === 'heartRate' || z.zonesType === 'heartRate');
            if (hrZoneSet?.threshold) {
              detectedLthr = Number(hrZoneSet.threshold);
            }
          } else if (zData?.heartRate?.threshold) {
            detectedLthr = Number(zData.heartRate.threshold);
          }
        }
      } catch {
        // Ignore TP zones fetch error
      }
    }

    const finalLthr = detectedLthr || (detectedMaxHr ? Math.round(detectedMaxHr * 0.88) : 165);
    const finalMaxHr = detectedMaxHr || Math.round(finalLthr * 1.14);

    // Standard Joe Friel / TrainingPeaks 7-zone and 5-zone LTHR system
    const defaultZones = [
      { zone: 1, name: 'Z1 - Recuperação Ativa', minPercent: 65, maxPercent: 81 },
      { zone: 2, name: 'Z2 - Aeróbico / Endurance', minPercent: 82, maxPercent: 89 },
      { zone: 3, name: 'Z3 - Tempo', minPercent: 90, maxPercent: 93 },
      { zone: 4, name: 'Z4 - Sub-Limiar', minPercent: 94, maxPercent: 99 },
      { zone: 5, name: 'Z5 - Capacidade Aeróbica', minPercent: 100, maxPercent: 105 },
    ].map((z) => ({
      ...z,
      minBpm: Math.round((z.minPercent / 100) * finalLthr),
      maxBpm: Math.round((z.maxPercent / 100) * finalLthr),
    }));

    responseData.recommendedSettings = {
      lthr: finalLthr,
      maxHr: finalMaxHr,
      ...(detectedFtp ? { ftp: detectedFtp } : {}),
      hrZones: defaultZones,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar configurações do atleta' },
      { status: 500 }
    );
  }
}
