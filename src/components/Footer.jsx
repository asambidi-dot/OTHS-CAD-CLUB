import { club, navLinks } from "../data/club";
import ClubLogo from "./ClubLogo";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { ArrowUp, Discord, Instagram } from "./Icons";

export default function Footer({ onHomePage = true }) {
  const base = import.meta.env.BASE_URL;
  const home = onHomePage ? "" : base;

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-top">
          <div className="footer-brand">
            <a href={`${home}#home`} className="wordmark">
              <ClubLogo size={30} />
              <span>
                OTHS <span className="wordmark-muted">CAD Club</span>
              </span>
            </a>
            <p>{club.summary}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="footer-links" role="list">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a href={`${home}#${link.id}`}>{link.label}</a>
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

        <div className="footer-meta">
          <p>
            © {new Date().getFullYear()} {club.name}
          </p>
          <ul className="footer-legal" role="list" aria-label="Legal">
            <li>
              <a href={`${base}privacy/`}>Privacy policy</a>
            </li>
            <li>
              <a href={`${base}terms/`}>Terms and conditions</a>
            </li>
          </ul>
          <a href={`${home}#home`} className="back-to-top">
            Back to top
            <ArrowUp />
          </a>
        </div>
      </div>
    </footer>
  );
}
