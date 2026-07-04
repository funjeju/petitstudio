'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 불일치 방지: 마운트 후에만 실제 상태 렌더.
  useEffect(() => setMounted(true), []);

  return (
    <div className="inline-flex rounded-control border p-0.5" role="group" aria-label="테마 전환">
      {OPTIONS.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={active}
            className={`rounded-[6px] px-2.5 py-1 text-xs transition-colors ${
              active ? 'bg-accent text-on-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
