import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingForm from '@/components/OnboardingForm';

export default async function Onboarding() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/');
  const { data: p } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (p) redirect('/dashboard');
  return <OnboardingForm />;
}
