import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LegalPage from "./components/LegalPage.jsx";
// Self-hosted type, so no font CDN is contacted.
import "@fontsource-variable/instrument-sans/wght.css";
import "./styles.css";

// privacy/index.html and terms/index.html both load this file; data-page picks the content.
const root = document.getElementById("root");

createRoot(root).render(
  <StrictMode>
    <LegalPage page={root.dataset.page} />
  </StrictMode>,
);
