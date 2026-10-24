import type { Listing } from '@workspace/api-client-react';

export const IMG = (p: string) => `${import.meta.env.BASE_URL}images/${p}`;

export const MARKET_LABEL: Record<string, string> = {
  india_compliance: 'India compliance (CCTS)',
  india_offset: 'India offset',
  voluntary: 'Voluntary',
  authorised: 'Authorised',
};
export const ACTION_LABEL: Record<string, string> = {
  removal: 'Removal',
  reduction: 'Reduction',
  avoidance: 'Avoidance',
};
export const STATUS_LABEL: Record<string, string> = {
  future: 'Future',
  issued: 'Issued',
  retired: 'Retired',
};

export function marketTone(m: string) {
  return m === 'india_compliance' || m === 'india_offset' ? 'registry' : m === 'authorised' ? 'soil' : 'forest';
}
export function actionTone(a: string) {
  return a === 'removal' ? 'leaf' : a === 'reduction' ? 'forest' : 'soil';
}
export function statusTone(s: string) {
  return s === 'future' ? 'marigold' : s === 'issued' ? 'forest' : 'ink';
}

export const inr = (n: number) => `Rs ${Math.round(n).toLocaleString('en-IN')}`;
export const num = (n: number) => n.toLocaleString('en-IN');

export function errMsg(e: unknown, fallback = 'Something went wrong. Please try again.') {
  if (!e) return fallback;
  const any = e as { data?: unknown; message?: string };
  const d = any.data as { message?: string; error?: string } | null | undefined;
  if (d && typeof d === 'object') {
    if (typeof d.message === 'string') return d.message;
    if (typeof d.error === 'string') return d.error;
  }
  return any.message || fallback;
}
export function errStatus(e: unknown): number | undefined {
  return (e as { status?: number } | null)?.status;
}

export function canBuy(l: Listing) {
  return l.status === 'issued';
}

export function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return s;
  }
}
