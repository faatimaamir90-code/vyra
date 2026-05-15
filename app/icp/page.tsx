'use client';
import { useState } from 'react';

const INDUSTRIES = [
  'B2B SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'Marketing Technology', 'Sales Technology', 'HR Technology',
  'Cybersecurity', 'Data & Analytics', 'AI & Machine Learning',
  'Professional Services', 'Retail', 'Manufacturing', 'Real Estate'
];

const JOB_TITLES = [
  'CEO', 'Co-Founder', 'Founder', 'VP Sales', 'VP Marketing',
  'Head of Sales', 'Head of Marketing', 'Chief Revenue Officer',
  'Sales Director', 'Marketing Director', 'Head of Growth',
  'VP of Growth', 'CMO', 'CSO', 'BD Manager'
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const LOCATIONS = [
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Netherlands', 'Singapore', 'UAE'
];

export default function ICPAgent() {
  const [mode, setMode] = useState<'command' | 'filter'>('filter');
  const [command, setCommand] = useState('');
  const [filters, setFilters] = useState({
    titles: [] as string[],
    industries: [] as string[],
    sizes: [] as string[],
    locations: [] as string[],
    hiringRoles: '',
    count: 25,
  });
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function selectAll() {
    setSelected(results.filter(c => c.hasEmail && !c.email).map(c => c.id));
  }

  function deselectAll() { setSelected([]); }

  async function search() {
    setLoading(true);
    setError('');
    setResults([]);
    setSelected([]);
    setSearched(true);
    try {
      const res = await fetch('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, command, filters }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResults(data.contacts || []);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function revealEmails() {
    if (!selected.length) return;
    setRevealing(true);
    try {
      const res = await fetch('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reveal', contactIds: selected }),
      });
      const data = await res.json();
      if (data.revealed) {
        setResults(prev => prev.map(c => {
          const match = data.revealed.find((r: any) => r.id === c.id);
          if (match) return { ...c, ...match, revealed: true };
          return c;
        }));
        setSelected([]);
      }
    } catch (e) {
      setError('Failed to reveal emails.');
    }
    setRevealing(false);
  }

  function exportCSV() {
    if (!results.length) return;
    const headers = ['Full Name', 'Job Title', 'Company', 'Website', 'Company LinkedIn', 'Personal LinkedIn', 'Work Email', 'Location', 'Company Size', 'Industry', 'Signal'];
    const rows = results.map(c => [c.name, c.title, c.company, c.website, c.companyLinkedin, c.linkedin, c.email, c.location, c.size, c.industry, c.signal].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'vyra-icp-list.csv';
    a.click();
  }

  const unrevealed = results.filter(c => c.hasEmail && !c.email);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4F54A] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-bold text-sm">V</span>
            </div>
            <span className="text-zinc-500 text-sm">Vyra — ICP Agent</span>
          </div>
          <div className="flex items-center gap-4">
  <span className="text-zinc-500 text-sm">Vyra Briefing</span>
  <a href="/icp" className="text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-600">
    ICP Agent
  </a>
</div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">ICP Agent</h1>
          <p className="text-zinc-400 text-sm">Build targeted contact lists powered by Apollo. Select contacts to reveal their emails.</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('filter')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'filter' ? 'bg-[#D4F54A] text-[#0A0A0A]' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>Filter mode</button>
          <button onClick={() => setMode('command')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'command' ? 'bg-[#D4F54A] text-[#0A0A0A]' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}>Command mode</button>
        </div>

        {mode === 'command' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Command</p>
            <textarea rows={4} value={command} onChange={e => setCommand(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none resize-none placeholder-zinc-600 focus:border-zinc-600"
              placeholder="e.g. I need 50 VP Sales and Founders at B2B SaaS companies with $1M–$10M ARR in US and UK, actively hiring BDRs or marketing roles in the last 6 months." />
          </div>
        )}

        {mode === 'filter' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Job Titles</p>
              <div className="flex flex-wrap gap-2">
                {JOB_TITLES.map(t => (
                  <button key={t} onClick={() => setFilters(f => ({ ...f, titles: toggleItem(f.titles, t) }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.titles.includes(t) ? 'bg-[#D4F54A] text-[#0A0A0A] border-[#D4F54A]' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Industry</p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(i => (
                  <button key={i} onClick={() => setFilters(f => ({ ...f, industries: toggleItem(f.industries, i) }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.industries.includes(i) ? 'bg-[#D4F54A] text-[#0A0A0A] border-[#D4F54A]' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Company Size</p>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map(s => (
                  <button key={s} onClick={() => setFilters(f => ({ ...f, sizes: toggleItem(f.sizes, s) }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.sizes.includes(s) ? 'bg-[#D4F54A] text-[#0A0A0A] border-[#D4F54A]' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Location</p>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map(l => (
                  <button key={l} onClick={() => setFilters(f => ({ ...f, locations: toggleItem(f.locations, l) }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.locations.includes(l) ? 'bg-[#D4F54A] text-[#0A0A0A] border-[#D4F54A]' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Hiring Signal (optional)</p>
              <input type="text" value={filters.hiringRoles} onChange={e => setFilters(f => ({ ...f, hiringRoles: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white outline-none placeholder-zinc-600 focus:border-zinc-600"
                placeholder="e.g. BDR, SDR, Marketing Manager" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Number of contacts</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setFilters(f => ({ ...f, count: Math.max(10, f.count - 10) }))} className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700">−</button>
                <span className="text-lg font-semibold w-12 text-center">{filters.count}</span>
                <button onClick={() => setFilters(f => ({ ...f, count: Math.min(100, f.count + 10) }))} className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700">+</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <button onClick={search} disabled={loading}
            className="bg-[#D4F54A] text-[#0A0A0A] font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[#c4e43a] transition-colors disabled:opacity-50">
            {loading ? 'Searching Apollo...' : 'Build ICP list'}
          </button>
          {results.length > 0 && (
            <button onClick={exportCSV} className="bg-zinc-900 border border-zinc-700 text-white font-medium px-6 py-3 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
              Export CSV ({results.length})
            </button>
          )}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-6">{error}</div>}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 text-zinc-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">Searching Apollo for matching contacts...</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{results.length} contacts found</span>
                {unrevealed.length > 0 && <span className="text-xs text-zinc-500">{unrevealed.length} emails available to reveal</span>}
              </div>
              <div className="flex items-center gap-3">
                {unrevealed.length > 0 && (
                  <>
                    <button onClick={selectAll} className="text-xs text-zinc-400 hover:text-white transition-colors">Select all</button>
                    <button onClick={deselectAll} className="text-xs text-zinc-400 hover:text-white transition-colors">Deselect all</button>
                  </>
                )}
                {selected.length > 0 && (
                  <button onClick={revealEmails} disabled={revealing}
                    className="bg-[#D4F54A] text-[#0A0A0A] font-semibold px-4 py-1.5 rounded-lg text-xs hover:bg-[#c4e43a] transition-colors disabled:opacity-50">
                    {revealing ? 'Revealing...' : `Reveal ${selected.length} email${selected.length > 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{minWidth: '1200px'}}>
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900">
                    <th className="px-3 py-3 w-8"></th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Name</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Title</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Company</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Website</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Co. LinkedIn</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Location</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Size</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Industry</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Email</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">LinkedIn</th>
                    <th className="text-left text-zinc-500 uppercase tracking-wider px-3 py-3 font-medium">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((c, i) => (
                    <tr key={i} className={`border-b border-zinc-800/50 transition-colors ${selected.includes(c.id) ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/30'}`}>
                      <td className="px-3 py-3">
                        {c.hasEmail && !c.email ? (
                          <button onClick={() => toggleSelect(c.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected.includes(c.id) ? 'bg-[#D4F54A] border-[#D4F54A]' : 'border-zinc-600 hover:border-zinc-400'}`}>
                            {selected.includes(c.id) && <span className="text-[#0A0A0A] text-xs leading-none">✓</span>}
                          </button>
                        ) : c.email ? (
                          <span className="text-green-400">✓</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-medium text-white whitespace-nowrap">{c.name}</td>
                      <td className="px-3 py-3 text-zinc-400 whitespace-nowrap max-w-[180px] truncate">{c.title}</td>
                      <td className="px-3 py-3 text-white whitespace-nowrap">{c.company}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[#D4F54A] hover:underline">Visit</a> : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {c.companyLinkedin ? <a href={c.companyLinkedin} target="_blank" rel="noopener noreferrer" className="text-[#D4F54A] hover:underline">View</a> : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{c.location || <span className="text-zinc-600">—</span>}</td>
                      <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{c.size || <span className="text-zinc-600">—</span>}</td>
                      <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">{c.industry || <span className="text-zinc-600">—</span>}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {c.email ? (
                          <span className="text-green-400">{c.email}</span>
                        ) : c.hasEmail ? (
                          <span className="text-zinc-600 italic">Select to reveal</span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {c.linkedin ? <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#D4F54A] hover:underline">View</a> : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3 text-zinc-400 whitespace-nowrap max-w-[150px] truncate">{c.signal || <span className="text-zinc-600">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}