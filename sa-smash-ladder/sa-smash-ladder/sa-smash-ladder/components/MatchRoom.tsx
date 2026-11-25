'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n, type Key } from '@/lib/i18n';
import { SA_STAGES } from '@/lib/stages';
import { strikeState, stagePool } from '@/lib/strike';
import { flagOf } from '@/lib/countries';
import { banStage, callMod, reportGame, rpsMove, setArena } from '@/app/actions';
import type { Match, Profile } from '@/lib/types';

const RPS = [{ id: 'rock', icon: '✊', k: 'rock' }, { id: 'paper', icon: '✋', k: 'paper' }, { id: 'scissors', icon: '✌️', k: 'scissors' }] as const;
type Res = { ok: boolean; error?: string };

export default function MatchRoom({ initial, profiles, meId }: { initial: Match; profiles: Record<string, Profile>; meId: string }) {
  const { t, lang } = useI18n();
  const [m, setM] = useState(initial);
  const [profs, setProfs] = useState(profiles);
  const [aid, setAid] = useState(initial.arena_id ?? '');
  const [apass, setApass] = useState(initial.arena_pass ?? '');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel(`match-${m.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${m.id}` }, (p) => setM(p.new as Match))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [m.id]);

  useEffect(() => { setAid(m.arena_id ?? ''); setApass(m.arena_pass ?? ''); }, [m.arena_id, m.arena_pass]);

  useEffect(() => { // ELO actualizado al terminar
    if (m.status !== 'completed') return;
    createClient().from('profiles').select('*').in('id', [m.player1_id, m.player2_id])
      .then(({ data }) => data && setProfs(Object.fromEntries(data.map((p) => [p.id, p as Profile]))));
  }, [m.status, m.player1_id, m.player2_id]);

  const run = (f: () => Promise<Res>) => start(async () => { const r = await f(); setErr(r.ok ? '' : t('err')); });
  const isP1 = meId === m.player1_id;
  const opp = profs[isP1 ? m.player2_id : m.player1_id];
  const name = (id: string | null) => (id ? profs[id]?.smash_tag ?? '?' : '');
  const stageName = (id: string | null) => SA_STAGES.find((s) => s.id === id)?.name[lang] ?? '—';
  const myRps = isP1 ? m.rps_p1 : m.rps_p2;
  const myReport = isP1 ? m.report_p1 : m.report_p2;
  const s = strikeState(m);
  const myTurn = s.actor === meId;

  return (
    <div className="space-y-5">
      <header className="card flex items-center justify-between">
        <PlayerTag p={profs[m.player1_id]} />
        <div className="text-center">
          <div className="text-4xl font-extrabold">{m.p1_score} – {m.p2_score}</div>
          <div className="text-sm text-white/60">{t('game')} {m.game_no} · Bo3</div>
        </div>
        <PlayerTag p={profs[m.player2_id]} right />
      </header>

      {m.status === 'rps' && (
        <section className="card text-center">
          <h2 className="text-2xl font-bold">{t('rps_title')}</h2>
          <p className="mb-4 text-white/60">{t('rps_sub')}</p>
          <div className="flex justify-center gap-3">
            {RPS.map((r) => (
              <button key={r.id} disabled={pending || !!myRps} onClick={() => run(() => rpsMove(m.id, r.id))}
                className={`btn btn-ghost flex flex-col items-center gap-1 px-6 text-4xl ${myRps === r.id ? 'ring-2 ring-sun' : ''}`}>
                {r.icon}<span className="text-sm">{t(r.k as Key)}</span>
              </button>
            ))}
          </div>
          {myRps && <p className="mt-4 text-white/60">{t('waiting_opp')}</p>}
        </section>
      )}

      {m.status === 'striking' && (
        <section className="card">
          <h2 className="mb-4 text-xl font-bold">
            {myTurn ? (s.kind === 'pick' ? t('pick_turn') : t('ban_turn', { n: s.left })) : t('opp_turn', { name: name(s.actor) })}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SA_STAGES.map((st) => {
              const inPool = stagePool(m.game_no).includes(st.id);
              const banned = m.banned_stages.includes(st.id);
              if (!inPool) return null;
              return (
                <button key={st.id} disabled={!myTurn || banned || pending} onClick={() => run(() => banStage(m.id, st.id))}
                  className={`rounded-xl border p-4 text-left transition ${banned ? 'border-line bg-ink/60 text-white/30 line-through' : myTurn ? 'border-sky hover:bg-sky/15' : 'border-line'}`}>
                  <span className="font-semibold">{st.name[lang]}</span>
                  {banned && <span className="mt-1 block text-xs no-underline">{t('banned')}</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {m.status !== 'rps' && m.status !== 'disputed' && m.status !== 'completed' && (
        <section className="card grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">{t('arena_title')}</h3>
            <div className="space-y-2">
              <input className="input" placeholder={t('arena_id')} value={aid} maxLength={32} onChange={(e) => setAid(e.target.value)} />
              <input className="input" placeholder={t('arena_pass')} value={apass} maxLength={32} onChange={(e) => setApass(e.target.value)} />
              <button className="btn btn-ghost w-full" disabled={pending} onClick={() => run(() => setArena(m.id, aid, apass))}>{t('arena_save')}</button>
            </div>
          </div>
          {m.status === 'playing' && (
            <div>
              <h3 className="mb-1 font-semibold">{t('stage')}</h3>
              <p className="mb-4 text-2xl font-extrabold text-sun">{stageName(m.selected_stage)}</p>
              <h3 className="mb-2 font-semibold">{t('report')}</h3>
              {myReport ? <p className="text-white/60">{t('reported')}</p> : (
                <div className="flex gap-3">
                  <button className="btn btn-sun flex-1" disabled={pending} onClick={() => run(() => reportGame(m.id, meId))}>{t('i_won')}</button>
                  <button className="btn btn-ghost flex-1" disabled={pending} onClick={() => run(() => reportGame(m.id, opp.id))}>{t('i_lost')}</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {m.status === 'disputed' && (
        <section className="card border-danger text-danger" role="alert">{t('disputed')}</section>
      )}
      {m.status === 'completed' && (
        <section className="card text-center">
          <h2 className="text-3xl font-extrabold text-sun">{t('completed', { name: name(m.winner_id) })}</h2>
          <p className="mt-2 text-white/70">{name(m.player1_id)} {profs[m.player1_id]?.elo} · {name(m.player2_id)} {profs[m.player2_id]?.elo} ELO</p>
          <Link href="/dashboard" className="btn btn-sun mt-5 inline-block">{t('back')}</Link>
        </section>
      )}

      {err && <p className="text-danger" role="alert">{err}</p>}
      {m.status !== 'completed' && m.status !== 'disputed' && (
        <button className="btn btn-ghost border-danger text-danger" disabled={pending} onClick={() => run(() => callMod(m.id))}>{t('call_mod')}</button>
      )}
    </div>
  );
}

function PlayerTag({ p, right }: { p?: Profile; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''}>
      <div className="text-lg font-bold">{flagOf(p?.country ?? '')} {p?.smash_tag ?? '?'}</div>
      <div className="text-sm text-white/60">{p?.elo} ELO</div>
    </div>
  );
}
