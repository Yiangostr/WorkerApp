'use client';

import { useTheme } from 'next-themes';
import { signOut } from '@/lib/auth-client';
import { useMessages, useI18n } from '@/lib/i18n/i18n-provider';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locales';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Moon, Sun, Monitor, Globe } from 'lucide-react';

interface UserMenuProps {
  user: { name: string; email: string };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu({ user }: UserMenuProps) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const t = useMessages('nav');

  const themeOptions = [
    { value: 'light', label: t.themeLight, icon: Sun },
    { value: 'dark', label: t.themeDark, icon: Moon },
    { value: 'system', label: t.themeSystem, icon: Monitor },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-full p-1 hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">{t.theme}</DropdownMenuLabel>
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={theme === option.value ? 'bg-accent' : ''}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">{t.language}</DropdownMenuLabel>
          {LOCALES.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc as Locale)}
              className={locale === loc ? 'bg-accent' : ''}
            >
              <Globe className="mr-2 h-4 w-4" />
              <span>{LOCALE_NAMES[loc as Locale]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.signOut}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
