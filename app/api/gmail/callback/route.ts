import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/briefing', req.url));
  }

  try {
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokens = await tokenRes.json();
    console.log('Tokens received:', JSON.stringify(tokens));

    if (!tokens.access_token) {
      console.error('No access token in response:', tokens);
      return NextResponse.redirect(new URL('/briefing?error=no_token', req.url));
    }

    const tokenStr = JSON.stringify(tokens);
    const res = NextResponse.redirect(new URL('/briefing', req.url));
    
    res.cookies.set('gmail-token', tokenStr, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    
    return res;

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/briefing?error=callback_failed', req.url));
  }
}