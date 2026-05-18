import { Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type PublicShellProps = {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
};

const navLinks = [
  { path: "/about-us", label: "About Us" },
  { path: "/features", label: "Features" },
  { path: "/project", label: "Project" },
  { path: "/contact-us", label: "Contact Us" },
];

export default function PublicShell({
  children,
  headerSlot,
}: PublicShellProps) {
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem("token"));
  const storedUsername = localStorage.getItem("username");
  const storedEmail = localStorage.getItem("userEmail");
  const username =
    storedUsername || (storedEmail ? storedEmail.split("@")[0] : "User");

  return (
    <div className="home-wrap">
      <header className="landing-header">
        <nav className="top-nav">
          <Link to="/" className="brand-link" title="Go to Home">
            IntelliHire
          </Link>

          <div className="top-nav-links">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  location.pathname === item.path
                    ? "nav-item active"
                    : "nav-item"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            {!hasToken ? (
              <>
                <Link to="/signin" className="nav-btn nav-btn-ghost">
                  Login
                </Link>
                <Link to="/signup" className="nav-btn nav-btn-primary">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <p className="user-chip">
                  <Users size={15} />
                  <span>{username}</span>
                </p>
                <Link to="/dashboard" className="nav-btn nav-btn-primary">
                  Dashboard
                </Link>
              </>
            )}
          </div>
        </nav>

        {headerSlot}
      </header>

      {children}

      <footer className="home-footer">
        <div>
          <p className="footer-brand">IntelliHire</p>
          <p>AI-powered hiring & HR workflows.</p>
        </div>
        <div className="footer-links">
          <Link to="/features">Features</Link>
          <Link to="/project">Project</Link>
          <Link to="/contact-us">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
