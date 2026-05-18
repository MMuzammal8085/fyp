import PublicShell from "../components/PublicShell";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  Handshake,
  Layers3,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
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

const moduleCards = [
  {
    title: "Interview Intelligence",
    description:
      "Create, monitor, and evaluate interviews with structured workflows and result snapshots.",
  },
  {
    title: "Resume Parser",
    description:
      "Extract candidate skills, experience, and key qualifications from uploaded resumes in seconds.",
  },
  {
    title: "Employee Management",
    description:
      "Organize employee records, profile details, and role assignments from one clean interface.",
  },
  {
    title: "Attendance Tracking",
    description:
      "Capture attendance data and monitor consistency trends for better workforce planning.",
  },
  {
    title: "Task Management",
    description:
      "Assign, update, and track HR tasks with transparent status visibility across your team.",
  },
  {
    title: "Payroll Management",
    description:
      "Keep salary cycles aligned with attendance and role data while reducing admin overhead.",
  },
  {
    title: "AI Job Description Writer",
    description:
      "Generate polished, role-specific job descriptions with hiring-ready structure and tone.",
  },
  {
    title: "Role-Based Security",
    description:
      "Protect sensitive HR operations with authentication and access controls for each role.",
  },
];

const workflowSteps = [
  {
    title: "Step 1 - Create Role",
    description:
      "Define job requirements with AI-assisted job descriptions in minutes.",
  },
  {
    title: "Step 2 - Source Candidates",
    description:
      "Collect and parse resumes to shortlist high-fit applicants faster.",
  },
  {
    title: "Step 3 - Evaluate",
    description:
      "Run interviews with structured scorecards and consistent decision criteria.",
  },
  {
    title: "Step 4 - Onboard",
    description:
      "Transition selected candidates into employee records and operations flow.",
  },
];

const testimonials = [
  {
    quote:
      "We cut our hiring turnaround by almost 40% in one quarter after moving to IntelliHire.",
    name: "Ayesha Tariq",
    role: "Head of HR, NovaTech",
  },
  {
    quote:
      "The workflow clarity is excellent. Everyone from recruiting to payroll finally works in sync.",
    name: "Rafay Ahmed",
    role: "Operations Manager, BrightScale",
  },
  {
    quote:
      "The interface is clean, modern, and practical. Our team adopted it with almost no training.",
    name: "Sara Malik",
    role: "HR Business Partner, Elevate Systems",
  },
];

const integrationItems = [
  "Calendar",
  "Email",
  "Spreadsheet Import",
  "Cloud Storage",
  "Interview Links",
  "Role Permissions",
];

const faqItems = [
  {
    question: "Can we use IntelliHire for small teams?",
    answer:
      "Yes. The platform works well for startups and scales smoothly for larger organizations.",
  },
  {
    question: "Is candidate and employee data secure?",
    answer:
      "Yes. Access is role-controlled and sensitive actions are protected by authenticated sessions.",
  },
  {
    question: "Do you support end-to-end HR workflows?",
    answer:
      "Yes. Recruiting, interviews, records, attendance, tasks, and payroll are connected.",
  },
  {
    question: "How long does onboarding take?",
    answer:
      "Most teams can start within a day and complete setup with guided onboarding quickly.",
  },
];

export default function Home() {
  const hasToken = Boolean(localStorage.getItem("token"));
  const storedUsername = localStorage.getItem("username");
  const storedEmail = localStorage.getItem("userEmail");
  const username =
    storedUsername || (storedEmail ? storedEmail.split("@")[0] : "User");

  return (
    <PublicShell
      headerSlot={
        <div className="hero-shell">
          <div className="hero-copy reveal-up">
            <p className="eyebrow">Intelligent Hiring Platform</p>
            <h1>Hire smarter. Manage HR faster.</h1>
            <p className="subtitle">
              IntelliHire connects resume parsing, AI-assisted interviews, and
              core HR operations in one modern workspace.
            </p>

            <div className="hero-bullets">
              <p>
                <CheckCircle2 size={18} /> Structured results & transcripts
              </p>
              <p>
                <CheckCircle2 size={18} /> Invite + pending visibility
              </p>
              <p>
                <CheckCircle2 size={18} /> Payroll, tasks, attendance
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
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70"
              alt="Team collaborating"
              loading="lazy"
            />
            <div className="glass-note">
              <Sparkles size={18} />
              <p>Modern UI + AI-driven insights, end-to-end.</p>
            </div>
          </div>
        </div>
      }
    >
      <section className="home-section reveal-up">
        <div className="section-head">
          <p>Overview</p>
          <h2>Everything HR needs, with AI where it matters</h2>
        </div>

        <div className="about-grid">
          <article className="hover-lift">
            <Building2 size={22} />
            <h3>One Workspace</h3>
            <p>Recruiting, operations, and reporting in one interface.</p>
          </article>
          <article className="hover-lift">
            <Handshake size={22} />
            <h3>Clear Decisions</h3>
            <p>Transcripts, summaries, and scoring support shortlisting.</p>
          </article>
          <article className="hover-lift">
            <Target size={22} />
            <h3>Better Fit</h3>
            <p>Role-fit signals and structured evaluations help consistency.</p>
          </article>
        </div>

        <div className="hero-actions" style={{ marginTop: "1.1rem" }}>
          <Link to="/about-us" className="cta-ghost">
            Learn more <ChevronRight size={18} />
          </Link>
          <Link to="/features" className="cta-primary">
            View features <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Features</p>
          <h2>Modern visuals, simple workflows</h2>
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
          <p>Core Modules</p>
          <h2>Recruiting + HR operations, connected</h2>
        </div>
        <div className="modules-grid">
          {moduleCards.map((module, index) => (
            <article
              key={module.title}
              className="hover-lift"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section project-highlight">
        <div className="project-copy hover-lift">
          <div className="section-head">
            <p>Project</p>
            <h2>A complete stack for hiring and HR execution</h2>
          </div>
          <p>
            IntelliHire combines candidate processing, structured interview
            pipelines, and HR modules with one consistent UI.
          </p>
          <ul className="mini-list">
            <li>
              <ChevronRight size={16} /> Invites, pending, and results in sync
            </li>
            <li>
              <ChevronRight size={16} /> AI summaries and evidence quotes
            </li>
            <li>
              <ChevronRight size={16} /> Employee operations modules included
            </li>
          </ul>
          <div className="hero-actions" style={{ marginTop: "1rem" }}>
            <Link to="/project" className="cta-primary">
              Explore project <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
          alt="Project planning session"
          loading="lazy"
        />
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Workflow</p>
          <h2>From role creation to onboarding</h2>
        </div>
        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <article key={step.title} className="hover-lift">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section showcase-grid">
        <article className="hover-lift">
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=80"
            alt="Team reviewing dashboard"
            loading="lazy"
          />
          <h3>Executive Dashboard</h3>
          <p>Monitor hiring flow and HR ops in one place.</p>
        </article>
        <article className="hover-lift">
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80"
            alt="Candidate review"
            loading="lazy"
          />
          <h3>Candidate Insights</h3>
          <p>Make shortlist decisions with structured evidence.</p>
        </article>
        <article className="hover-lift">
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80"
            alt="Team onboarding"
            loading="lazy"
          />
          <h3>Collaborative Operations</h3>
          <p>Give teams a shared source of truth.</p>
        </article>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Testimonials</p>
          <h2>Designed to be adopted quickly</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="hover-lift">
              <div className="stars">
                <Star size={16} />
                <Star size={16} />
                <Star size={16} />
                <Star size={16} />
                <Star size={16} />
              </div>
              <p>"{item.quote}"</p>
              <h3>{item.name}</h3>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>Integrations</p>
          <h2>Plays nicely with your tools</h2>
        </div>
        <div className="integrations-grid">
          {integrationItems.map((item) => (
            <article key={item} className="hover-lift">
              {item}
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <p>FAQ</p>
          <h2>Quick answers</h2>
        </div>
        <div className="faq-grid">
          {faqItems.map((item) => (
            <article key={item.question} className="hover-lift">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section contact-block">
        <div className="section-head">
          <p>Contact</p>
          <h2>Want a demo or need help?</h2>
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
            <h3>Support</h3>
            <p>Mon-Sat, 9:00 AM to 7:00 PM</p>
          </article>
        </div>

        <div className="hero-actions" style={{ marginTop: "1.1rem" }}>
          <Link to="/contact-us" className="cta-primary">
            Contact us <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
