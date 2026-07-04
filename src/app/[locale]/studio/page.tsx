import { setRequestLocale } from 'next-intl/server';
import { StudioClient } from './studio-client';

export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StudioClient />;
}
