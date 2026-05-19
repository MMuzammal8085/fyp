import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

type HeroProps = {
  hasToken: boolean;
  username: string;
};

export default function Hero({ hasToken, username }: HeroProps) {
  return (
    <div className="hero-shell">
      <div className="hero-copy reveal-up">
        <p className="eyebrow">Intelligent Hiring Platform</p>
        <h1>Hire smarter. Manage HR faster.</h1>
        <p className="subtitle">
          IntelliHire connects resume parsing, structured voice interviews, and
          core HR operations in one premium workspace.
        </p>

        <div className="hero-bullets">
          <p>
            <CheckCircle2 size={18} /> Automated screening calls & transcripts
          </p>
          <p>
            <CheckCircle2 size={18} /> Smart scoring, sentiment & summaries
          </p>
          <p>
            <CheckCircle2 size={18} /> Payroll, tasks & attendance unified
          </p>
        </div>

        <div className="hero-actions">
          {!hasToken ? (
            <>
              <Link to="/signup" className="cta-primary">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/signin" className="cta-ghost">
                Login <ChevronRight size={18} />
              </Link>
            </>
          ) : (
            <>
              <p className="user-chip">
                <Users size={15} />
                <span>{username}</span>
              </p>
              <Link to="/dashboard" className="cta-primary">
                Open Dashboard <ArrowRight size={18} />
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="hero-media reveal-up delay-1">
        <div className="hero-mockup">
          <div className="mockup-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="mockup-grid">
            <article>
              <p className="mock-label">Candidates</p>
              <strong>128</strong>
              <small>+24% this month</small>
            </article>
            <article>
              <p className="mock-label">Avg. match</p>
              <strong>87%</strong>
              <small>Resume fit scoring</small>
            </article>
            <article className="mock-wide">
              <p className="mock-label">Live interviews</p>
              <div className="mock-progress">
                <span style={{ width: "72%" }} />
              </div>
              <small>6 in progress · 14 scheduled</small>
            </article>
          </div>
        </div>
        <div className="glass-note">
          <Sparkles size={18} />
          <p>Enterprise insights from screening to onboarding.</p>
        </div>
      </div>
    </div>
  );
}
