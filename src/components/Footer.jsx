import { club, navLinks } from "../data/club";
import ClubLogo from "./ClubLogo";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { ArrowUp, Discord, Instagram } from "./Icons";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <a href="#home" className="wordmark">
            <ClubLogo />
            <span>
              OTHS <span className="wordmark-muted">CAD CLUB</span>
            </span>
          </a>
          <p>{club.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <ul className="footer-links" role="list">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="footer-social" role="list" aria-label="Club social links">
          <li>
            <a href={CLUB_LINKS.discord} {...external}>
              <Discord />
              Discord
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a href={CLUB_LINKS.instagram} {...external}>
              <Instagram />
              @oths.cad
              <span className="sr-only"> on Instagram (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>

      <div className="shell footer-meta">
        <p>
          © {new Date().getFullYear()} {club.name}
        </p>
        <a href="#home" className="back-to-top">
          Back to top
          <ArrowUp />
        </a>
      </div>
    </footer>
  );
}
