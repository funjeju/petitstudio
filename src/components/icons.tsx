import type { SVGProps } from 'react';

type IconName =
  | 'home'
  | 'explore'
  | 'create'
  | 'collection'
  | 'studio'
  | 'apparel'
  | 'goods'
  | 'orders';

const PATHS: Record<IconName, string> = {
  // 라인 아이콘(모노크롬, 24 그리드) — 미니멀 톤
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  explore: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2 5-5 2 2-5 5-2Z',
  create:
    'M4 8a2 2 0 0 1 2-2h1.2l1-1.5h5.6l1 1.5H16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm8 2.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  collection: 'M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z',
  studio: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  apparel: 'M8.5 4 6 5.5 4 8l2.2 1.6L7 9v11h10V9l.8.6L20 8l-2-2.5L15.5 4a3.5 3.5 0 0 1-7 0Z',
  goods: 'M4 11h16v9H4zM3 7h18v4H3zM12 7V4M12 7c-2 0-4-.5-4-2s2-1.5 4 2c2-3.5 4-3.5 4-2s-2 2-4 2Z',
  orders: 'M3 6h10v10H3zM13 9h4l4 3.5V16h-8zM7.5 18.5a1.8 1.8 0 1 1 0-.1ZM17.5 18.5a1.8 1.8 0 1 1 0-.1Z',
};

export function NavIcon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
