import PublicShell from "../components/PublicShell";
import {
  Clock3,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

const featureCards = [
  {
    title: "AI Screening",
    description:
      "Score applicants quickly with structured skill extraction and role-fit signals.",
    icon: Sparkles,
  },
  {
    title: "Interview Planning",
    description:
      "Coordinate interview stages, slots, and evaluator feedback from one view.",
    icon: Clock3,
  },
  {
    title: "People Operations",
    description:
      "Manage employee records, attendance, tasks, and payroll without tool switching.",
    icon: Users,
  },
  {
    title: "Enterprise Security",
    description:
      "Protect sensitive data with role-based authentication and controlled access.",
    icon: ShieldCheck,
  },
  {
    title: "Cross-Team Visibility",
    description:
      "Keep leadership and HR aligned with live dashboards and status-aware workflows.",
    icon: Layers3,
  },
  {
    title: "Global Ready",
    description:
      "Scale hiring and operations for distributed teams with timezone-friendly workflows.",
    icon: Globe2,
  },
];

export default function Features() {
  return (
    <PublicShell
      headerSlot={
        <div className="hero-shell">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">Features</p>
            <h1>Modern HR UX with AI-first capabilities.</h1>
            <p className="subtitle">
              Everything is designed to keep workflows simple while preserving
              evidence and structure.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="cta-primary">
                Get Started
              </Link>
              <Link to="/project" className="cta-ghost">
                View Project
              </Link>
            </div>
          </div>

          <div className="hero-media reveal-up delay-1">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=75"
              alt="Product features"
              loading="lazy"
            />
            <div className="glass-note">
              <Sparkles size={18} />
              <p>Clean UI, consistent outcomes.</p>
            </div>
          </div>
        </div>
      }
    >
      <section className="home-section reveal-up">
        <div className="section-head">
          <p>Highlights</p>
          <h2>Features that keep teams aligned.</h2>
        </div>
        <div className="feature-grid">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="hover-lift">
                <Icon size={22} />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Next</p>
          <h2>See how it comes together.</h2>
        </div>
        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <Link to="/project" className="cta-primary">
            Explore Project
          </Link>
          <Link to="/contact-us" className="cta-ghost">
            Contact Us
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
