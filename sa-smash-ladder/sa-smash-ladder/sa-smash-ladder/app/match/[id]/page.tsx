import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MatchRoom from '@/components/MatchRoom';
import type { Match, Profile } from '@/lib/types';
export default async function MatchPage({ params }: { params: { id: string } }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/');
  const { data: m } = await sb.from('matches').select('*').eq('id', params.id).maybeSingle<Match>(); // RLS: solo participantes
  if (!m) notFound();
  const { data: ps } = await sb.from('profiles').select('*').in('id', [m.player1_id, m.player2_id]);
  const profiles = Object.fromEntries((ps ?? []).map((p) => [p.id, p as Profile]));
  return <MatchRoom initial={m} profiles={profiles} meId={user.id} />;
}
