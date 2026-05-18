import PublicShell from "../components/PublicShell";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

const projectPillars = [
  {
    title: "Interview Intelligence",
    description:
      "Invites, pending visibility, transcripts, and structured results—connected end-to-end.",
    icon: Sparkles,
  },
  {
    title: "HR Operations Modules",
    description:
      "Employee management, attendance, tasks, and payroll live inside the same experience.",
    icon: Layers3,
  },
  {
    title: "Security & Control",
    description:
      "Role-based access and authenticated workflows protect sensitive actions.",
    icon: ShieldCheck,
  },
];

const scopeItems = [
  "Candidate sourcing and parsing",
  "Interview scheduling and invites",
  "Result analysis, summaries, and scoring",
  "Shortlisting and decision tracking",
  "Employee operations and payroll",
  "Task and attendance workflows",
];

export default function Project() {
  return (
    <PublicShell
      headerSlot={
        <div className="hero-shell">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">Project</p>
            <h1>A complete hiring + HR workflow stack.</h1>
            <p className="subtitle">
              IntelliHire is built to keep the full journey—from role creation
              to operations—consistent and easy to manage.
            </p>

            <div className="hero-actions">
              <Link to="/features" className="cta-ghost">
                View Features
              </Link>
              <Link to="/contact-us" className="cta-primary">
                Request Demo <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="hero-media reveal-up delay-1">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Project collaboration"
              loading="lazy"
            />
            <div className="glass-note">
              <BriefcaseBusiness size={18} />
              <p>Built for hiring teams and HR ops.</p>
            </div>
          </div>
        </div>
      }
    >
      <section className="home-section reveal-up">
        <div className="section-head">
          <p>What’s Included</p>
          <h2>Clear scope across the HR lifecycle.</h2>
        </div>

        <div className="feature-grid">
          {projectPillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="hover-lift">
                <Icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Scope</p>
          <h2>Designed as a connected system.</h2>
        </div>

        <div className="project-copy hover-lift" style={{ marginTop: "1rem" }}>
          <ul className="mini-list">
            {scopeItems.map((item) => (
              <li key={item}>
                <ChevronRight size={16} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicShell>
  );
}
