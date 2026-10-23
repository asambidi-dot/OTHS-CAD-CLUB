import About from "./components/About";
import Activities from "./components/Activities";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Join from "./components/Join";
import MeetingLog from "./components/MeetingLog";
import Navigation from "./components/Navigation";
import Projects from "./components/Projects";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Navigation />

      <main id="main">
        <Hero />
        <Activities />
        <About />
        <Projects />
        <MeetingLog />
        <Join />
      </main>

      <Footer />
    </>
  );
}
