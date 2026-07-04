'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { authedFetch } from '@/lib/api-client';
import { fetchMyGenerations } from '@/lib/client-data';
import { GOODS, getGoods, goodsCostSummary } from '@/lib/goods';
import { GoodsMockup } from '@/components/goods-mockup';
import type { GenerationDoc } from '@/lib/types';

export function CollectionClient() {
  const t = useTranslations('goods');
  const ta = useTranslations('auth');
  const locale = useLocale();
  const { user, loading, signInWithGoogle } = useAuth();

  const [gens, setGens] = useState<GenerationDoc[]>([]);
  const [goodsId, setGoodsId] = useState<string>('frame');
  const [selected, setSelected] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<{ amountKrw: number; genCostUsd: number } | null>(null);

  useEffect(() => {
    if (user) fetchMyGenerations(user.uid).then(setGens).catch(() => setGens([]));
  }, [user]);

  const goods = getGoods(goodsId)!;
  const cost = goodsCostSummary(goods);
  const nameOf = (id: string) => (locale === 'ko' ? getGoods(id)!.nameKo : getGoods(id)!.nameEn);

  function toggle(genId: string, imageUrl: string) {
    setOrder(null);
    setSelected((prev) => {
      if (prev.includes(genId)) return prev.filter((x) => x !== genId);
      if (prev.length >= goods.requiredImages) {
        // 단품(1장)은 교체, 달력(12장)은 채우기.
        if (goods.requiredImages === 1) {
          setPreviewUrl(imageUrl);
          return [genId];
        }
        return prev;
      }
      if (prev.length === 0) setPreviewUrl(imageUrl);
      return [...prev, genId];
    });
  }

  async function onHiPreview() {
    if (selected.length === 0) return;
    setError('');
    setBusy(true);
    try {
      const res = await authedFetch('/api/goods/preview', {
        method: 'POST',
        body: JSON.stringify({ genId: selected[0] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'failed');
      setPreviewUrl(json.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onOrder() {
    if (selected.length === 0) return;
    setError('');
    setBusy(true);
    try {
      const res = await authedFetch('/api/goods/order', {
        method: 'POST',
        body: JSON.stringify({ goodsId, genIds: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'failed');
      setOrder({ amountKrw: json.amountKrw, genCostUsd: json.genCostUsd });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-text-muted">…</p>;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-text-secondary">{t('needLogin')}</p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent"
        >
          {ta('signInWithGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* 굿즈 종류 */}
      <div className="flex flex-wrap gap-2">
        {GOODS.map((g) => (
          <button
            key={g.goodsId}
            type="button"
            onClick={() => {
              setGoodsId(g.goodsId);
              setSelected([]);
              setOrder(null);
            }}
            className={`rounded-control border px-3 py-1.5 text-sm ${
              goodsId === g.goodsId ? 'bg-accent text-on-accent' : 'text-text-secondary'
            }`}
          >
            {nameOf(g.goodsId)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 미리보기 + 원가 */}
        <div className="flex flex-col items-center gap-4">
          <GoodsMockup url={previewUrl} goodsId={goodsId} />

          <dl className="w-full max-w-xs space-y-1 rounded-card border bg-surface p-3 text-sm">
            <Row label={t('price')} value={`${cost.priceKrw.toLocaleString()}원`} />
            <Row
              label={t('costGen')}
              value={`~${cost.genCostKrw.toLocaleString()}원 (${goods.requiredImages}장 high)`}
            />
            <Row label={t('costPrint')} value={t('printTbd')} muted />
            <Row label={t('margin')} value={t('marginTbd')} muted />
          </dl>

          <div className="flex w-full max-w-xs flex-col gap-2">
            <button
              type="button"
              onClick={() => void onHiPreview()}
              disabled={busy || selected.length === 0}
              className="rounded-control border px-4 py-2 text-sm text-text-secondary disabled:opacity-50"
            >
              {busy ? t('hiPreviewBusy') : t('hiPreview')}
            </button>
            <button
              type="button"
              onClick={() => void onOrder()}
              disabled={busy || selected.length === 0}
              className="rounded-control bg-accent px-4 py-3 text-sm font-medium text-on-accent disabled:opacity-50"
            >
              {t('order')}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {order && (
            <p className="text-center text-sm text-text-secondary">
              {t('ordered')} · {order.amountKrw.toLocaleString()}원
              <br />
              <span className="text-xs text-text-muted">{t('orderedDesc')}</span>
            </p>
          )}
        </div>

        {/* 내 작품 선택 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-secondary">
            {t('selectImages', { n: goods.requiredImages })} ({selected.length}/{goods.requiredImages})
          </p>
          {gens.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-text-muted">{t('noWorks')}</p>
              <Link href="/create" className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent">
                {t('goCreate')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gens.map((g) => {
                const on = selected.includes(g.genId);
                return (
                  <button
                    key={g.genId}
                    type="button"
                    onClick={() => toggle(g.genId, g.imageUrl)}
                    className={`relative aspect-square overflow-hidden rounded-control border-2 ${
                      on ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.imageUrl} alt="" className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-on-accent">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className={muted ? 'text-text-muted' : 'text-text-primary'}>{value}</dd>
    </div>
  );
}
