import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TRPCProvider } from '@/lib/trpc-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { I18nProvider } from '@/lib/i18n/i18n-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Worker App - Queue Computation',
  description: 'A queue/worker application for parallel computations with LLM integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 dark:bg-slate-950`}>
        <ThemeProvider>
          <I18nProvider>
            <TRPCProvider>{children}</TRPCProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
