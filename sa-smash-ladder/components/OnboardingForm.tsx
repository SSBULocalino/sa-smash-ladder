'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES } from '@/lib/countries';
import { saveProfile } from '@/app/actions';

export default function OnboardingForm() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [tag, setTag] = useState('');
  const [country, setCountry] = useState('CL');
  const [lan, setLan] = useState(false);
  const [cross, setCross] = useState(false);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveProfile({ smash_tag: tag, country, has_lan: lan, accept_cross_region: cross });
      if (r.ok) { router.push('/dashboard'); router.refresh(); } else setErr(t('err'));
    });
  };
  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-5">
      <h1 className="text-2xl font-bold">{t('ob_title')}</h1>
      <label className="block space-y-1.5">
        <span className="text-sm text-white/70">{t('ob_tag')}</span>
        <input className="input" required minLength={2} maxLength={20} value={tag} onChange={(e) => setTag(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-white/70">{t('ob_country')}</span>
        <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name[lang]}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-3"><input type="checkbox" className="size-5 accent-sun" checked={lan} onChange={(e) => setLan(e.target.checked)} />{t('ob_lan')}</label>
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-sun" checked={cross} onChange={(e) => setCross(e.target.checked)} />
        <span>{t('ob_cross')}<br /><span className="text-sm text-white/50">{t('ob_cross_hint')}</span></span>
      </label>
      {err && <p className="text-danger" role="alert">{err}</p>}
      <button disabled={pending} className="btn btn-sun w-full">{t('ob_save')}</button>
    </form>
  );
}
