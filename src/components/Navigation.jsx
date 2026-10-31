import { navLinks } from "../data/club";
import { useActiveSection } from "../hooks/useActiveSection";
import ClubLogo from "./ClubLogo";
import PillNav from "./reactbits/PillNav";

/*
 * PillNav from React Bits. On the home page the dot follows the section in view; on the
 * privacy and terms pages the links lead back to the home page's sections instead.
 */
export default function Navigation({ onHomePage = true }) {
  const home = onHomePage ? "" : import.meta.env.BASE_URL;
  const items = [
    { label: "Home", href: `${home}#home` },
    ...navLinks.map((link) => ({ label: link.label, href: `${home}#${link.id}` })),
  ];
  const active = useActiveSection(onHomePage ? items.map((item) => item.href.slice(1)) : []);

  return (
    <header className="site-nav">
      <PillNav
        logo={<ClubLogo size={28} />}
        logoAlt="OTHS CAD Club home"
        logoHref={`${home}#home`}
        items={items}
        activeHref={onHomePage ? `#${active || "home"}` : ""}
        size="lg"
        itemStyle="plain"
        hoverEffect="glide"
        indicator="dot"
        barColor="rgba(14, 15, 17, 0.62)"
        // The theme's tile colour is unused with plain items; pin it to neutral anyway.
        style={{ "--pn-tile": "linear-gradient(180deg, #2a2b2e 0%, #1c1d20 100%)" }}
        ariaLabel="Main"
      />
    </header>
  );
}
