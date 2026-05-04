'use client';

import { CONTENT_LOCALES, type ContentLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

type LocaleTabBarProps = {
  active: ContentLocale;
  onChange: (locale: ContentLocale) => void;
  label?: string;
};

export function LocaleTabBar({ active, onChange, label }: LocaleTabBarProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <span className="text-sm font-medium text-foreground">{label}</span>
      ) : null}
      <div
        className="flex flex-wrap gap-1 rounded-xl bg-muted/80 p-1 ring-1 ring-border/60"
        role="tablist"
        aria-label="Язык контента"
      >
        {CONTENT_LOCALES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'min-w-[5rem] flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium transition-all sm:text-sm',
              active === item.id
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
