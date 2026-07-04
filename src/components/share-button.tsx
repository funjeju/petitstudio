'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * SNS 공유 (06 §7). Web Share API 있으면 네이티브 시트, 없으면 링크 복사.
 * 다운로드도 함께 제공(생성물 소장).
 */
export function ShareButton({ url, title }: { url: string; title?: string }) {
  const t = useTranslations('share');
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const shareData = { title: title ?? 'petit studio', url };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* 취소 시 무시 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 실패 무시 */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void onShare()}
        className="rounded-control border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
      >
        {copied ? t('copied') : t('share')}
      </button>
      <a
        href={url}
        download
        target="_blank"
        rel="noreferrer"
        className="rounded-control border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
      >
        {t('download')}
      </a>
    </div>
  );
}
