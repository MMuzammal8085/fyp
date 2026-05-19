import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import BrandLogo from "../BrandLogo";

const productLinks = [
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
  { label: "Project", path: "/project" },
];

const companyLinks = [
  { label: "About Us", path: "/about-us" },
  { label: "Careers", path: "/careers" },
  { label: "Contact", path: "/contact-us" },
];

const legalLinks = [
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms of Service", path: "/terms" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <BrandLogo to="/" size="lg" />
          <p>
            IntelliHire unifies hiring, interviews, and HR operations in one
            modern workspace for growing teams.
          </p>
          <div className="footer-contact-list">
            <a href="mailto:webdevmuz@gmail.com">
              <Mail size={16} />
              webdevmuz@gmail.com
            </a>
            <a href="tel:+923217762937">
              <Phone size={16} />
              +92 321 7762937
            </a>
            <p>
              <MapPin size={16} />
              Lahore, Pakistan · Mon–Sat 9:00–19:00 PKT
            </p>
          </div>
        </div>

        <div>
          <h4>Product</h4>
          {productLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <h4>Company</h4>
          {companyLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
        </div>

        <div>
          <h4>Legal</h4>
          {legalLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              {link.label}
            </Link>
          ))}
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Create Account</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} IntelliHire. All rights reserved.</p>
        <p>Built for HR teams · SOC2-ready architecture · 99.9% uptime SLA</p>
      </div>
    </footer>
  );
}
