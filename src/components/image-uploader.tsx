'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export interface PickedImage {
  file: File;
  previewUrl: string;
}

/**
 * 로컬 이미지 다중 선택 + 미리보기. 실제 업로드는 상위에서 uploadOriginal 로 수행.
 */
export function ImageUploader({
  value,
  onChange,
  max = 3,
}: {
  value: PickedImage[];
  onChange: (imgs: PickedImage[]) => void;
  max?: number;
}) {
  const t = useTranslations('create');
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  function addFiles(files: FileList | null) {
    if (!files) return;
    setError('');
    const next = [...value];
    for (const file of Array.from(files)) {
      if (next.length >= max) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        setError(t('tooLarge'));
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    onChange(next);
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {value.map((img, i) => (
          <div key={img.previewUrl} className="relative aspect-square overflow-hidden rounded-control border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              aria-label="remove"
            >
              ×
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-control border border-dashed text-2xl text-text-muted hover:text-text-primary"
          >
            +
          </button>
        )}
      </div>
      <p className="text-xs text-text-muted">{t('uploadHint', { max })}</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}
