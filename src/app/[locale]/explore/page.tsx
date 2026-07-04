import { setRequestLocale } from 'next-intl/server';
import { ExploreClient } from './explore-client';

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExploreClient />;
}
