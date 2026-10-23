import { club } from "../data/club";
import CADHero3D from "./CADHero3D";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { ArrowRight, Discord } from "./Icons";

export default function Hero() {
  return (
    <section className="hero-section" id="home" aria-labelledby="hero-title">
      <div className="hero-backdrop" aria-hidden="true" />

      <div className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">OTHS CAD CLUB</p>

          <h1 id="hero-title">
            <span className="line">Design it.</span>
            <span className="line accent">Build it.</span>
            <span className="line">Change it.</span>
          </h1>

          <p className="hero-description">
            Turn your ideas into 3D designs. Learn computer-aided design, tackle
            creative challenges, and build alongside other students. All skill
            levels welcome.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href={CLUB_LINKS.discord} {...external}>
              <Discord />
              Join the club
              <span className="sr-only"> on Discord (opens in a new tab)</span>
            </a>
            <a className="button button-secondary" href="#projects">
              Explore projects
              <ArrowRight />
            </a>
          </div>

          <p className="tagline">{club.tagline}</p>
        </div>

        <div className="hero-visual">
          <CADHero3D />
        </div>
      </div>
    </section>
  );
}
