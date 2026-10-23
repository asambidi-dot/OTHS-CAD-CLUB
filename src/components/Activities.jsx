import { activities } from "../data/club";
import { activityArt } from "./cad/ActivityArt";

export default function Activities() {
  return (
    <section className="page-section activities-section" id="activities" aria-labelledby="activities-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Activities</p>
            <h2 id="activities-title" className="section-title">
              Learn CAD. Make something.
            </h2>
          </div>
          <p className="body-copy">
            Start with a sketch, turn it into a model, and get help along the way.
            These are the four ways we practice.
          </p>
        </div>
      </div>

      <div className="light-divider" aria-hidden="true" />

      <ul className="activities shell" role="list">
        {activities.map((activity) => {
          const Art = activityArt[activity.id];
          return (
            <li className="activity-card" key={activity.id}>
              <div className="activity-art">
                <Art />
              </div>
              <span className="card-number">{activity.number}</span>
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
