import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === process.env.BRIEFING_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('vyra-auth', 'true', {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
