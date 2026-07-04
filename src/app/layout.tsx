import type { ReactNode } from 'react';

// 루트 레이아웃은 통과만 — 실제 <html>/<body> 는 [locale]/layout 에서 렌더(next-intl 패턴).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
