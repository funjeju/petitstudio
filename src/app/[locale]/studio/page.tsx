import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Placeholder } from '@/components/placeholder';

export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return <Placeholder title={t('studio')} />;
}
