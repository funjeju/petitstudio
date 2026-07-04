'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { authedFetch } from '@/lib/api-client';
import { fetchMyPets, fetchMyCores, fetchMyGenerations } from '@/lib/client-data';
import type { CoreImageDoc, GenerationDoc, PetDoc } from '@/lib/types';

interface Usage {
  tier: string;
  role?: string;
  credits: { limit: number; used: number };
  remaining: number;
}

export function StudioClient() {
  const t = useTranslations('studio');
  const ta = useTranslations('auth');
  const { user, loading, signInWithGoogle } = useAuth();

  const [usage, setUsage] = useState<Usage | null>(null);
  const [pets, setPets] = useState<PetDoc[]>([]);
  const [cores, setCores] = useState<CoreImageDoc[]>([]);
  const [gens, setGens] = useState<GenerationDoc[]>([]);

  const load = useCallback(async (uid: string) => {
    const [u, p, c, g] = await Promise.all([
      authedFetch('/api/me/usage').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchMyPets(uid).catch(() => []),
      fetchMyCores(uid).catch(() => []),
      fetchMyGenerations(uid).catch(() => []),
    ]);
    setUsage(u);
    setPets(p);
    setCores(c);
    setGens(g);
  }, []);

  useEffect(() => {
    if (user) void load(user.uid);
  }, [user, load]);

  async function onDelete(collectionName: 'coreImages' | 'generations', id: string) {
    const res = await authedFetch('/api/image/delete', {
      method: 'POST',
      body: JSON.stringify({ collection: collectionName, id }),
    });
    if (res.ok) {
      if (collectionName === 'coreImages') setCores((prev) => prev.filter((c) => c.coreId !== id));
      else setGens((prev) => prev.filter((g) => g.genId !== id));
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-text-muted">…</p>;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent"
        >
          {ta('signInWithGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        {usage?.role === 'admin' && (
          <Link href="/admin" className="rounded-control border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">
            어드민
          </Link>
        )}
      </div>

      {/* 크레딧 */}
      {usage && (
        <section className="rounded-card border bg-surface p-4">
          <p className="text-sm text-text-secondary">
            {t('credits')} · <span className="uppercase">{usage.tier}</span>
          </p>
          <p className="mt-1 text-lg font-semibold">
            {t('remaining', { remaining: usage.remaining, limit: usage.credits.limit })}
          </p>
        </section>
      )}

      {/* 마이펫 */}
      <Section title={t('myPets')}>
        {pets.length === 0 ? (
          <Empty text={t('noPets')} />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {pets.map((p) => (
              <li key={p.petId} className="rounded-full border px-3 py-1 text-sm">
                {p.name}
                {p.breed ? <span className="text-text-muted"> · {p.breed}</span> : null}
                {p.isVirtual ? <span className="ml-1 text-text-muted">✦</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 코어 이미지 */}
      <Section title={t('myCores')}>
        {cores.length === 0 ? (
          <Empty text={t('empty')} />
        ) : (
          <Grid>
            {cores.map((c) => (
              <Thumb
                key={c.coreId}
                url={c.imageUrl}
                href={`/fitting/${c.coreId}`}
                onDelete={() => void onDelete('coreImages', c.coreId)}
                deleteLabel={t('delete')}
              />
            ))}
          </Grid>
        )}
      </Section>

      {/* 내 작품 */}
      <Section title={t('myGenerations')}>
        {gens.length === 0 ? (
          <Empty text={t('empty')} />
        ) : (
          <Grid>
            {gens.map((g) => (
              <Thumb
                key={g.genId}
                url={g.imageUrl}
                onDelete={() => void onDelete('generations', g.genId)}
                deleteLabel={t('delete')}
              />
            ))}
          </Grid>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-text-muted">{text}</p>;
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{children}</div>;
}

function Thumb({
  url,
  href,
  onDelete,
  deleteLabel,
}: {
  url: string;
  href?: string;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-full w-full object-cover" />
  );
  return (
    <div className="group relative aspect-square overflow-hidden rounded-card border">
      {href ? (
        <Link href={href} className="block h-full w-full">
          {img}
        </Link>
      ) : (
        img
      )}
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        {deleteLabel}
      </button>
    </div>
  );
}
