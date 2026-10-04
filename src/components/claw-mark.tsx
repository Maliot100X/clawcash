export function ClawMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="var(--color-ember)" d="M6.4 25.2c1.15-7.4 3.15-13.6 5.7-18.2.85 5.6-.15 11.6-1.95 18.2H6.4z" />
      <path fill="var(--color-bone)" d="M13.1 26.1c1.35-8.5 3.7-15.5 6.55-20.4.9 6.4-.05 13.2-2.25 20.4h-4.3z" />
      <path fill="var(--color-gold)" d="M20.6 24.6c1.05-6.5 2.95-11.8 5.15-15.6.7 4.7.05 9.8-1.55 15.6h-3.6z" />
    </svg>
  );
}

export function XMark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
