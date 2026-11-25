'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES, flagOf } from '@/lib/countries';
import type { Profile } from '@/lib/types';

export default function Leaderboard({ meId }: { meId: string }) {
  const { t, lang } = useI18n();
  const [country, setCountry] = useState('ALL');
  const [rows, setRows] = useState<Profile[]>([]);

  useEffect(() => {
    let q = createClient().from('profiles').select('id,smash_tag,country,elo,wins,losses').order('elo', { ascending: false }).limit(50);
    if (country !== 'ALL') q = q.eq('country', country);
    q.then(({ data }) => setRows((data ?? []) as Profile[]));
  }, [country]);

  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t('leaderboard')}</h2>
        <select className="input !w-auto" value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t('leaderboard')}>
          <option value="ALL">🌎 {t('global')}</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name[lang]}</option>)}
        </select>
      </div>
      <table className="w-full text-left">
        <thead className="text-sm text-white/50">
          <tr><th className="w-10 py-1">#</th><th>{t('player')}</th><th className="text-right">ELO</th><th className="text-right">{t('record')}</th></tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id} className={`border-t border-line ${p.id === meId ? 'text-sun' : ''}`}>
              <td className="py-2">{i + 1}</td>
              <td>{flagOf(p.country)} {p.smash_tag}</td>
              <td className="text-right font-semibold">{p.elo}</td>
              <td className="text-right text-white/60">{p.wins}-{p.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
