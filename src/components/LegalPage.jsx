import { legalPages } from "../data/legal";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import Footer from "./Footer";
import Navigation from "./Navigation";

/* The privacy policy or the terms, with the same navigation and footer as the home page. */
export default function LegalPage({ page }) {
  const { title, updated, intro, sections } = legalPages[page];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Navigation onHomePage={false} />

      <main id="main" className="legal">
        <article className="legal-inner" aria-labelledby="legal-title">
          <h1 id="legal-title" className="legal-title">
            {title}
          </h1>
          <p className="legal-updated">Last updated {updated}</p>
          <p className="legal-intro">{intro}</p>

          {sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {section.discordLink && (
                <p>
                  <a href={CLUB_LINKS.discord} {...external}>
                    Open the club Discord
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              )}
            </section>
          ))}
        </article>
      </main>

      <Footer onHomePage={false} />
    </>
  );
}
