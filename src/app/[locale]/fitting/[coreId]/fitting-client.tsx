'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { fetchCore, fetchMyCores, shareGeneration } from '@/lib/client-data';
import { uploadOriginal } from '@/lib/firebase/upload';
import { authedFetch } from '@/lib/api-client';
import { ResultView } from '@/components/result-view';
import { NavIcon } from '@/components/icons';
import type { CoreImageDoc } from '@/lib/types';

const BACKGROUNDS = [
  { value: '', key: 'bgNone' },
  { value: 'sea', key: 'bgSea' },
  { value: 'forest', key: 'bgForest' },
  { value: 'city', key: 'bgCity' },
  { value: 'living_room', key: 'bgLivingRoom' },
] as const;

interface Item {
  file: File;
  previewUrl: string;
}

export function FittingClient({ coreId }: { coreId: string }) {
  const t = useTranslations('fitting');
  const { user } = useAuth();
  const search = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<CoreImageDoc | null>(null);
  const [myCores, setMyCores] = useState<CoreImageDoc[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [background, setBackground] = useState<string>(search.get('background') ?? '');
  const [apparel, setApparel] = useState<string>(search.get('apparel') ?? '');
  const [prompt, setPrompt] = useState<string>(search.get('prompt') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ genId: string; url: string } | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (coreId !== 'new') {
        const core = await fetchCore(coreId).catch(() => null);
        if (!cancelled && core && core.ownerUid === user.uid) {
          setSelected(core);
          return;
        }
      }
      const cores = await fetchMyCores(user.uid).catch(() => []);
      if (!cancelled) setMyCores(cores);
    })();
    return () => {
      cancelled = true;
    };
  }, [coreId, user]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    setError('');
    const next = [...items];
    for (const file of Array.from(files)) {
      if (next.length >= 3) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setItems(next);
  }

  async function onApply() {
    if (!selected) return;
    setError('');
    setBusy(true);
    try {
      const apparelPaths = user
        ? await Promise.all(items.map((it) => uploadOriginal(user.uid, it.file)))
        : [];
      const apparelIds = apparel.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await authedFetch('/api/fitting/apply', {
        method: 'POST',
        body: JSON.stringify({ coreId: selected.coreId, apparel: apparelIds, apparelPaths, background, userPrompt: prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'failed');
      setResult({ genId: json.genId, url: json.url });
      setShared(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onShareToFeed() {
    if (!result) return;
    await shareGeneration(result.genId).catch(() => {});
    setShared(true);
  }

  if (!user) {
    return <p className="py-16 text-center text-sm text-text-muted">{t('noCores')}</p>;
  }

  // 코어 선택 단계.
  if (!selected) {
    if (myCores === null) return <p className="py-16 text-center text-sm text-text-muted">…</p>;
    if (myCores.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-text-secondary">{t('noCores')}</p>
          <Link href="/create" className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent">
            {t('title')}
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 py-4">
        <h1 className="text-lg font-semibold">{t('chooseCore')}</h1>
        <div className="grid grid-cols-3 gap-3">
          {myCores.map((c) => (
            <button key={c.coreId} type="button" onClick={() => setSelected(c)} className="aspect-square overflow-hidden rounded-card border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* 코어 이미지 (06 §2) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={selected.imageUrl} alt="" className="w-full rounded-card border" />

      {/* 입힐 아이템 업로드 — 명확한 영역 */}
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('attach')}</span>

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed py-8 text-text-muted transition-colors hover:border-text-secondary hover:text-text-primary"
          >
            <NavIcon name="apparel" width={28} height={28} />
            <span className="text-sm font-medium">{t('uploadCta')}</span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((it, i) => (
              <button
                key={it.previewUrl}
                type="button"
                onClick={() => setLightbox(it.previewUrl)}
                title={t('viewOriginal')}
                className="relative h-20 w-20 overflow-hidden rounded-control border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setItems(items.filter((_, idx) => idx !== i));
                  }}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                >
                  ×
                </span>
              </button>
            ))}
            {items.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 items-center justify-center rounded-control border border-dashed text-2xl text-text-muted hover:text-text-primary"
                aria-label={t('uploadCta')}
              >
                +
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-text-muted">{t('attachHint')}</p>
      </section>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-text-secondary">{t('background')}</span>
        <div className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setBackground(b.value)}
              className={`rounded-control border px-3 py-1.5 text-sm ${
                background === b.value ? 'bg-accent text-on-accent' : 'text-text-secondary'
              }`}
            >
              {t(b.key)}
            </button>
          ))}
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-text-secondary">{t('prompt')}</span>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('promptPlaceholder')} className="input" />
      </label>

      <details className="text-sm">
        <summary className="cursor-pointer text-text-muted">{t('apparel')}</summary>
        <input value={apparel} onChange={(e) => setApparel(e.target.value)} placeholder={t('apparelHint')} className="input mt-2" />
      </details>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={() => void onApply()}
        disabled={busy}
        className="rounded-control bg-accent px-4 py-3 text-sm font-medium text-on-accent disabled:opacity-50"
      >
        {busy ? t('applying') : t('apply')}
      </button>

      {result && (
        <div className="flex flex-col items-center gap-3 border-t pt-5">
          <ResultView url={result.url} />
          <button
            type="button"
            onClick={() => void onShareToFeed()}
            disabled={shared}
            className="rounded-control border px-4 py-2 text-sm text-text-secondary disabled:opacity-50"
          >
            {shared ? t('sharedDone') : t('shareToFeed')}
          </button>
        </div>
      )}

      {/* 원본 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-card" />
        </div>
      )}
    </div>
  );
}
