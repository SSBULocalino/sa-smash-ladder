'use client';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';

export default function LoginButton() {
  const { t } = useI18n();
  const login = () =>
    createClient().auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${location.origin}/auth/callback`, scopes: 'identify' },
    });
  return (
    <section className="py-20">
      <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{t('login_title')}</h1>
      <p className="mt-5 max-w-md text-lg text-white/70">{t('login_sub')}</p>
      <button onClick={login} className="btn btn-sun mt-8 text-lg">{t('login_btn')}</button>
    </section>
  );
}
