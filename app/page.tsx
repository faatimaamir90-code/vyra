'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/briefing');
    } else {
      setError('Wrong password. Try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#D4F54A] mb-6">
            <span className="text-[#0A0A0A] font-bold text-lg">V</span>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Vyra</h1>
          <p className="text-zinc-500 text-sm mt-2">Your personal GTM agent</p>
        </div>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-zinc-600 placeholder-zinc-600"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#D4F54A] text-[#0A0A0A] font-semibold rounded-lg px-4 py-3 text-sm hover:bg-[#c4e43a] transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Enter Vyra'}
          </button>
        </div>
      </div>
    </main>
  );
}