import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { FittingClient } from './fitting-client';

export default async function FittingPage({
  params,
}: {
  params: Promise<{ locale: string; coreId: string }>;
}) {
  const { locale, coreId } = await params;
  setRequestLocale(locale);
  // useSearchParams(프리필) 를 쓰므로 Suspense 경계 필요.
  return (
    <Suspense>
      <FittingClient coreId={coreId} />
    </Suspense>
  );
}
