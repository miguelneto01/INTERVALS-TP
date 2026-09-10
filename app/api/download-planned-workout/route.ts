import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    const apiKey = searchParams.get('apiKey');
    const eventId = searchParams.get('eventId');
    const format = searchParams.get('format') || 'fit'; // fit or zwo

    if (!athleteId || !apiKey || !eventId) {
      return NextResponse.json(
        { error: 'athleteId, apiKey e eventId são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanAthleteId = athleteId.trim();
    const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
    const ext = format === 'zwo' ? '.zwo' : '.fit';
    const intervalsUrl = `https://intervals.icu/api/v1/athlete/${cleanAthleteId}/events/${eventId}/download${ext}`;

    const res = await fetch(intervalsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Falha ao baixar arquivo do Intervals (${res.status})` },
        { status: res.status }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = format === 'zwo' ? 'application/xml' : 'application/octet-stream';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="workout_${eventId}${ext}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao baixar arquivo do treino planejado' },
      { status: 500 }
    );
  }
}
