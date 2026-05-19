import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CtaSection() {
  return (
    <section className="home-section cta-banner">
      <div className="cta-inner">
        <h2>Ready to modernize your HR stack?</h2>
        <p>
          Start free, invite your team, and run your first interview workflow in
          under a day.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="cta-primary">
            Start free trial <ArrowRight size={18} />
          </Link>
          <Link to="/contact-us" className="cta-ghost">
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}
