import { ClubSocialLinks } from "./ClubSocialLinks";

const steps = [
  [
    "Join the Discord",
    "Membership runs through our server. It’s where meeting times, rooms and announcements are posted.",
  ],
  ["Come to a meeting", "Check the Discord for when and where we meet next, then just show up."],
  ["Make your first part", "Start with a simple sketch in Onshape and get help along the way."],
];

export default function Join() {
  return (
    <section className="page-section join-section" id="join" aria-labelledby="join-title">
      <div className="shell">
        <div className="join-panel">
          <div className="join-intro">
            <p className="eyebrow">Join the club</p>
            <h2 id="join-title" className="section-title">
              Your first design starts here.
            </h2>
            <p className="body-copy">
              New to CAD? You can start here — no experience needed. Everything runs
              through our Discord: joining the server is how you join the club.
            </p>
            <ClubSocialLinks />
          </div>

          <ol className="join-steps">
            {steps.map(([title, text], i) => (
              <li key={title}>
                <span className="step-number" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
