/* A fixed square that centres a 24-unit icon; every framed icon shares it. */
export function IconFrame({ children, className = "" }) {
  return (
    <span className={`icon-frame ${className}`.trim()} aria-hidden="true">
      {children}
    </span>
  );
}
