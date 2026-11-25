'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { flagOf } from '@/lib/countries';
import { joinQueue, leaveQueue, tryMatch } from '@/app/actions';
import type { Profile } from '@/lib/types';

type Row = { user_id: string; elo: number; profiles: { smash_tag: string; country: string } | null };

export default function QueuePanel({ me }: { me: Profile }) {
  const { t } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [pending, start] = useTransition();
  const inQueue = rows.some((r) => r.user_id === me.id);
  const sb = useRef(createClient()).current;

  const refresh = useCallback(async () => {
    const { data } = await sb.from('matchmaking_queue').select('user_id,elo,profiles(smash_tag,country)').order('joined_at');
    setRows((data ?? []) as unknown as Row[]);
  }, [sb]);

  useEffect(() => {
    refresh();
    const go = (p: { new: { id?: string } }) => p.new.id && router.push(`/match/${p.new.id}`);
    const ch = sb.channel('queue-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaking_queue' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `player1_id=eq.${me.id}` }, go)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `player2_id=eq.${me.id}` }, go)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, me.id, refresh, router]);

  // El rango de ELO se amplía con la espera: reintentar cada 8 s mientras estoy en cola.
  useEffect(() => {
    if (!inQueue) return;
    const id = setInterval(async () => {
      const r = await tryMatch();
      if (r.matchId) router.push(`/match/${r.matchId}`);
    }, 8000);
    return () => clearInterval(id);
  }, [inQueue, router]);

  const toggle = () => start(async () => {
    if (inQueue) { await leaveQueue(); return; }
    const r = await joinQueue();
    if (r.matchId) router.push(`/match/${r.matchId}`);
  });

  return (
    <section className="card flex flex-col gap-5">
      <button onClick={toggle} disabled={pending}
        className={`btn w-full py-8 text-3xl font-extrabold ${inQueue ? 'btn-ghost animate-pulse' : 'btn-sun'}`}>
        {inQueue ? t('searching') : t('search')}
      </button>
      {inQueue && <button onClick={toggle} className="text-sm text-white/60 underline">{t('cancel')}</button>}
      <div>
        <h2 className="mb-2 font-semibold">{t('in_queue')} ({rows.length})</h2>
        {rows.length === 0 ? <p className="text-white/50">{t('queue_empty')}</p> : (
          <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={r.user_id} className="flex justify-between rounded-lg bg-ink px-3 py-2">
                <span>{flagOf(r.profiles?.country ?? '')} {r.profiles?.smash_tag ?? '—'}</span>
                <span className="text-white/60">{r.elo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
