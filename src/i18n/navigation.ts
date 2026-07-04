import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 로케일 인지 Link/router — 앱 내부 네비게이션은 이걸 사용.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
