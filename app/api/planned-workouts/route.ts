import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { athleteId, apiKey, oldest, newest, unexecutedOnly = true } = await req.json();

    if (!athleteId || !apiKey) {
      return NextResponse.json(
        { error: 'Athlete ID e API Key do Intervals são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanAthleteId = athleteId.trim();
    const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');

    const params = new URLSearchParams();
    if (oldest) params.append('oldest', oldest);
    if (newest) params.append('newest', newest);
    params.append('category', 'WORKOUT');
    params.append('resolve', 'true');

    const url = `https://intervals.icu/api/v1/athlete/${cleanAthleteId}/events?${params.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Intervals.icu retornou status ${res.status}: ${errText.slice(0, 300)}` },
        { status: res.status }
      );
    }

    const events = await res.json();
    const todayDate = new Date().toISOString().split('T')[0];

    // Filter only events that are planned workouts (category WORKOUT or have workout details)
    const workouts = (Array.isArray(events) ? events : []).filter((ev: any) => {
      const isWorkout = ev.category === 'WORKOUT' || ev.workout_doc || ev.has_workout;
      if (!isWorkout) return false;

      if (unexecutedOnly) {
        // Exclude workouts that have already been executed (linked activity)
        const hasExecutedActivity = Boolean(
          ev.activity_id ||
          ev.paired_activity_id ||
          ev.category === 'ACTIVITY'
        );
        if (hasExecutedActivity) return false;
      }

      return true;
    });

    return NextResponse.json({ workouts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao consultar treinos planejados no Intervals' },
      { status: 500 }
    );
  }
}
