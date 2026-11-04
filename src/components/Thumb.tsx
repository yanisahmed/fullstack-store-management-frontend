'use client';
import { useState } from 'react';
import { imageUrl } from '@/lib/api';

/** A product/customer picture, or the first letter of the name when there is none. */
export function Thumb({ token, name, size = 40, round = false }: { token?: string | null; name: string; size?: number; round?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(token);
  const shape = `${round ? 'rounded-full' : 'rounded-md'} shrink-0`;
  const style = { width: size, height: size };
  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} style={style} className={`${shape} border border-ink-line bg-white object-cover`} />;
  }
  return (
    <span aria-hidden="true" style={{ ...style, fontSize: Math.round(size * 0.42) }} className={`${shape} flex items-center justify-center bg-brand-tint font-semibold text-brand-dark`}>
      {Array.from(name.trim())[0]?.toUpperCase() ?? '?'}
    </span>
  );
}
