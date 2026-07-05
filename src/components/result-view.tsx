'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShareButton } from './share-button';

/** 생성 결과 표시 + 공유/다운로드. 이미지 클릭 시 모달 확대 + 다운로드. */
export function ResultView({ url, caption }: { url: string; caption?: string }) {
  const t = useTranslations('common');
  const ts = useTranslations('share');
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <button type="button" onClick={() => setOpen(true)} className="w-full max-w-md cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={caption ?? ''} className="w-full rounded-card border" />
      </button>
      {caption && <p className="text-sm text-text-secondary">{caption}</p>}
      <ShareButton url={url} title={caption} />
      <span className="text-xs text-text-muted">{t('autoSaved')}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="max-h-[80vh] max-w-full rounded-card" onClick={(e) => e.stopPropagation()} />
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black"
          >
            {ts('download')}
          </a>
        </div>
      )}
    </div>
  );
}
