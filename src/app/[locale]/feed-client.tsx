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
    <div className="flex flex-col gap-4">
      {/* Zone3 필터 칩 (06 §1) — 표시용, 실제 필터링은 후속 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
              active === k ? 'bg-accent text-on-accent' : 'text-text-secondary'
            }`}
          >
            {t(k)}
          </button>
        ))}
      </div>

      {feed === null ? (
        <p className="py-16 text-center text-sm text-text-muted">{th('heroTitle')}…</p>
      ) : feed.length === 0 ? (
        <section className="flex flex-col items-center gap-4 py-16 text-center">
          <h1 className="max-w-xs text-2xl font-bold tracking-tight">{th('heroTitle')}</h1>
          <p className="max-w-sm text-sm text-text-secondary">{th('heroBody')}</p>
          <Link
            href="/create"
            className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent"
          >
            {t('emptyCta')}
          </Link>
        </section>
      ) : (
        // 2열 매소너리(웹은 열 수 증가) — DESIGN.md §5
        <div className="columns-2 gap-4 md:columns-3">
          {feed.map((g) => (
            <FeedCard key={g.genId} gen={g} />
          ))}
        </div>
      )}
    </div>
  );
}
