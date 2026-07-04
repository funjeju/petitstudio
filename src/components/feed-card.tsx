'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { GenerationDoc } from '@/lib/types';
import { ShareButton } from './share-button';

/**
 * 피드 카드 (DESIGN.md §6, 06 §1 Zone4).
 * 이미지가 주인공 → 이미지 90%. "내 아이에게 입혀보기" 버튼이 시각 우선.
 */
export function FeedCard({ gen }: { gen: GenerationDoc }) {
  const t = useTranslations('feed');

  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-card border bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gen.imageUrl}
        alt=""
        loading="lazy"
        className="w-full object-cover"
      />
      <div className="flex flex-col gap-3 p-3">
        {gen.apparel?.length ? (
          <div className="flex flex-wrap gap-1">
            {gen.apparel.slice(0, 4).map((a) => (
              <span key={a} className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-text-muted">
                {a}
              </span>
            ))}
          </div>
        ) : null}

        <Link
          href={`/fitting/new?${new URLSearchParams({
            apparel: (gen.apparel ?? []).join(','),
            background: gen.background ?? '',
          }).toString()}`}
          className="rounded-control bg-accent px-3 py-2 text-center text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          {t('tryOnMine')}
        </Link>

        <ShareButton url={gen.imageUrl} />
      </div>
    </article>
  );
}
