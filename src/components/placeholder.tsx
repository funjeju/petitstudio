import { useTranslations } from 'next-intl';

/** Phase 0 자리표시자 — 이후 Phase 2~4에서 실제 화면으로 교체. */
export function Placeholder({ title }: { title: string }) {
  const t = useTranslations('common');
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-text-muted">{t('comingSoon')}</p>
    </section>
  );
}
