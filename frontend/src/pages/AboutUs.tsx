import PublicShell from "../components/PublicShell";
import { Building2, Handshake, ShieldCheck, Target } from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function AboutUs() {
  return (
    <PublicShell
      headerSlot={
        <div className="hero-shell">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">About IntelliHire</p>
            <h1>A modern HR platform built for clarity.</h1>
            <p className="subtitle">
              We connect hiring workflows with operational HR modules so teams
              can move faster without losing structure.
            </p>

            <div className="hero-bullets">
              <p>
                <ShieldCheck size={18} /> Secure, role-based access
              </p>
              <p>
                <Handshake size={18} /> Consistent evaluation experience
              </p>
              <p>
                <Target size={18} /> Evidence-first decision making
              </p>
            </div>

            <div className="hero-actions">
              <Link to="/features" className="cta-primary">
                Explore Features
              </Link>
              <Link to="/contact-us" className="cta-ghost">
                Talk to Us
              </Link>
            </div>
          </div>

          <div className="hero-media reveal-up delay-1">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=75"
              alt="HR team collaborating"
              loading="lazy"
            />
            <div className="glass-note">
              <Building2 size={18} />
              <p>Designed for real HR workflows.</p>
            </div>
          </div>
        </div>
      }
    >
      <section className="home-section reveal-up">
        <div className="section-head">
          <p>What We Do</p>
          <h2>Unify hiring, interviews, and HR operations.</h2>
        </div>
        <div className="about-grid">
          <article className="hover-lift">
            <Building2 size={22} />
            <h3>Unified Workspace</h3>
            <p>Bring recruiting and people ops into one consistent platform.</p>
          </article>
          <article className="hover-lift">
            <Handshake size={22} />
            <h3>Team Alignment</h3>
            <p>Keep HR and leadership aligned with structured workflows.</p>
          </article>
          <article className="hover-lift">
            <Target size={22} />
            <h3>Decision Quality</h3>
            <p>
              Use transcripts, summaries, and scorecards to shortlist fairly.
            </p>
          </article>
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Why</p>
          <h2>Build confidence into every step.</h2>
        </div>
        <div className="workflow-grid">
          <article className="hover-lift">
            <h3>Structure</h3>
            <p>Standardize interviews and outcomes across roles.</p>
          </article>
          <article className="hover-lift">
            <h3>Speed</h3>
            <p>Reduce manual tracking with status-aware workflows.</p>
          </article>
          <article className="hover-lift">
            <h3>Consistency</h3>
            <p>Keep evaluation criteria stable across candidates.</p>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}
