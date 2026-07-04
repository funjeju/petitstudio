import { setRequestLocale } from 'next-intl/server';
import { CreateClient } from './create-client';

export default async function CreatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CreateClient />;
}
