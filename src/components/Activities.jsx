import { activities } from "../data/club";
import { Help, Pencil, Ruler, Share, Timer, Trophy } from "./Icons";
import BorderGlow from "./reactbits/BorderGlow";

const icons = { lessons: Pencil, cadoffs: Timer, realworld: Ruler, help: Help, share: Share, tournaments: Trophy };

/*
 * BorderGlow from React Bits: the edge nearest the pointer lights up in the club's mint
 * while you hover a card. Its default purple, pink and blue border is replaced with mint.
 */
const glow = {
  backgroundColor: "#0b0b0c",
  borderRadius: 28,
  glowColor: "144 64 78",
  colors: ["#a3ebc0", "#e6fff0", "#6fd6a0"],
  glowIntensity: 0.8,
  glowRadius: 32,
  fillOpacity: 0.3,
};

export default function Activities() {
  return (
    <section className="section" id="activities" aria-labelledby="activities-title">
      <div className="shell">
        <header className="section-head">
          <h2 id="activities-title" className="section-title">
            What we do
          </h2>
          <p className="section-lede">
            Beginner lessons, design challenges and help from other members, all in
            Onshape.
          </p>
        </header>

        <ul className="bento" role="list">
          {activities.map(({ id, size, title, description, tag }) => {
            const Icon = icons[id];
            return (
              <li key={id} data-size={size}>
                <BorderGlow className="tile" {...glow}>
                  <div className="tile-body">
                    <div className="tile-top">
                      <span className="tile-icon">
                        <Icon />
                      </span>
                      {tag && <span className="tile-tag">{tag}</span>}
                    </div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </BorderGlow>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
