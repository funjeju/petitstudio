'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchFeed } from '@/lib/client-data';
import { GOODS, getGoods } from '@/lib/goods';
import type { GenerationDoc } from '@/lib/types';
import { NavIcon } from '@/components/icons';

/**
 * 홈 — 시안 3(PAWFOLIO, 모던 & 미니멀). 모바일 우선이되 데스크톱은 폭을 채우는 반응형.
 * 히어로(2단) → 퀵메뉴 → 피팅룸 들러보기 → 굿즈 라인업.
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
  const looks = ['/samples/look1.png', '/samples/look2.png', '/samples/look3.png', '/samples/look4.png'];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      {/* ── 히어로 (2단, 따뜻한 톤) ── */}
      <section className="grid items-stretch gap-6 overflow-hidden rounded-card bg-point-soft p-6 sm:p-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:p-10">
        <div className="flex flex-col justify-center gap-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-point">{t('eyebrow')}</p>
          <h1 className="whitespace-pre-line text-3xl font-bold leading-[1.12] tracking-tight text-text-primary lg:text-[2.7rem]">
            {t('heroTitle')}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-text-secondary lg:text-base">{t('heroSub')}</p>
          <Link
            href="/create"
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent shadow-sm transition-opacity hover:opacity-90"
          >
            {t('ctaCore')} <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="relative min-h-[240px] overflow-hidden rounded-card lg:min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/samples/hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </section>

      {/* ── 퀵메뉴 (좁게 그룹핑, 아이콘 도형 배경) ── */}
      <nav className="mx-auto grid w-full max-w-xl grid-cols-4 gap-1 sm:gap-3">
        <QuickItem href="/create" icon="create" label={t('quickCore')} />
        <QuickItem href="/fitting/new" icon="apparel" label={t('quickFitting')} />
        <QuickItem href="/collection" icon="goods" label={t('quickGoods')} />
        <QuickItem href="/studio" icon="orders" label={t('quickOrders')} />
      </nav>

      {/* ── 피팅룸 들러보기 ── */}
      <section className="flex flex-col gap-4">
        <SectionHead title={tf('peek')} href="/explore" cta={tf('seeAll')} />
        <div className="flex flex-wrap gap-2">
          {(['catAll', 'catHat', 'catOutfit', 'catAccessory', 'catSeason', 'catProp'] as const).map((k, i) => (
            <span
              key={k}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs ${
                i === 0 ? 'border-accent bg-accent text-on-accent' : 'text-text-secondary'
              }`}
            >
              {tf(k)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {feed === null
            ? [0, 1, 2, 3].map((i) => <Placeholder key={i} className="aspect-[4/5]" pulse />)
            : feed.length > 0
              ? feed.slice(0, 8).map((g) => (
                  <Link
                    key={g.genId}
                    href={`/fitting/new?${new URLSearchParams({ apparel: (g.apparel ?? []).join(','), background: g.background ?? '' }).toString()}`}
                    className="group overflow-hidden rounded-card border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.imageUrl} alt="" className="aspect-[4/5] w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  </Link>
                ))
              : looks.map((src, i) => (
                  <Link key={i} href="/create" className="group overflow-hidden rounded-card border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-[4/5] w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  </Link>
                ))}
        </div>
      </section>

      {/* ── 굿즈 라인업 ── */}
      <section className="flex flex-col gap-4">
        <SectionHead title={tg('lineup')} href="/collection" cta={tg('more')} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {GOODS.map((g, i) => (
            <Link key={g.goodsId} href="/collection" className="group flex flex-col gap-2">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-card border bg-surface p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={looks[i % looks.length]} alt="" className="h-full w-full rounded-sm object-cover shadow-sm" />
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

function Placeholder({ className = '', glyph, pulse }: { className?: string; glyph?: string; pulse?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-card border bg-bg ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {glyph && (
        <span className="text-3xl opacity-25" aria-hidden>
          {glyph}
        </span>
      )}
    </div>
  );
}

function QuickItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: 'create' | 'apparel' | 'goods' | 'orders';
  label: string;
}) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2 py-2 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-point-soft text-text-primary transition-colors group-hover:bg-point group-hover:text-white">
        <NavIcon name={icon} width={26} height={26} />
      </span>
      <span className="text-xs font-medium leading-tight text-text-primary">{label}</span>
    </Link>
  );
}

function SectionHead({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-xs text-text-muted hover:text-text-primary">
        {cta} ›
      </Link>
    </div>
  );
}
