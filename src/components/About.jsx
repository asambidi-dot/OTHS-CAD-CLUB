import { facts } from "../data/club";

export default function About() {
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="shell about">
        <div className="about-copy">
          <h2 id="about-title" className="section-title">
            About the club
          </h2>
          <p className="about-lead">
            The OTHS CAD Club is for students who want to learn computer-aided design. We
            sketch parts in Onshape, give them exact dimensions, turn them into 3D models,
            and help each other along the way.
          </p>
        </div>

        <ul className="facts" role="list">
          {facts.map((fact) => (
            <li key={fact.title}>
              <h3>{fact.title}</h3>
              <p>{fact.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
