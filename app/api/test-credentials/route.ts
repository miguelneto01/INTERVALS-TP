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
    const { athleteId, apiKey, cookie } = await req.json();

    const results: {
      intervals: { ok: boolean; status?: number; data?: any; error?: string };
      trainingPeaks: { ok: boolean; status?: number; data?: any; error?: string };
    } = {
      intervals: { ok: false },
      trainingPeaks: { ok: false },
    };

    // Test Intervals.icu
    if (athleteId && apiKey) {
      try {
        const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
        const cleanAthleteId = athleteId.trim();
        const res = await fetch(`https://intervals.icu/api/v1/athlete/${cleanAthleteId}`, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          results.intervals = {
            ok: true,
            status: res.status,
            data: {
              id: data.id,
              name: data.name || `${data.firstname || ''} ${data.lastname || ''}`.trim() || data.id,
              city: data.city,
              country: data.country,
              timezone: data.timezone,
              email: data.email,
            },
          };
        } else {
          const errText = await res.text();
          results.intervals = {
            ok: false,
            status: res.status,
            error: `Erro HTTP ${res.status}: ${errText.slice(0, 200)}`,
          };
        }
      } catch (e: any) {
        results.intervals = {
          ok: false,
          error: e.message || 'Falha ao conectar com Intervals.icu',
        };
      }
    } else {
      results.intervals = {
        ok: false,
        error: 'Athlete ID e API Key são obrigatórios',
      };
    }

    // Test TrainingPeaks
    if (cookie) {
      try {
        const normalizedCookie = normalizeTpCookie(cookie);
        const res = await fetch('https://tpapi.trainingpeaks.com/users/v3/token', {
          method: 'GET',
          headers: {
            Cookie: normalizedCookie,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const token = data.access_token;
          const tpAthleteId = data.athleteId || (data.user && (data.user.athleteId || data.user.id));

          if (!token || !tpAthleteId) {
            results.trainingPeaks = {
              ok: false,
              status: res.status,
              error: 'Token ou Athlete ID não retornados na resposta do TrainingPeaks.',
            };
          } else {
            results.trainingPeaks = {
              ok: true,
              status: res.status,
              data: {
                athleteId: tpAthleteId,
                tokenExpiresIn: data.expires_in,
                user: data.user
                  ? {
                      firstName: data.user.firstName,
                      lastName: data.user.lastName,
                      email: data.user.email,
                      username: data.user.username,
                    }
                  : undefined,
              },
            };
          }
        } else {
          const errText = await res.text();
          results.trainingPeaks = {
            ok: false,
            status: res.status,
            error: `Erro HTTP ${res.status}: ${errText.slice(0, 200)} (Cookie pode estar expirado)`,
          };
        }
      } catch (e: any) {
        results.trainingPeaks = {
          ok: false,
          error: e.message || 'Falha ao conectar com TrainingPeaks',
        };
      }
    } else {
      results.trainingPeaks = {
        ok: false,
        error: 'Cookie Production_tpAuth é obrigatório',
      };
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro interno ao testar conexões' },
      { status: 500 }
    );
  }
}
