'use client';
import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { compressImage } from '@/lib/image';
import { Button } from './ui';
import { Thumb } from './Thumb';

/** Pick a photo (gallery or camera), shrink it, upload it, and report the new token. */
export function ImageUpload({ kind, token, name, onChange, onError }: {
  kind: 'product' | 'customer'; token: string | null; name: string;
  onChange: (token: string | null) => void; onError?: (message: string) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null); // local preview while the upload runs

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressImage(file);
      setPreview(URL.createObjectURL(blob));
      const { token: newToken } = await uploadImage(kind, blob);
      onChange(newToken);
    } catch (e) {
      setPreview(null);
      const m = (e as Error).message;
      onError?.(['not-an-image', 'no-canvas', 'too-large'].includes(m) || (e as Error).name === 'EncodingError' ? t('img.unsupported') : m);
    }
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="flex items-center gap-3">
      {preview && busy ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" width={64} height={64} className={`${kind === 'customer' ? 'rounded-full' : 'rounded-md'} h-16 w-16 border border-ink-line object-cover opacity-60`} />
      ) : (
        <Thumb token={token} name={name || '?'} size={64} round={kind === 'customer'} />
      )}
      <div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? t('img.uploading') : token ? t('img.change') : t('img.upload')}
          </Button>
          {token && !busy && <Button type="button" variant="quiet" className="!text-bad" onClick={() => { setPreview(null); onChange(null); }}>{t('img.remove')}</Button>}
        </div>
        <p className="mt-1 text-xs text-ink-muted">{t('img.hint')}</p>
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label={t('img.upload')} onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
