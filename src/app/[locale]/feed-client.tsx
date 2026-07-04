'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { fetchFeed } from '@/lib/client-data';
import type { GenerationDoc } from '@/lib/types';
import { FeedCard } from '@/components/feed-card';

const FILTER_KEYS = ['filterRecommended', 'filterFollowing', 'filterSeason', 'filterStyle', 'filterLab'] as const;

export function FeedClient() {
  const t = useTranslations('feed');
  const th = useTranslations('home');
  const [feed, setFeed] = useState<GenerationDoc[] | null>(null);
  const [active, setActive] = useState<(typeof FILTER_KEYS)[number]>('filterRecommended');

  useEffect(() => {
    fetchFeed()
      .then(setFeed)
      .catch(() => setFeed([]));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Zone1 — 검색 */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">⌕</span>
        <input
          type="search"
          placeholder={t('search')}
          className="w-full rounded-full border bg-surface py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-text-muted focus:border-text-secondary"
        />
      </div>

      {/* Zone2 — 개인화 스트립 */}
      <Link
        href="/create"
        className="flex items-center justify-between rounded-card border bg-surface px-4 py-3.5 transition-colors hover:border-text-secondary"
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-text-muted">{th('eyebrow')}</p>
          <p className="truncate text-sm font-medium">{th('strip')}</p>
        </div>
        <span className="ml-3 shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent">
          {th('stripCta')} →
        </span>
      </Link>

      {/* Zone3 — 필터 칩 (표시용) */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTER_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active === k
                ? 'border-accent bg-accent text-on-accent'
                : 'text-text-secondary hover:border-text-secondary'
            }`}
          >
            {t(k)}
          </button>
        ))}
      </div>

      {/* Zone4 — 피드 / 빈 상태 */}
      {feed === null ? (
        <FeedSkeleton />
      ) : feed.length === 0 ? (
        <EmptyHero />
      ) : (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
          {feed.map((g) => (
            <FeedCard key={g.genId} gen={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  const heights = ['h-56', 'h-72', 'h-64', 'h-80', 'h-52', 'h-72'];
  return (
    <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
      {heights.map((h, i) => (
        <div key={i} className={`mb-4 ${h} animate-pulse break-inside-avoid rounded-card bg-surface`} />
      ))}
    </div>
  );
}

function EmptyHero() {
  const th = useTranslations('home');
  const steps = [
    { n: '1', title: th('step1Title'), body: th('step1Body') },
    { n: '2', title: th('step2Title'), body: th('step2Body') },
    { n: '3', title: th('step3Title'), body: th('step3Body') },
  ];
  return (
    <section className="flex flex-col items-center gap-10 py-10">
      <div className="flex max-w-lg flex-col items-center gap-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{th('eyebrow')}</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {th('heroTitle')}
        </h1>
        <p className="text-text-secondary">{th('heroBody')}</p>
        <Link
          href="/create"
          className="mt-1 rounded-control bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          {th('cta')}
        </Link>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col gap-2 rounded-card border bg-surface p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs text-text-secondary">
              {s.n}
            </span>
            <p className="text-sm font-medium">{s.title}</p>
            <p className="text-xs leading-relaxed text-text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
