import PublicShell from "../components/PublicShell";
import { Link } from "react-router-dom";
import "./Home.css";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function InfoPageLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: InfoPageProps) {
  return (
    <PublicShell
      headerSlot={
        <div className="hero-shell">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
            <div className="hero-actions">
              <Link to="/signup" className="cta-primary">
                Get Started
              </Link>
              <Link to="/contact-us" className="cta-ghost">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <section className="home-section">{children}</section>
    </PublicShell>
  );
}
