import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

const font = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-sans' });
export const metadata: Metadata = { title: 'SA Smash Ladder', description: 'Ladder sudamericano de Smash Ultimate' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={font.variable}>
      <body>
        <I18nProvider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
