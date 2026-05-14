import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRIORITY_EMAILS = [
  'zidrees@industrygeniuses.com',
  'kkonsein@hotmail.com',
  'nikhil@enai.ai',
  'r.ali@industrygeniuses.com'
];

export async function GET(req: NextRequest) {
  const tokenCookie = req.cookies.get('gmail-token');
  if (!tokenCookie) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  try {
    const tokens = JSON.parse(tokenCookie.value);
    
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth });
    const query = PRIORITY_EMAILS.map(e => `from:${e}`).join(' OR ');
    
    const messages = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20
    });

    if (!messages.data.messages || messages.data.messages.length === 0) {
      return NextResponse.json({
        summary: "No recent emails from your priority contacts. You are all caught up.",
        tasks: []
      });
    }

    const emailDetails = await Promise.all(
      messages.data.messages.slice(0, 10).map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full'
        });
        const headers = detail.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const snippet = detail.data.snippet || '';
        return { from, subject, date, snippet };
      })
    );

    const emailSummary = emailDetails.map(e =>
      `From: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nPreview: ${e.snippet}`
    ).join('\n\n---\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are Vyra, a personal GTM assistant. Analyse these emails and create a morning briefing.

EMAILS:
${emailSummary}

Return ONLY a JSON object like this:
{"summary":"2 sentence overview","tasks":[{"id":1,"priority":"HIGH","type":"REPLY NEEDED","contact":"First name","company":"Company","subject":"what it is about","action":"what to do","email":"their@email.com"}]}`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    const briefing = match ? JSON.parse(match[0]) : { summary: 'Could not parse briefing', tasks: [] };

    return NextResponse.json(briefing);

  } catch (error: any) {
    console.error('Briefing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}