import { useMediaQuery } from "../hooks/useMediaQuery";
import { ClubSocialLinks } from "./ClubSocialLinks";
import LightRays from "./reactbits/LightRays";

const steps = [
  [
    "Join the Discord",
    "Membership runs through our server. It’s where meeting times, rooms and announcements are posted.",
  ],
  ["Come to a meeting", "Check the Discord for when and where we meet next, then just show up."],
  ["Make your first part", "Start with a simple sketch in Onshape and get help along the way."],
];

export default function Join() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <section className="section join" id="join" aria-labelledby="join-title">
      <div className="shell">
        <div className="join-panel">
          {/* The same light as the hero, rising from below. It ignores the pointer. */}
          <div className="join-rays" aria-hidden="true">
            <LightRays
              raysOrigin="bottom-center"
              raysColor="#d9f9e5"
              raysSpeed={reducedMotion ? 0 : 0.4}
              lightSpread={1.1}
              rayLength={1.2}
              glow={0.7}
              haze={0.35}
              atmosphere={0.3}
              saturation={0.6}
              intensity={1.05}
              followMouse={false}
              cursorShadow={false}
              clickPulse={false}
              maxDevicePixelRatio={1.5}
            />
          </div>

          <h2 id="join-title" className="section-title join-title">
            How to join
          </h2>
          <p className="section-lede">
            Membership runs through our Discord server. Join the server, then come to a
            meeting. No experience is needed.
          </p>
          <ClubSocialLinks />

          <ol className="join-steps">
            {steps.map(([title, text], index) => (
              <li key={title}>
                <span className="step-number" aria-hidden="true">
                  {index + 1}
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
