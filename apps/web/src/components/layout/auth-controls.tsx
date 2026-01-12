'use client';

import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n/i18n-provider';
import { useMessages } from '@/lib/i18n/i18n-provider';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Moon, Sun, Monitor } from 'lucide-react';

export function AuthControls() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const t = useMessages('nav');

  const themeOptions = [
    { value: 'light', label: t.themeLight, icon: Sun },
    { value: 'dark', label: t.themeDark, icon: Moon },
    { value: 'system', label: t.themeSystem, icon: Monitor },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
