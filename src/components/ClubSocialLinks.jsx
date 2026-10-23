import { Discord, Instagram } from "./Icons";

/* The club's only two outside destinations. Change them here and every link updates. */
export const CLUB_LINKS = {
  discord: "https://discord.gg/b6RDtRgp7",
  instagram: "https://www.instagram.com/oths.cad",
};

/* Shared props for links that leave the site. */
export const external = { target: "_blank", rel: "noopener noreferrer" };

export function ClubSocialLinks({ className = "" }) {
  return (
    <div className={`club-social-links ${className}`.trim()}>
      <a href={CLUB_LINKS.discord} className="button button-primary" {...external}>
        <Discord />
        Join our Discord
        <span className="sr-only"> (opens in a new tab)</span>
      </a>

      <a href={CLUB_LINKS.instagram} className="button button-secondary" {...external}>
        <Instagram />
        Follow @oths.cad
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}
