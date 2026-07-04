import { setRequestLocale } from 'next-intl/server';
import { FeedClient } from './feed-client';

// 홈 = 피드 (06 §1). 공개 작품이 없으면 히어로+CTA.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FeedClient />;
}
