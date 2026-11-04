'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { bn } from './bn';
import { en } from './en';

export type Lang = 'en' | 'bn';
export type Key = keyof typeof en;
type Params = Record<string, string | number>;

const dicts: Record<Lang, Record<Key, string>> = { en, bn };
let current: Lang = 'en';

export const getLang = () => current;
/** English dates keep Latin digits for Bengali too, so numbers look the same everywhere */
export const dateLocale = () => (current === 'bn' ? 'bn-BD-u-nu-latn' : 'en-GB');

export function translate(key: Key, params?: Params): string {
  let s: string = dicts[current][key] ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Turns an API error (code + params) into a message in the current language. */
export function translateError(code: string | undefined, params: Params | undefined, fallback: string) {
  const key = `err.${code}` as Key;
  return code && key in en ? translate(key, params) : fallback;
}

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (key: Key, params?: Params) => string }
const I18nCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: translate });
export const useI18n = () => useContext(I18nCtx);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  current = lang; // children rendered below must already see the new language

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'bn' || saved === 'en') setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'bn' && !document.getElementById('bn-font')) {
      const l = document.createElement('link');
      l.id = 'bn-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600&display=swap';
      document.head.appendChild(l);
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => { localStorage.setItem('lang', l); setLangState(l); }, []);
  const t = useCallback((key: Key, params?: Params) => translate(key, params), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}
