'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchFeed } from '@/lib/client-data';
import { GOODS, getGoods } from '@/lib/goods';
import type { GenerationDoc } from '@/lib/types';
import { NavIcon } from '@/components/icons';

/**
 * 홈 — 시안 3(PAWFOLIO, 모던 & 미니멀). 모바일 우선 앱 화면을 폰 너비 컬럼으로.
 * 히어로 → 퀵메뉴 → 피팅룸 들러보기 → 굿즈 라인업.
 */
export function FeedClient() {
  const t = useTranslations('home');
  const tf = useTranslations('feed');
  const tg = useTranslations('goods');
  const locale = useLocale();
  const [feed, setFeed] = useState<GenerationDoc[] | null>(null);

  useEffect(() => {
    fetchFeed().then(setFeed).catch(() => setFeed([]));
  }, []);

  const goodsName = (id: string) => (locale === 'ko' ? getGoods(id)!.nameKo : getGoods(id)!.nameEn);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
      {/* ── 히어로 ── */}
      <section className="overflow-hidden rounded-card border bg-surface">
        <div className="flex flex-col gap-4 p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{t('eyebrow')}</p>
          <h1 className="whitespace-pre-line text-2xl font-bold leading-snug tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary">{t('heroSub')}</p>
          <Link
            href="/create"
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
          >
            {t('ctaCore')} <span aria-hidden>→</span>
          </Link>
        </div>
        {/* 히어로 비주얼 자리(콜드스타트: 뉴트럴 프레임) */}
        <div className="relative mx-6 mb-6 flex aspect-[16/10] items-center justify-center rounded-card border bg-bg">
          <span className="text-4xl opacity-40" aria-hidden>
            🐾
          </span>
        </div>
      </section>

      {/* ── 퀵메뉴 카드 ── */}
      <nav className="grid grid-cols-4 gap-1 rounded-card border bg-bg p-2">
        <QuickItem href="/create" icon="create" label={t('quickCore')} />
        <QuickItem href="/studio" icon="apparel" label={t('quickFitting')} />
        <QuickItem href="/collection" icon="goods" label={t('quickGoods')} />
        <QuickItem href="/studio" icon="orders" label={t('quickOrders')} />
      </nav>

      {/* ── 피팅룸 들러보기 ── */}
      <section className="flex flex-col gap-3">
        <SectionHead title={tf('peek')} href="/explore" cta={tf('seeAll')} />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(['catAll', 'catHat', 'catOutfit', 'catAccessory', 'catSeason', 'catProp'] as const).map((k, i) => (
            <span
              key={k}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${
                i === 0 ? 'border-accent bg-accent text-on-accent' : 'text-text-secondary'
              }`}
            >
              {tf(k)}
            </span>
          ))}
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {feed === null ? (
            [0, 1, 2].map((i) => <div key={i} className="h-40 w-32 shrink-0 animate-pulse rounded-card bg-surface" />)
          ) : feed.length > 0 ? (
            feed.slice(0, 8).map((g) => (
              <Link
                key={g.genId}
                href={`/fitting/new?${new URLSearchParams({ apparel: (g.apparel ?? []).join(','), background: g.background ?? '' }).toString()}`}
                className="w-32 shrink-0 overflow-hidden rounded-card border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt="" className="h-40 w-full object-cover" />
              </Link>
            ))
          ) : (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex h-40 w-32 shrink-0 items-center justify-center rounded-card border bg-surface text-2xl opacity-30">
                🐶
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 굿즈 라인업 ── */}
      <section className="flex flex-col gap-3">
        <SectionHead title={tg('lineup')} href="/collection" cta={tg('more')} />
        <div className="grid grid-cols-2 gap-3">
          {GOODS.map((g) => (
            <Link key={g.goodsId} href="/collection" className="flex flex-col gap-2">
              <div className="flex aspect-square items-center justify-center rounded-card border bg-surface text-2xl opacity-30">
                🎁
              </div>
              <div className="px-0.5">
                <p className="text-sm font-medium">{goodsName(g.goodsId)}</p>
                <p className="text-xs text-text-muted">{tg('priceFrom', { price: g.priceKrw.toLocaleString() })}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickItem({ href, icon, label }: { href: string; icon: 'create' | 'apparel' | 'goods' | 'orders'; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 rounded-control px-1 py-2.5 text-center transition-colors hover:bg-surface">
      <NavIcon name={icon} width={22} height={22} />
      <span className="text-[11px] leading-tight text-text-secondary">{label}</span>
    </Link>
  );
}

function SectionHead({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-xs text-text-muted hover:text-text-primary">
        {cta} ›
      </Link>
    </div>
  );
}
