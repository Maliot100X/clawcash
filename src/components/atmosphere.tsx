export function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="mote top-16 right-[12%] opacity-80" />
      <span className="mote top-40 left-[8%] opacity-50" style={{ animationDelay: "-2.4s", background: "var(--color-gold)", boxShadow: "0 0 12px var(--color-gold)" }} />
      <span className="mote top-72 right-[28%] opacity-40" style={{ animationDelay: "-4s" }} />
    </div>
  );
}
