import { processSteps } from "../data/club";

export default function Process() {
  return (
    <section className="section" id="process" aria-labelledby="process-title">
      <div className="shell">
        <header className="section-head">
          <h2 id="process-title" className="section-title">
            How a part is designed
          </h2>
          <p className="section-lede">Most parts are designed in the same four steps.</p>
        </header>

        <ol className="process" role="list">
          {processSteps.map((step, index) => (
            <li key={step.id} className="process-step">
              <span className="process-index">Step {index + 1}</span>
              <h3 className="process-name">{step.name}</h3>
              <p className="process-title">{step.title}</p>
              <p className="process-text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
