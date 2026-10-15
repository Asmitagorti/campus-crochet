"use client";

import { CrochetFlower } from './YarnDecor';

const card: React.CSSProperties = {
  backgroundColor: '#F7F3EC',
  borderRadius: 18,
  border: '1px solid #EDD4D4',
  padding: '2.5rem 1.5rem',
  textAlign: 'center',
  color: '#7A6058',
};

export function LoadingState({ label }: { label: string }) {
  return (
    <div style={card} aria-live="polite">
      <div style={{ fontSize: '1.75rem', animation: 'spinYarn 1.6s ease-in-out infinite' }}>🧶</div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>{label}…</p>
      <style>{`@keyframes spinYarn { 0%,100% { transform: rotate(-12deg) } 50% { transform: rotate(12deg) } }`}</style>
    </div>
  );
}

export function EmptyState({
  title,
  sub,
  actionLabel,
  onAction,
}: {
  title: string;
  sub: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={{ ...card, borderStyle: 'dashed' }}>
      <CrochetFlower size={36} color="#EDD4D4" />
      <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.15rem', color: '#2E1D15', marginTop: '0.75rem' }}>
        {title}
      </p>
      <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>{sub}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{ marginTop: '1.25rem', backgroundColor: '#C97B63', color: '#FFFDF8', fontWeight: 600, padding: '0.7rem 1.75rem', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ ...card, backgroundColor: '#FDF0EC', border: '1.5px solid #D8A7A7' }} role="alert">
      <p style={{ color: '#A86248', fontWeight: 600, fontSize: '0.92rem' }}>Something didn&apos;t work</p>
      <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: '1rem', padding: '0.55rem 1.5rem', borderRadius: 50, border: 'none', backgroundColor: '#C97B63', color: '#FFFDF8', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
