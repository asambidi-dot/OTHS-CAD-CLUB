import { faqs } from "../data/club";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { ArrowUpRight, Plus } from "./Icons";

export default function Faq() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="shell faq">
        <header className="faq-head">
          <h2 id="faq-title" className="section-title">
            Frequently asked questions
          </h2>
          <p className="section-lede">
            Anything else? Ask in the{" "}
            <a className="text-link" href={CLUB_LINKS.discord} {...external}>
              Discord
              <ArrowUpRight />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </header>

        <ul className="accordion" role="list">
          {faqs.map((item) => (
            <li key={item.question}>
              <details className="accordion-item faq-item">
                <summary>
                  <span className="faq-question">{item.question}</span>
                  <span className="accordion-toggle" aria-hidden="true">
                    <Plus />
                  </span>
                </summary>
                <p className="faq-answer">{item.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
