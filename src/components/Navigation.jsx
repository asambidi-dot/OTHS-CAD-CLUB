import { useEffect, useRef, useState } from "react";
import { navLinks } from "../data/club";
import { useActiveSection } from "../hooks/useActiveSection";
import ClubLogo from "./ClubLogo";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { Discord } from "./Icons";

const sectionIds = ["home", ...navLinks.map((link) => link.id)];

function JoinButton({ className = "", onClick }) {
  return (
    <a
      className={`button button-primary ${className}`.trim()}
      href={CLUB_LINKS.discord}
      onClick={onClick}
      {...external}
    >
      <Discord />
      Join the club
      <span className="sr-only"> on Discord (opens in a new tab)</span>
    </a>
  );
}

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(sectionIds);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the mobile menu is open: Escape, an outside tap, or growing to desktop closes it.
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onPointer = (event) => {
      if (!navRef.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 901px)");
    const onResize = (event) => event.matches && setOpen(false);

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`nav-wrap${scrolled ? " is-scrolled" : ""}`}>
      <nav ref={navRef} className="navigation shell" aria-label="Main" data-open={open}>
        <div className="nav-bar">
          <a href="#home" className="wordmark" onClick={close}>
            <ClubLogo />
            <span>
              OTHS <span className="wordmark-muted">CAD CLUB</span>
            </span>
          </a>

          <ul className="nav-links" role="list">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} aria-current={active === link.id ? "true" : undefined}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <JoinButton className="button-small nav-cta" />

          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>

        <div id="mobile-menu" className="mobile-menu" inert={!open}>
          <div className="mobile-menu-inner">
            <ul role="list">
              {navLinks.map((link, i) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={close}
                    aria-current={active === link.id ? "true" : undefined}
                  >
                    <span className="mobile-index" aria-hidden="true">
                      0{i + 1}
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <JoinButton onClick={close} />
          </div>
        </div>
      </nav>
    </header>
  );
}
