'use client';

import Link from 'next/link';
import { UserMenu } from './user-menu';
import { Zap } from 'lucide-react';

interface TopNavProps {
  user: { name: string; email: string } | null;
}

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-foreground">Worker App</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  );
}
