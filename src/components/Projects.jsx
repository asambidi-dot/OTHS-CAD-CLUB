import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { projectCategories, projects } from "../data/club";
import { CLUB_LINKS, external } from "./ClubSocialLinks";
import { ArrowLeft, ArrowRight, Close, Discord } from "./Icons";
import ViewerPoster, { asset } from "./viewer/ViewerPoster";

// One WebGL viewer, loaded only when a project is opened; cards use static Blender renders.
const ModelViewer = lazy(() => import("./viewer/ModelViewer"));

const categoryLabel = Object.fromEntries(projectCategories.map((c) => [c.id, c.label]));
const countFor = (id) =>
  id === "all" ? projects.length : projects.filter((p) => p.category === id).length;

function ProjectCard({ project, onOpen }) {
  return (
    <li className="project-card">
      <div className="project-art">
        <img
          src={asset(project.thumb)}
          alt=""
          width="800"
          height="520"
          loading="lazy"
          decoding="async"
        />
        <span className="concept-tag">Concept</span>
      </div>
      <p className="project-meta">
        <span>{categoryLabel[project.category]}</span>
        <span>{project.level}</span>
      </p>
      <h3>{project.title}</h3>
      <p className="project-summary">{project.summary}</p>
      <button
        type="button"
        className="project-open"
        aria-haspopup="dialog"
        onClick={(event) => onOpen(project.id, event.currentTarget)}
      >
        View details<span className="sr-only">: {project.title}</span>
        <ArrowRight />
      </button>
    </li>
  );
}

function ProjectDialog({ project, position, total, onClose, onStep }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="project-dialog-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onStep(1);
        if (event.key === "ArrowLeft") onStep(-1);
      }}
      // A click that lands on the dialog element itself is a click on the backdrop.
      onClick={(event) => event.target === ref.current && ref.current.close()}
    >
      {project && (
        <div className="dialog-inner">
          {/* First in order so it receives focus when the dialog opens */}
          <button
            type="button"
            className="icon-button dialog-close"
            onClick={() => ref.current.close()}
          >
            <Close />
            <span className="sr-only">Close project details</span>
          </button>

          <div className="dialog-art">
            <Suspense
              fallback={
                <ViewerPoster
                  poster={project.thumb}
                  posterAlt={`${project.title}, rendered in 3D`}
                  caption="Loading the 3D model…"
                  className="cad-viewer-dialog"
                />
              }
            >
              <ModelViewer
                key={project.id}
                src={project.model}
                poster={project.thumb}
                posterAlt={`${project.title}, rendered in 3D`}
                label={`Interactive 3D model: ${project.title}`}
                fov={30}
                className="cad-viewer-dialog"
              />
            </Suspense>
            <span className="concept-tag">Practice project concept</span>
          </div>

          <div className="dialog-content">
            <p className="project-meta">
              <span>{categoryLabel[project.category]}</span>
              <span>{project.level}</span>
            </p>
            <h2 id="project-dialog-title">{project.title}</h2>
            <p className="dialog-description">{project.description}</p>

            <h3>Skills you&rsquo;ll practice</h3>
            <ul className="skill-chips" role="list">
              {project.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>

            <h3>How you&rsquo;d build it</h3>
            <ol className="build-steps">
              {project.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <div className="dialog-footer">
              <div className="dialog-pager">
                <button type="button" className="icon-button" onClick={() => onStep(-1)}>
                  <ArrowLeft />
                  <span className="sr-only">Previous project</span>
                </button>
                <span aria-live="polite">
                  {position} / {total}
                </span>
                <button type="button" className="icon-button" onClick={() => onStep(1)}>
                  <ArrowRight />
                  <span className="sr-only">Next project</span>
                </button>
              </div>
              <a className="button button-primary button-small" href={CLUB_LINKS.discord} {...external}>
                <Discord />
                Join the club
                <span className="sr-only"> on Discord (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const trigger = useRef(null);

  const visible =
    filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const openIndex = visible.findIndex((p) => p.id === openId);
  const current = openIndex >= 0 ? visible[openIndex] : null;

  const open = (id, button) => {
    trigger.current = button;
    setOpenId(id);
  };

  const step = (direction) => {
    if (openIndex < 0) return;
    const next = (openIndex + direction + visible.length) % visible.length;
    setOpenId(visible[next].id);
  };

  const onClose = () => {
    setOpenId(null);
    trigger.current?.focus({ preventScroll: true });
  };

  return (
    <section className="page-section projects-section" id="projects" aria-labelledby="projects-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Projects</p>
            <h2 id="projects-title" className="section-title">
              Practice projects to try.
            </h2>
          </div>
          <p className="body-copy">
            Example parts that are good next steps once you know the basics. These are
            practice concepts, not finished member work — real club projects will be
            added as they&rsquo;re made.
          </p>
        </div>

        <div className="projects-toolbar">
          <div className="filters" role="group" aria-label="Filter projects by category">
            {projectCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="filter-chip"
                aria-pressed={filter === category.id}
                onClick={() => setFilter(category.id)}
              >
                {category.label}
                <span className="filter-count" aria-hidden="true">
                  {countFor(category.id)}
                </span>
              </button>
            ))}
          </div>
          <p className="concept-note">Practice project concepts</p>
        </div>

        <p className="sr-only" role="status">
          Showing {visible.length} {visible.length === 1 ? "project" : "projects"}
        </p>

        <ul className="project-grid" role="list" key={filter}>
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={open} />
          ))}
        </ul>
      </div>

      <ProjectDialog
        project={current}
        position={openIndex + 1}
        total={visible.length}
        onClose={onClose}
        onStep={step}
      />
    </section>
  );
}
