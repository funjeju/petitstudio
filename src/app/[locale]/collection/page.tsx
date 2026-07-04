import { setRequestLocale } from 'next-intl/server';
import { CollectionClient } from './collection-client';

export default async function CollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CollectionClient />;
}
