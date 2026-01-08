import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TRPCProvider } from '@/lib/trpc-provider';
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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
