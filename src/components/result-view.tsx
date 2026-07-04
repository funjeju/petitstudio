'use client';

import { useTranslations } from 'next-intl';
import { ShareButton } from './share-button';

/** 생성 결과 표시 + 공유/다운로드. */
export function ResultView({ url, caption }: { url: string; caption?: string }) {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={caption ?? ''} className="w-full max-w-md rounded-card border" />
      {caption && <p className="text-sm text-text-secondary">{caption}</p>}
      <ShareButton url={url} title={caption} />
      <span className="text-xs text-text-muted">{t('autoSaved')}</span>
    </div>
  );
}
