'use client';
import { useState, useEffect } from 'react';

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
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [done, setDone] = useState<number[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchBriefing();
  }, []);

  async function fetchBriefing() {
    setLoading(true);
    try {
      const res = await fetch('/api/briefing');
      if (res.status === 401) {
        setConnected(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.error) {
        setConnected(false);
      } else {
        setBriefing(data);
        setConnected(true);
      }
    } catch (e) {
      setConnected(false);
    }
    setLoading(false);
  }

  function toggleDone(id: number) {
    setDone(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function copyEmail(id: number, email: string) {
    navigator.clipboard.writeText(email);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4F54A] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-bold text-sm">V</span>
            </div>
            <div className="flex items-center gap-2"><a href="/briefing" className="text-xs font-medium text-white bg-zinc-800 px-3 py-1.5 rounded-lg">Briefing</a><a href="/icp" className="text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">ICP Agent</a></div>
          </div>
          <div className="flex items-center gap-3">
            {connected && (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                Gmail connected
              </span>
            )}
            <span className="text-zinc-600 text-xs">{date}</span>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-zinc-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">Reading your inbox...</span>
            </div>
          </div>
        )}

        {!loading && !connected && (
          <div className="text-center py-20">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-3">Connect your Gmail</h1>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto">Vyra needs access to your inbox to generate your morning briefing from your priority contacts.</p>
            </div>
            <a href="/api/gmail/connect" className="inline-flex items-center gap-2 bg-[#D4F54A] text-[#0A0A0A] font-semibold rounded-lg px-6 py-3 text-sm hover:bg-[#c4e43a] transition-colors">Connect Gmail</a>
          </div>
        )}

        {!loading && connected && briefing && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight mb-3">Good morning.</h1>
              <p className="text-zinc-400 text-base leading-relaxed">{briefing.summary}</p>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-zinc-600 text-xs font-medium">
                {briefing.tasks.filter((t: any) => !done.includes(t.id)).length} of {briefing.tasks.length} actions remaining
              </span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>
            <div className="space-y-3">
              {briefing.tasks.map((task: any) => (
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
                        {copied === task.id ? 'Copied' : 'Copy email'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {done.length === briefing.tasks.length && briefing.tasks.length > 0 && (
              <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-2 bg-[#D4F54A]/10 border border-[#D4F54A]/20 rounded-full px-6 py-3">
                  <span className="text-[#D4F54A] text-sm font-medium">All done. Great work today.</span>
                </div>
              </div>
            )}
            <div className="mt-8 text-center">
              <button onClick={fetchBriefing} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                Refresh briefing
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}