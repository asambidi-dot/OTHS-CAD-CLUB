import { useRef, useState } from "react";
import { processSteps } from "../data/club";
import ProcessArt from "./cad/ProcessArt";
import { IconFrame } from "./IconFrame";
import { ArrowRight, Browser, Help, Share } from "./Icons";

const points = [
  {
    Icon: Browser,
    title: "Learn to design with Onshape",
    text: "Onshape is the CAD program we use. It runs in a web browser, so a laptop or Chromebook is enough — nothing to install.",
  },
  {
    Icon: Help,
    title: "Get help from other members",
    text: "Stuck on a constraint or an extrude? Ask the person next to you, or post a screenshot in the Discord.",
  },
  {
    Icon: Share,
    title: "Share designs and try challenges",
    text: "Post what you're making, compare approaches after a CAD-off, and try the challenges other members set.",
  },
];

function ProcessViewer() {
  const [index, setIndex] = useState(0);
  const tabs = useRef([]);
  const step = processSteps[index];
  const last = processSteps.length - 1;

  const select = (next, focus = false) => {
    const wrapped = (next + processSteps.length) % processSteps.length;
    setIndex(wrapped);
    if (focus) tabs.current[wrapped]?.focus();
  };

  const onKeyDown = (event) => {
    const keys = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key], true);
  };

  return (
    <div className="process">
      <div className="process-tabs" role="tablist" aria-label="The design process">
        {processSteps.map((item, i) => (
          <button
            key={item.id}
            ref={(element) => {
              tabs.current[i] = element;
            }}
            type="button"
            role="tab"
            id={`process-tab-${item.id}`}
            className="process-tab"
            aria-selected={i === index}
            aria-controls="process-panel"
            tabIndex={i === index ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={onKeyDown}
          >
            <span className="process-num">0{i + 1}</span>
            <span className="process-name">{item.name}</span>
          </button>
        ))}
      </div>

      <div
        className="viewport"
        role="tabpanel"
        id="process-panel"
        aria-labelledby={`process-tab-${step.id}`}
      >
        <div className="viewport-bar" aria-hidden="true">
          <span className="viewport-file">keychain-tag · Part Studio</span>
          <span className="viewport-step">{step.name}</span>
        </div>

        <div className="viewport-body">
          <ol className="feature-tree" aria-hidden="true">
            <li className="is-done">Origin</li>
            <li className="is-done">Top</li>
            {processSteps.slice(1).map((item, i) => (
              <li
                key={item.id}
                className={i + 1 < index ? "is-done" : i + 1 === index ? "is-current" : "is-todo"}
              >
                {item.feature}
              </li>
            ))}
          </ol>
          <div className="viewport-canvas">
            <ProcessArt active={step.id} />
          </div>
        </div>

        <div className="viewport-caption">
          <div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
          <button type="button" className="button button-secondary button-small" onClick={() => select(index + 1)}>
            {index === last ? "Start over" : `Next: ${processSteps[index + 1].name}`}
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <section className="page-section about-section" id="about" aria-labelledby="about-title">
      <div className="shell about-grid">
        <div className="about-copy">
          <p className="eyebrow">About CAD</p>
          <h2 id="about-title" className="section-title">
            What is CAD?
          </h2>
          <p className="about-lead">
            CAD stands for <strong>computer-aided design</strong>. It&rsquo;s how
            engineers draw parts on a computer, with exact sizes, before anything
            gets made.
          </p>
          <p className="body-copy">
            Every part starts the same way: a flat sketch, a few dimensions, then a
            3D model you can measure, change and share. New to CAD? You can start here.
          </p>

          <ul className="about-points" role="list">
            {points.map(({ Icon, title, text }) => (
              <li key={title}>
                <IconFrame>
                  <Icon />
                </IconFrame>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ProcessViewer />
      </div>
    </section>
  );
}
