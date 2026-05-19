const stats = [
  { value: "40%", label: "Faster hiring cycles", detail: "vs. manual screening" },
  { value: "87%", label: "Avg. resume match", detail: "Structured scoring" },
  { value: "24/7", label: "Interview availability", detail: "Automated scheduling" },
  { value: "1", label: "Unified workspace", detail: "HR + recruiting" },
];

export default function StatsSection() {
  return (
    <section className="home-section stats-band">
      <div className="section-head">
        <p>Impact</p>
        <h2>Built for teams that move fast</h2>
      </div>
      <div className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card hover-lift">
            <strong>{stat.value}</strong>
            <h3>{stat.label}</h3>
            <p>{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
