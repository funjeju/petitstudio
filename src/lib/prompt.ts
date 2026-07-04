/**
 * 프롬프트 오케스트레이션 — image-edit-orchestration 스킬 / 04_IMAGE_GENERATION.md.
 * 순수 함수(서버에서 호출). 유저 입력은 반드시 sanitize.
 */
import type { Species } from './types';

/** sanitize/정책 위반 시 던지는 에러 → 라우트에서 400 매핑. */
export class PromptError extends Error {}

/**
 * 유저 텍스트 sanitize (04 §4 프롬프트 보안).
 * - 제어문자/괄호/백틱 제거(프롬프트 인젝션 완화)
 * - 300자 상한
 * - 금지 패턴(실존 인물·저작권 IP·유해) 검출 시 거부
 * 값 목록은 출발점 — 파일럿에서 확장. [확실하지 않음]
 */
const BANNED_PATTERNS: RegExp[] = [
  /\b(nude|naked|nsfw|porn|sexual|gore)\b/i,
  /\b(disney|pixar|pokemon|pikachu|mickey|marvel|nintendo|hello\s*kitty|sanrio)\b/i,
];

export function sanitizeUserPrompt(input?: string): string {
  if (!input) return '';
  const cleaned = input
    .replace(/[<>{}`\\]/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
  for (const re of BANNED_PATTERNS) {
    if (re.test(cleaned)) throw new PromptError('금지된 표현이 포함되어 있습니다.');
  }
  return cleaned;
}

/** 코어 이미지(신규 스튜디오 촬영) 프롬프트 — 04 §2.1. */
export function buildCorePrompt(species: Species, breed?: string): string {
  const subject = breed?.trim() || speciesLabel(species);
  return [
    `professional pet studio portrait of a ${subject}`,
    'soft studio lighting, neutral seamless backdrop',
    'sharp focus, high detail, centered composition, photorealistic',
  ].join(', ');
}

function speciesLabel(species: Species): string {
  switch (species) {
    case 'dog':
      return 'dog';
    case 'cat':
      return 'cat';
    case 'virtual':
      return 'imaginary pet';
    default:
      return 'pet';
  }
}

// 착장 레이어 순서(뒤→앞): body → paw → neck → head → face → prop. (스킬 규칙 2)
const ANCHOR_ORDER: Record<string, number> = {
  body: 0,
  paw: 1,
  neck: 2,
  head: 3,
  face: 4,
  prop: 5,
};

export interface ApparelFragment {
  apparelId: string;
  anchor: string;
  promptFragment: string;
}

/** 같은 anchor 중복 제거(나중 것 우선) 후 레이어 순 정렬. (스킬 규칙 1·2) */
export function orderApparel(items: ApparelFragment[]): ApparelFragment[] {
  const byAnchor = new Map<string, ApparelFragment>();
  for (const it of items) byAnchor.set(it.anchor, it); // 나중 것이 덮어씀
  return [...byAnchor.values()].sort(
    (a, b) => (ANCHOR_ORDER[a.anchor] ?? 99) - (ANCHOR_ORDER[b.anchor] ?? 99),
  );
}

const BACKGROUND_PRESETS: Record<string, string> = {
  sea: 'a serene sea and beach',
  forest: 'a lush green forest',
  city: 'a modern city street',
  living_room: 'a cozy living room',
};

/** 배경 조각 — 프리셋이면 매핑, 아니면 sanitize된 커스텀 텍스트. */
function backgroundFragment(background?: string): string {
  if (!background) return '';
  const preset = BACKGROUND_PRESETS[background];
  const scene = preset ?? sanitizeUserPrompt(background);
  if (!scene) return '';
  return `set against ${scene} scene, natural depth of field, lighting matched to the pet`;
}

/** 피팅룸 edit 프롬프트 — image-edit-orchestration 템플릿.
 * attachedItems=true 면 유저가 첨부한 아이템 이미지(첫 이미지=펫, 이후=아이템)를 반영. */
export function buildFittingPrompt(opts: {
  species: Species;
  apparel: ApparelFragment[];
  background?: string;
  userPrompt?: string;
  attachedItems?: boolean;
}): string {
  const ordered = orderApparel(opts.apparel);
  const fragments = ordered.map((a) => a.promptFragment).filter(Boolean).join(', ');
  const bg = backgroundFragment(opts.background);
  const userText = sanitizeUserPrompt(opts.userPrompt);
  const subject = speciesLabel(opts.species);

  // 장착 대상: 첨부 아이템 이미지 + 카탈로그 프롬프트 조각.
  const dressWith = [
    opts.attachedItems ? 'the apparel/accessory shown in the provided reference image(s)' : '',
    fragments,
  ]
    .filter(Boolean)
    .join(', ');

  return [
    'The first image is the pet; any following images are apparel/accessory items to put on the pet',
    dressWith ? `Edit the pet image: dress the ${subject} with ${dressWith}` : `Edit the pet image`,
    "preserve the pet's face, fur color, markings, and body shape exactly",
    'each item fitted naturally to the correct body part, correct proportions and scale, not floating',
    'consistent lighting and perspective with the subject, seamless photorealistic blend',
    bg,
    userText,
    'Studio-quality, photorealistic',
  ]
    .filter(Boolean)
    .join('; ');
}

export interface VirtualRecipe {
  parts: string[]; // 예: ['사모예드', '아기판다']
  extras?: string[]; // 예: ['유니콘 뿔']
}

/** 가상 펫 합성 프롬프트 — 04 §2.4. parts/extras 는 sanitize. */
export function buildVirtualPetPrompt(recipe: VirtualRecipe): string {
  const parts = (recipe.parts ?? []).map((p) => sanitizeUserPrompt(p)).filter(Boolean);
  if (parts.length === 0) throw new PromptError('가상 펫 구성 요소(parts)가 필요합니다.');
  const extras = (recipe.extras ?? []).map((e) => sanitizeUserPrompt(e)).filter(Boolean);

  return [
    `a photorealistic imaginary pet blending ${parts.join(', ')}`,
    extras.length ? `with ${extras.join(', ')}` : '',
    'coherent single creature, believable anatomy',
    'studio portrait, neutral seamless backdrop, soft lighting, photorealistic',
  ]
    .filter(Boolean)
    .join('; ');
}
