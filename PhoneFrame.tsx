import type { ReactNode } from 'react';

/** Cosmetic only — the demo chrome that makes this read as an in-app surface. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone">
      <div className="island" />
      <div className="statusbar">
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <Signal />
          <Wifi />
          <Battery />
        </span>
      </div>
      {children}
      <div className="home-indicator" />
    </div>
  );
}

function Signal() {
  return (
    <svg width="19" height="13" viewBox="0 0 19 13" fill="currentColor" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 5} y={9 - i * 3} width="3.2" height={4 + i * 3} rx="1" />
      ))}
    </svg>
  );
}

function Wifi() {
  return (
    <svg width="17" height="13" viewBox="0 0 17 13" fill="none" aria-hidden>
      <path d="M1 4.2a11 11 0 0 1 15 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 7.4a6.6 6.6 0 0 1 9 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8.5" cy="10.8" r="1.6" fill="currentColor" />
    </svg>
  );
}

function Battery() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
      <rect x="0.6" y="0.6" width="22" height="11.8" rx="3.4" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" />
      <rect x="2.2" y="2.2" width="18.8" height="8.6" rx="2.2" fill="currentColor" />
      <path d="M24.2 4.6v3.8a2 2 0 0 0 0-3.8Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}
