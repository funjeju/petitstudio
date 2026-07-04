import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations('home');
  return (
    <section className="flex flex-col items-start gap-6 py-12">
      <p className="text-sm text-text-secondary">petit studio</p>
      <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {t('heroTitle')}
      </h1>
      <p className="max-w-md text-text-secondary">{t('heroBody')}</p>
      <Link
        href="/create"
        className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
      >
        {t('cta')}
      </Link>
    </section>
  );
}
