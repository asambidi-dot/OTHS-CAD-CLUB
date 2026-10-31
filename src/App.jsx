import { useEffect } from "react";
import About from "./components/About";
import Activities from "./components/Activities";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Join from "./components/Join";
import Navigation from "./components/Navigation";
import Photos from "./components/Photos";
import Process from "./components/Process";

export default function App() {
  // Arriving from the privacy or terms page with a link like /#about: the browser looks
  // for the section before React has drawn it, so jump there once it exists.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Navigation />

      <main id="main">
        <Hero />
        <About />
        <Activities />
        <Process />
        <Photos />
        <Faq />
        <Join />
      </main>

      <Footer />
    </>
  );
}
