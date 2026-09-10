import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { athleteId, apiKey, oldest, newest } = await req.json();

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

    const url = `https://intervals.icu/api/v1/athlete/${cleanAthleteId}/activities?${params.toString()}`;

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

    const activities = await res.json();
    return NextResponse.json({ activities });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao consultar atividades no Intervals' },
      { status: 500 }
    );
  }
}
