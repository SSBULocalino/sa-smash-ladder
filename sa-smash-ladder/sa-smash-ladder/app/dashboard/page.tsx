import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QueuePanel from '@/components/QueuePanel';
import Leaderboard from '@/components/Leaderboard';
import type { Profile } from '@/lib/types';

export default async function Dashboard() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/');
  const { data: me } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>();
  if (!me) redirect('/onboarding');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QueuePanel me={me} />
      <Leaderboard meId={me.id} />
    </div>
  );
}
