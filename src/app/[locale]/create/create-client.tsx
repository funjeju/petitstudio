'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { uploadOriginal } from '@/lib/firebase/upload';
import { createPet } from '@/lib/client-data';
import { authedFetch } from '@/lib/api-client';
import { ImageUploader, type PickedImage } from '@/components/image-uploader';
import { ResultView } from '@/components/result-view';
import type { Species } from '@/lib/types';

const SPECIES: { value: Species; key: 'speciesDog' | 'speciesCat' | 'speciesOther' }[] = [
  { value: 'dog', key: 'speciesDog' },
  { value: 'cat', key: 'speciesCat' },
  { value: 'other', key: 'speciesOther' },
];

export function CreateClient() {
  const t = useTranslations('create');
  const tauth = useTranslations('auth');
  const { user, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; coreId: string } | null>(null);

  async function onShoot() {
    setError('');
    if (!user) return setError(t('needLogin'));
    if (photos.length === 0) return setError(t('needPhoto'));

    setBusy(true);
    try {
      const sourcePaths = await Promise.all(photos.map((p) => uploadOriginal(user.uid, p.file)));
      const petId = await createPet({ ownerUid: user.uid, name: name || '아이', species, breed });
      const res = await authedFetch('/api/core/generate', {
        method: 'POST',
        body: JSON.stringify({ petId, sourcePaths, quality: 'medium' }),
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
        <h1 className="text-xl font-semibold">{t('resultTitle')}</h1>
        <ResultView url={result.url} />
        <Link
          href={`/fitting/${result.coreId}`}
          className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent"
        >
          {t('goFitting')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-text-secondary">{t('subtitle')}</p>
      </div>

      {!user && (
        <div className="flex items-center justify-between rounded-card border bg-surface px-4 py-3">
          <span className="text-sm text-text-secondary">{t('needLogin')}</span>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="rounded-control bg-accent px-3 py-1.5 text-xs font-medium text-on-accent"
          >
            {tauth('signInWithGoogle')}
          </button>
        </div>
      )}

      <Field label={t('petName')}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('petNamePlaceholder')}
          className="input"
        />
      </Field>

      <Field label={t('species')}>
        <div className="flex gap-2">
          {SPECIES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSpecies(s.value)}
              className={`flex-1 rounded-control border py-2 text-sm ${
                species === s.value ? 'bg-accent text-on-accent' : 'text-text-secondary'
              }`}
            >
              {t(s.key)}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('breed')}>
        <input
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder={t('breedPlaceholder')}
          className="input"
        />
      </Field>

      <Field label={t('photos')}>
        <ImageUploader value={photos} onChange={setPhotos} max={3} />
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => void onShoot()}
        disabled={busy || !user}
        className="rounded-control bg-accent px-4 py-3 text-sm font-medium text-on-accent disabled:opacity-50"
      >
        {busy ? t('generating') : t('shoot')}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      {children}
    </label>
  );
}
