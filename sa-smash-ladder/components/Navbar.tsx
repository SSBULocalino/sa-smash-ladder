'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { signOut } from '@/app/actions';

export default function Navbar() {
  const { lang, setLang, t } = useI18n();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-xl font-extrabold tracking-tight">SA Smash <span className="text-sun">Ladder</span></Link>
        <div className="flex items-center gap-3">
          <div role="group" aria-label="Language" className="flex overflow-hidden rounded-lg border border-line text-sm">
            {(['es', 'pt'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`px-3 py-1.5 font-semibold ${lang === l ? 'bg-sun text-ink' : 'hover:bg-line/50'}`}>{l.toUpperCase()}</button>
            ))}
          </div>
          <form action={signOut}><button className="text-sm text-white/60 hover:text-white">{t('signout')}</button></form>
        </div>
      </div>
    </header>
  );
}
