import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginButton from '@/components/LoginButton';

export default async function Home() {
  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect('/dashboard');
  return <LoginButton />;
}
