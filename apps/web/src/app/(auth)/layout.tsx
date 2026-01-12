'use client';

import type { ReactNode } from 'react';
import { AuthControls } from '@/components/layout/auth-controls';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">Worker App</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              AI-Powered<br />Parallel Computing
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              Queue-based computations with LLM integration. Process mathematical operations in parallel with real-time updates.
            </p>
          </div>
        </div>
        {/* Floating shapes */}
        <div className="absolute top-20 right-20 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-32 right-40 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-10 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="absolute top-4 right-4">
          <AuthControls />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
