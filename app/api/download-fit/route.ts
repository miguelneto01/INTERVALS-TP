import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const activityId = searchParams.get('activityId');
    const apiKey = searchParams.get('apiKey');

    if (!activityId || !apiKey) {
      return NextResponse.json(
        { error: 'activityId e apiKey são necessários' },
        { status: 400 }
      );
    }

    const basicAuth = Buffer.from(`API_KEY:${apiKey.trim()}`).toString('base64');
    const intervalsUrl = `https://intervals.icu/api/v1/activity/${activityId}/file`;

    const fileRes = await fetch(intervalsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Falha ao obter arquivo do Intervals (${fileRes.status})` },
        { status: fileRes.status }
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${activityId}.fit"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao baixar arquivo' },
      { status: 500 }
    );
  }
}
