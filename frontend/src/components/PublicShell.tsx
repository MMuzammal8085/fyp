import { useState } from "react";
import { Menu, Users, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import Footer from "./landing/Footer";
import ThemeToggle from "./ThemeToggle";

type PublicShellProps = {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
  showFooter?: boolean;
};

const navLinks = [
  { path: "/about-us", label: "About" },
  { path: "/features", label: "Features" },
  { path: "/pricing", label: "Pricing" },
  { path: "/careers", label: "Careers" },
  { path: "/contact-us", label: "Contact" },
];

export default function PublicShell({
  children,
  headerSlot,
  showFooter = true,
}: PublicShellProps) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hasToken = Boolean(localStorage.getItem("token"));
  const storedUsername = localStorage.getItem("username");
  const storedEmail = localStorage.getItem("userEmail");
  const username =
    storedUsername || (storedEmail ? storedEmail.split("@")[0] : "User");

  return (
    <div className="home-wrap public-layout">
      <header className="landing-header">
        <nav className="top-nav top-nav-enhanced">
          <div className="top-nav-brand-row">
            <button
              type="button"
              className="public-nav-toggle lg:hidden"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <BrandLogo size="nav" />
          </div>

          <div
            className={`top-nav-links ${mobileNavOpen ? "top-nav-links-open" : ""}`}
          >
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileNavOpen(false)}
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
            <ThemeToggle />
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
                <p className="user-chip hidden sm:inline-flex">
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

      <div className="public-main">{children}</div>

      {showFooter && <Footer />}
    </div>
  );
}
