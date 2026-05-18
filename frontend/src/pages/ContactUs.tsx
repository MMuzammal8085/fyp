import PublicShell from "../components/PublicShell";
import { ArrowRight, BriefcaseBusiness, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function ContactUs() {
  return (
    <PublicShell
      headerSlot={
        <div className="hero-shell">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">Contact</p>
            <h1>Let’s talk about your workflow.</h1>
            <p className="subtitle">
              If you need help with setup, migration, or a quick walkthrough,
              reach out.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="cta-primary">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/project" className="cta-ghost">
                View Project
              </Link>
            </div>
          </div>

          <div className="hero-media reveal-up delay-1">
            <img
              src="https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80"
              alt="Contact and support"
              loading="lazy"
            />
            <div className="glass-note">
              <BriefcaseBusiness size={18} />
              <p>We’ll respond with next steps.</p>
            </div>
          </div>
        </div>
      }
    >
      <section className="home-section reveal-up contact-block">
        <div className="section-head">
          <p>Reach Us</p>
          <h2>Fast support for demos and onboarding.</h2>
        </div>

        <div className="contact-grid">
          <article className="hover-lift">
            <Mail size={20} />
            <h3>Email</h3>
            <p>hr-platform@intellihire.ai</p>
          </article>
          <article className="hover-lift">
            <Phone size={20} />
            <h3>Call</h3>
            <p>+92 300 000 0000</p>
          </article>
          <article className="hover-lift">
            <BriefcaseBusiness size={20} />
            <h3>Support Window</h3>
            <p>Mon-Sat, 9:00 AM to 7:00 PM</p>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}
