'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { uploadOriginal } from '@/lib/firebase/upload';
import { authedFetch } from '@/lib/api-client';
import { ImageUploader, type PickedImage } from '@/components/image-uploader';
import { ResultView } from '@/components/result-view';

// 실험실 = 가상 펫 생성 (06 §4).
export function ExploreClient() {
  const t = useTranslations('explore');
  const { user, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [parts, setParts] = useState('');
  const [extras, setExtras] = useState('');
  const [samples, setSamples] = useState<PickedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; coreId: string } | null>(null);

  async function onCreate() {
    setError('');
    if (!user) return void signInWithGoogle();
    const partList = parts.split(',').map((s) => s.trim()).filter(Boolean);
    if (partList.length === 0) return setError(t('needParts'));

    setBusy(true);
    try {
      const sourcePaths = await Promise.all(samples.map((p) => uploadOriginal(user.uid, p.file)));
      const res = await authedFetch('/api/virtualpet/create', {
        method: 'POST',
        body: JSON.stringify({
          name,
          recipe: { parts: partList, extras: extras.split(',').map((s) => s.trim()).filter(Boolean) },
          sourcePaths,
          quality: 'medium',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'failed');
      setResult({ url: json.url, coreId: json.coreId });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <ResultView url={result.url} />
        <Link href={`/fitting/${result.coreId}`} className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent">
          {t('title')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-4">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('desc')}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-text-secondary">{t('name')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} className="input" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-text-secondary">{t('parts')}</span>
        <input value={parts} onChange={(e) => setParts(e.target.value)} placeholder={t('partsHint')} className="input" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-text-secondary">{t('extras')}</span>
        <input value={extras} onChange={(e) => setExtras(e.target.value)} placeholder={t('extrasHint')} className="input" />
      </label>

      <ImageUploader value={samples} onChange={setSamples} max={3} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => void onCreate()}
        disabled={busy}
        className="rounded-control bg-accent px-4 py-3 text-sm font-medium text-on-accent disabled:opacity-50"
      >
        {busy ? t('creating') : t('create')}
      </button>
    </div>
  );
}
