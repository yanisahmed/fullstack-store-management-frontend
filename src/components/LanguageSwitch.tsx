'use client';
import { useI18n } from '@/lib/i18n';

export function LanguageSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const base = 'rounded px-2.5 py-1 text-sm transition-colors';
  const on = dark ? 'bg-white/15 text-white font-medium' : 'bg-brand-tint text-brand-dark font-medium';
  const off = dark ? 'text-white/60 hover:text-white' : 'text-ink-muted hover:text-ink';
  return (
    <div role="group" aria-label={t('c.language')} className="inline-flex items-center gap-1">
      <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')} className={`${base} ${lang === 'en' ? on : off}`}>English</button>
      <button type="button" lang="bn" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')} className={`${base} ${lang === 'bn' ? on : off}`}>বাংলা</button>
    </div>
  );
}
