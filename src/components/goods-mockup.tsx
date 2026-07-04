'use client';

/** 굿즈 목업 프레임 (goods-mockup 스킬 §미리보기). 생성 이미지를 상품 맥락에 얹어 표시. */
export function GoodsMockup({ url, goodsId }: { url: string; goodsId: string }) {
  if (!url) {
    return <div className="aspect-[3/4] w-full max-w-xs rounded-card border bg-surface" />;
  }

  if (goodsId === 'phonecase') {
    return (
      <div className="mx-auto w-40">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[6px] border-black bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <span className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/70" />
        </div>
      </div>
    );
  }

  if (goodsId === 'frame') {
    return (
      <div className="mx-auto w-56 rounded-sm border-[10px] border-[#d8d3c8] bg-white p-2 shadow-sm">
        <div className="border p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
        </div>
      </div>
    );
  }

  // 달력(탁상/벽걸이)
  return (
    <div className="mx-auto w-56 overflow-hidden rounded-card border bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
      <div className="grid grid-cols-7 gap-px bg-border p-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="aspect-square bg-white text-[6px] text-text-muted" />
        ))}
      </div>
    </div>
  );
}
