'use client';
import { useState } from 'react';

const MOCK_BRIEFING = {
  date: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  summary: "You have 4 priority actions today. One task needs immediate attention, two follow-ups are waiting on you, and one catch-up is scheduled for tonight.",
  tasks: [
    {
      id: 1,
      priority: "HIGH",
      type: "ACTION",
      contact: "Zeeshan",
      company: "Industry Geniuses",
      subject: "Login to Faith Hannah and check sent messages",
      action: "Zeeshan has asked you to log into the Faith Hannah account and review the sent messages. Do this first thing — it may have client-facing implications.",
      email: "zidrees@industrygeniuses.com"
    },
    {
      id: 2,
      priority: "HIGH",
      type: "REPLY NEEDED",
      contact: "Ken",
      company: "Independent",
      subject: "Ken is asking for webinar updates",
      action: "Ken wants to know where things stand with the webinar. Reply with a status update — registrations so far, timeline, and next steps. Don't leave this one waiting.",
      email: "kkonsein@hotmail.com"
    },
    {
      id: 3,
      priority: "MEDIUM",
      type: "FYI",
      contact: "Nikhil",
      company: "Enai AI",
      subject: "Webinar landing page is now live on Enai",
      action: "Nikhil has confirmed the webinar landing page is hosted on Enai. Review it, check everything looks right, and acknowledge his update. Send a quick confirmation reply.",
      email: "nikhil@enai.ai"
    },
    {
      id: 4,
      priority: "MEDIUM",
      type: "ACTION",
      contact: "Haider",
      company: "Industry Geniuses",
      subject: "Catch-up tonight — Haider wants to demo an AI agent he built",
      action: "Haider wants to meet tonight to show you an AI agent he has built. Confirm the time with him and block your evening. Could be relevant to Vyra.",
      email: "r.ali@industrygeniuses.com"
    }
  ]
};

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-400 border-red-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  LOW: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const typeColors: Record<string, string> = {
  'FOLLOW UP': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'REPLY NEEDED': 'bg-[#D4F54A]/10 text-[#D4F54A] border-[#D4F54A]/20',
  'ACTION': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'FYI': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function Briefing() {
  const [done, setDone] = useState<number[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  function toggleDone(id: number) {
    setDone(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function copyEmail(id: number, email: string) {
    navigator.clipboard.writeText(email);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const remaining = MOCK_BRIEFING.tasks.filter(t => !done.includes(t.id)).length;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4F54A] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-bold text-sm">V</span>
            </div>
            <span className="text-zinc-500 text-sm">Vyra — Briefing</span>
          </div>
          <span className="text-zinc-600 text-xs">{MOCK_BRIEFING.date}</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Good morning.</h1>
          <p className="text-zinc-400 text-base leading-relaxed">{MOCK_BRIEFING.summary}</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-zinc-800"></div>
          <span className="text-zinc-600 text-xs font-medium">{remaining} of {MOCK_BRIEFING.tasks.length} actions remaining</span>
          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>

        <div className="space-y-3">
          {MOCK_BRIEFING.tasks.map(task => (
            <div
              key={task.id}
              className={`rounded-xl border p-5 transition-all duration-200 ${
                done.includes(task.id)
                  ? 'border-zinc-800 bg-zinc-900/30 opacity-40'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[task.type]}`}>
                      {task.type}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-sm">{task.contact}</span>
                    <span className="text-zinc-600 text-xs">·</span>
                    <span className="text-zinc-500 text-xs">{task.company}</span>
                  </div>
                  <p className="text-zinc-500 text-xs mb-3">{task.subject}</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">{task.action}</p>
                </div>
                <button
                  onClick={() => toggleDone(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all ${
                    done.includes(task.id)
                      ? 'bg-[#D4F54A] border-[#D4F54A]'
                      : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                />
              </div>
              {!done.includes(task.id) && (
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">{task.email}</span>
                  <button
                    onClick={() => copyEmail(task.id, task.email)}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    {copied === task.id ? '✓ Copied' : 'Copy email'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {done.length === MOCK_BRIEFING.tasks.length && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 bg-[#D4F54A]/10 border border-[#D4F54A]/20 rounded-full px-6 py-3">
              <span className="text-[#D4F54A] text-sm font-medium">All done. Great work today.</span>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
