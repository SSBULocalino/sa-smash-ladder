'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdmin } from '@/lib/supabase/admin';
import { calculateNewElo, canMatchPlayers, getNetworkNode, type CountryCode } from '@/lib/matchmaking';
import { strikeState, stagePool } from '@/lib/strike';
import { COUNTRIES } from '@/lib/countries';
import type { Match } from '@/lib/types';

type R = { ok: boolean; error?: string; matchId?: string };
const BEATS: Record<string, string> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const arr = (a: string[]) => `{${a.join(',')}}`;

async function safe(fn: () => Promise<R | void>): Promise<R> {
  try { return (await fn()) ?? { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
}
async function me() {
  const sb = await createClient();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('auth');
  return { sb, user };
}
async function myMatch(id: string) {
  const { user } = await me();
  const admin = createAdmin();
  const { data: m } = await admin.from('matches').select('*').eq('id', id).single<Match>();
  if (!m || (m.player1_id !== user.id && m.player2_id !== user.id)) throw new Error('forbidden');
  return { admin, user, m };
}

export async function signOut() {
(await createClient()).auth.signOut();

  redirect('/');
}

export async function saveProfile(input: { smash_tag: string; country: string; has_lan: boolean; accept_cross_region: boolean }) {
  return safe(async () => {
    const { sb, user } = await me();
    const tag = input.smash_tag.trim();
    if (tag.length < 2 || tag.length > 20) throw new Error('tag');
    if (!COUNTRIES.some((c) => c.code === input.country)) throw new Error('country');
    const md = user.user_metadata ?? {};
    const { error } = await sb.from('profiles').upsert({
      id: user.id,
      discord_username: md.full_name ?? md.name ?? md.user_name ?? tag,
      smash_tag: tag, country: input.country, has_lan: !!input.has_lan, accept_cross_region: !!input.accept_cross_region,
    });
    if (error) throw new Error(error.message);
  });
}

/* ───────── Matchmaking ───────── */
async function findMatch(uid: string): Promise<R> {
  const admin = createAdmin();
  const { data: q } = await admin.from('matchmaking_queue').select('*').order('joined_at');
  const mine = q?.find((r) => r.user_id === uid);
  if (!mine) return { ok: true };
  const opp = q!.find((r) => r.user_id !== uid && canMatchPlayers(mine, r));
  if (!opp) return { ok: true };
  const { data: del } = await admin.from('matchmaking_queue').delete().in('user_id', [uid, opp.user_id]).select();
  if (!del || del.length < 2) {
    if (del?.length) await admin.from('matchmaking_queue').insert(del); // otro proceso ganó la carrera
    return { ok: true };
  }
  const { data: m } = await admin.from('matches').insert({ player1_id: uid, player2_id: opp.user_id }).select('id').single();
  return { ok: true, matchId: m?.id };
}

export async function joinQueue() {
  return safe(async () => {
    const { sb, user } = await me();
    const { data: p } = await sb.from('profiles').select('elo,country,accept_cross_region').eq('id', user.id).single();
    if (!p) throw new Error('profile');
    await createAdmin().from('matchmaking_queue').upsert({
      user_id: user.id, elo: p.elo, node: getNetworkNode(p.country as CountryCode),
      accept_cross_region: p.accept_cross_region, joined_at: new Date().toISOString(),
    });
    return findMatch(user.id);
  });
}
export async function tryMatch() { return safe(async () => findMatch((await me()).user.id)); }
export async function leaveQueue() {
  return safe(async () => { await createAdmin().from('matchmaking_queue').delete().eq('user_id', (await me()).user.id); });
}

/* ───────── Sala de partida ───────── */
export async function rpsMove(matchId: string, move: string) {
  return safe(async () => {
    if (!(move in BEATS)) throw new Error('move');
    const { admin, user, m } = await myMatch(matchId);
    if (m.status !== 'rps') return;
    const col = user.id === m.player1_id ? 'rps_p1' : 'rps_p2';
    const { data: u } = await admin.from('matches').update({ [col]: move }).eq('id', matchId).eq('status', 'rps').select().single<Match>();
    if (!u || !u.rps_p1 || !u.rps_p2) return;
    if (u.rps_p1 === u.rps_p2) { // empate: repetir
      await admin.from('matches').update({ rps_p1: null, rps_p2: null }).eq('id', matchId).eq('status', 'rps');
      return;
    }
    const first = BEATS[u.rps_p1] === u.rps_p2 ? u.player1_id : u.player2_id;
    await admin.from('matches').update({ status: 'striking', first_banner_id: first, turn_user_id: first }).eq('id', matchId).eq('status', 'rps');
  });
}

export async function banStage(matchId: string, stageId: string) {
  return safe(async () => {
    const { admin, user, m } = await myMatch(matchId);
    if (m.status !== 'striking') return;
    const s = strikeState(m);
    if (s.kind === 'done' || s.actor !== user.id) throw new Error('turn');
    const pool = stagePool(m.game_no);
    if (!pool.includes(stageId) || m.banned_stages.includes(stageId)) throw new Error('stage');
    const base = admin.from('matches');
    const guard = { status: 'striking', banned_stages: arr(m.banned_stages) };
    if (s.kind === 'pick') {
      await base.update({ selected_stage: stageId, status: 'playing', turn_user_id: null }).eq('id', matchId).match(guard);
      return;
    }
    const banned = [...m.banned_stages, stageId];
    const next = strikeState({ ...m, banned_stages: banned });
    const patch = next.kind === 'done'
      ? { banned_stages: banned, selected_stage: pool.find((id) => !banned.includes(id)), status: 'playing', turn_user_id: null }
      : { banned_stages: banned, turn_user_id: next.actor };
    await base.update(patch).eq('id', matchId).match(guard);
  });
}

export async function setArena(matchId: string, arenaId: string, arenaPass: string) {
  return safe(async () => {
    const { admin } = await myMatch(matchId);
    await admin.from('matches').update({ arena_id: arenaId.trim().slice(0, 32), arena_pass: arenaPass.trim().slice(0, 32) }).eq('id', matchId);
  });
}

async function resolveGame(admin: ReturnType<typeof createAdmin>, m: Match, winner: string) {
  const p1 = winner === m.player1_id;
  const s1 = m.p1_score + (p1 ? 1 : 0), s2 = m.p2_score + (p1 ? 0 : 1);
  const done = s1 === 2 || s2 === 2;
  const patch = done
    ? { p1_score: s1, p2_score: s2, status: 'completed', winner_id: winner, turn_user_id: null }
    : { p1_score: s1, p2_score: s2, status: 'striking', game_no: m.game_no + 1, banned_stages: [], selected_stage: null,
        report_p1: null, report_p2: null, game_winner_id: winner, turn_user_id: winner };
  const { data } = await admin.from('matches').update(patch).eq('id', m.id).eq('status', 'playing').eq('game_no', m.game_no).select();
  if (!data?.length || !done) return; // la guarda evita aplicar ELO dos veces
  const loser = p1 ? m.player2_id : m.player1_id;
  const { data: ps } = await admin.from('profiles').select('id,elo,wins,losses').in('id', [winner, loser]);
  const W = ps?.find((x) => x.id === winner), L = ps?.find((x) => x.id === loser);
  if (!W || !L) return;
  const { newWinnerElo, newLoserElo } = calculateNewElo(W.elo, L.elo);
  await Promise.all([
    admin.from('profiles').update({ elo: newWinnerElo, wins: W.wins + 1 }).eq('id', W.id),
    admin.from('profiles').update({ elo: newLoserElo, losses: L.losses + 1 }).eq('id', L.id),
  ]);
}

export async function reportGame(matchId: string, winnerId: string) {
  return safe(async () => {
    const { admin, user, m } = await myMatch(matchId);
    if (m.status !== 'playing') return;
    if (![m.player1_id, m.player2_id].includes(winnerId)) throw new Error('winner');
    const col = user.id === m.player1_id ? 'report_p1' : 'report_p2';
    const { data: u } = await admin.from('matches').update({ [col]: winnerId }).eq('id', matchId).eq('status', 'playing').select().single<Match>();
    if (!u || !u.report_p1 || !u.report_p2) return;
    if (u.report_p1 !== u.report_p2) { // reportes contradictorios → disputa
      await admin.from('matches').update({ status: 'disputed' }).eq('id', matchId).eq('status', 'playing');
      return;
    }
    await resolveGame(admin, u, u.report_p1);
  });
}

export async function callMod(matchId: string) {
  return safe(async () => {
    const { admin } = await myMatch(matchId);
    await admin.from('matches').update({ status: 'disputed' }).eq('id', matchId).neq('status', 'completed');
  });
}
