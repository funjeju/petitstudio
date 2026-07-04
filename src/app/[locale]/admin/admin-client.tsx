'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { authedFetch } from '@/lib/api-client';
import type { AdminConfigDoc, Tier } from '@/lib/types';

// 어드민 대시보드(07 문서). 내부 도구라 문자열은 한국어 고정(비다국어).
interface Metrics {
  period: string;
  users: { total: number; free: number; pro: number; vip: number };
  generations: number;
  cost: { monthUsd: number; monthKrw: number; monthCount: number; allTimeUsd: number; allTimeKrw: number };
  capUsd: number;
  capUsedPct: number;
}
interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  tier: Tier;
  role: string;
  credits?: { limit: number; used: number };
}

export function AdminClient() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [config, setConfig] = useState<AdminConfigDoc | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadAll = useCallback(async () => {
    const res = await authedFetch('/api/admin/metrics');
    if (res.status === 403) return setStatus('denied');
    if (!res.ok) return setStatus('denied');
    setStatus('ok');
    setMetrics(await res.json());
    const [c, u] = await Promise.all([
      authedFetch('/api/admin/config').then((r) => (r.ok ? r.json() : null)),
      authedFetch('/api/admin/users').then((r) => (r.ok ? r.json() : { users: [] })),
    ]);
    setConfig(c);
    setUsers(u.users ?? []);
  }, []);

  useEffect(() => {
    if (user) void loadAll();
  }, [user, loadAll]);

  async function bootstrap() {
    const res = await authedFetch('/api/admin/bootstrap', { method: 'POST' });
    if (res.ok) void loadAll();
    else alert('승격 불가 (ADMIN_EMAIL 불일치)');
  }

  if (loading) return <p className="py-16 text-center text-sm text-text-muted">…</p>;
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <button onClick={() => void signInWithGoogle()} className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-on-accent">
          로그인
        </button>
      </div>
    );
  }
  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-text-secondary">어드민 권한이 없습니다.</p>
        <button onClick={() => void bootstrap()} className="rounded-control border px-4 py-2 text-sm">
          ADMIN_EMAIL 이면 승격
        </button>
      </div>
    );
  }
  if (status === 'checking') return <p className="py-16 text-center text-sm text-text-muted">확인 중…</p>;

  return (
    <div className="flex flex-col gap-8 py-4">
      <h1 className="text-xl font-semibold">어드민 · {metrics?.period}</h1>

      {/* 지표 */}
      {metrics && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="가입자" value={metrics.users.total} sub={`무료 ${metrics.users.free} · Pro ${metrics.users.pro} · VIP ${metrics.users.vip}`} />
          <Stat label="총 생성" value={metrics.generations} />
          <Stat
            label="이번 달 원가"
            value={`${metrics.cost.monthKrw.toLocaleString()}원`}
            sub={`$${metrics.cost.monthUsd.toFixed(2)} · ${metrics.cost.monthCount}건`}
          />
          <Stat
            label="총액 상한"
            value={`${metrics.capUsedPct}%`}
            sub={`/ $${metrics.capUsd} kill switch`}
            warn={metrics.capUsedPct >= 80}
          />
        </section>
      )}

      {/* 설정 */}
      {config && <ConfigForm config={config} onSaved={setConfig} />}

      {/* 회원 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-text-secondary">회원 ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-2 pr-3">이메일</th>
                <th className="py-2 pr-3">등급</th>
                <th className="py-2 pr-3">크레딧</th>
                <th className="py-2">역할</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.uid} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 어패럴 카탈로그 */}
      <ApparelManager />
    </div>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-card border p-3 ${warn ? 'border-red-400' : ''}`}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${warn ? 'text-red-500' : ''}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}

function ConfigForm({ config, onSaved }: { config: AdminConfigDoc; onSaved: (c: AdminConfigDoc) => void }) {
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await authedFetch('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify({
        defaultQuality: form.defaultQuality,
        tierLimits: form.tierLimits,
        monthlyCostCapUsd: form.monthlyCostCapUsd,
        usdKrw: form.usdKrw,
      }),
    });
    if (res.ok) onSaved(await res.json());
    setSaving(false);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">생성 설정</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Labeled label="기본 품질">
          <select
            value={form.defaultQuality}
            onChange={(e) => setForm({ ...form, defaultQuality: e.target.value as AdminConfigDoc['defaultQuality'] })}
            className="input"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </Labeled>
        {(['free', 'pro', 'vip'] as Tier[]).map((tier) => (
          <Labeled key={tier} label={`${tier} 한도`}>
            <input
              type="number"
              value={form.tierLimits[tier]}
              onChange={(e) => setForm({ ...form, tierLimits: { ...form.tierLimits, [tier]: Number(e.target.value) } })}
              className="input"
            />
          </Labeled>
        ))}
        <Labeled label="총액 상한($)">
          <input
            type="number"
            value={form.monthlyCostCapUsd}
            onChange={(e) => setForm({ ...form, monthlyCostCapUsd: Number(e.target.value) })}
            className="input"
          />
        </Labeled>
        <Labeled label="환율(USD/KRW)">
          <input
            type="number"
            value={form.usdKrw}
            onChange={(e) => setForm({ ...form, usdKrw: Number(e.target.value) })}
            className="input"
          />
        </Labeled>
      </div>
      <button onClick={() => void save()} disabled={saving} className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-50">
        {saving ? '저장 중…' : '설정 저장'}
      </button>
    </section>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const [tier, setTier] = useState<Tier>(user.tier);
  async function changeTier(next: Tier) {
    setTier(next);
    await authedFetch('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ uid: user.uid, tier: next }) });
  }
  return (
    <tr className="border-t">
      <td className="py-2 pr-3">{user.email}</td>
      <td className="py-2 pr-3">
        <select value={tier} onChange={(e) => void changeTier(e.target.value as Tier)} className="rounded-control border bg-bg px-2 py-1 text-xs">
          <option value="free">free</option>
          <option value="pro">pro</option>
          <option value="vip">vip</option>
        </select>
      </td>
      <td className="py-2 pr-3 text-text-muted">
        {user.credits ? `${user.credits.used}/${user.credits.limit}` : '-'}
      </td>
      <td className="py-2 text-text-muted">{user.role}</td>
    </tr>
  );
}

function ApparelManager() {
  const [list, setList] = useState<{ apparelId: string; anchor: string; promptFragment: string }[]>([]);
  const [form, setForm] = useState({ apparelId: '', category: 'accessory', anchor: 'head', nameKo: '', nameEn: '', promptFragment: '' });

  const load = useCallback(async () => {
    const r = await authedFetch('/api/admin/apparel');
    if (r.ok) setList((await r.json()).apparel ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!form.apparelId) return;
    const res = await authedFetch('/api/admin/apparel', {
      method: 'POST',
      body: JSON.stringify({
        apparelId: form.apparelId,
        category: form.category,
        anchor: form.anchor,
        nameI18n: { ko: form.nameKo, en: form.nameEn },
        promptFragment: form.promptFragment,
        active: true,
      }),
    });
    if (res.ok) {
      setForm({ ...form, apparelId: '', nameKo: '', nameEn: '', promptFragment: '' });
      void load();
    }
  }
  async function del(id: string) {
    await authedFetch(`/api/admin/apparel?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    void load();
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">어패럴 카탈로그 ({list.length})</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <input placeholder="id (hat_beret)" value={form.apparelId} onChange={(e) => setForm({ ...form, apparelId: e.target.value })} className="input" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
          {['hat', 'outfit', 'accessory', 'season', 'prop'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={form.anchor} onChange={(e) => setForm({ ...form, anchor: e.target.value })} className="input">
          {['head', 'neck', 'body', 'face', 'paw', 'prop'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input placeholder="한국어명" value={form.nameKo} onChange={(e) => setForm({ ...form, nameKo: e.target.value })} className="input" />
        <input placeholder="English" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="input" />
        <input placeholder="prompt fragment (wearing a wool beret)" value={form.promptFragment} onChange={(e) => setForm({ ...form, promptFragment: e.target.value })} className="input md:col-span-3" />
      </div>
      <button onClick={() => void add()} className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent">
        어패럴 추가
      </button>
      <ul className="flex flex-col gap-1 text-sm">
        {list.map((a) => (
          <li key={a.apparelId} className="flex items-center justify-between border-t py-1.5">
            <span>
              <span className="font-medium">{a.apparelId}</span> <span className="text-text-muted">· {a.anchor}</span>
            </span>
            <button onClick={() => void del(a.apparelId)} className="text-xs text-red-500">
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      {children}
    </label>
  );
}
