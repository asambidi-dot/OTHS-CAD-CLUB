import { useMediaQuery } from "../hooks/useMediaQuery";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { ArrowRight, Discord } from "./Icons";
import Galaxy from "./reactbits/Galaxy";
import LightRays from "./reactbits/LightRays";

export default function Hero() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      {/* Galaxy from React Bits: a slow, plain white starfield behind the light. The cursor,
          click-to-warp and warp-speed intro are off; with reduced motion it holds still. */}
      <div className="hero-stars" aria-hidden="true">
        <Galaxy
          density={1}
          glowIntensity={0.3}
          starSpeed={0.3}
          rotationSpeed={0.02}
          twinkleIntensity={0.3}
          saturation={0}
          mouseInteraction={false}
          clickWarp={false}
          intro={false}
          opacity={0.85}
          dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
        />
      </div>

      {/* LightRays from React Bits: soft light falling from above. It drifts slowly and
          ignores the pointer; with reduced motion it holds still. */}
      <div className="hero-rays" aria-hidden="true">
        <LightRays
          raysOrigin="top-center"
          raysColor="#e3fcec"
          raysSpeed={reducedMotion ? 0 : 0.4}
          lightSpread={0.9}
          rayLength={1.5}
          fadeDistance={1.05}
          glow={0.6}
          haze={0.3}
          atmosphere={0.35}
          saturation={0.6}
          followMouse={false}
          cursorShadow={false}
          clickPulse={false}
          maxDevicePixelRatio={1.5}
        />
      </div>

      <div className="hero-inner shell">
        <p className="hero-kicker">Student club at OTHS</p>

        <h1 id="hero-title" className="hero-title">
          OTHS CAD Club
        </h1>

        <p className="hero-lede">
          Learn computer-aided design in Onshape with other students. We run beginner
          lessons, timed CAD-offs and design challenges based on everyday problems. No
          experience is needed.
        </p>

        <div className="hero-actions">
          <a className="button button-primary" href={CLUB_LINKS.discord} {...external}>
            <Discord />
            Join on Discord
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a className="button button-secondary" href="#activities">
            See what we do
            <ArrowRight />
          </a>
        </div>

        <p className="hero-note">Meeting times and rooms are posted on our Discord.</p>
      </div>
    </section>
  );
}
