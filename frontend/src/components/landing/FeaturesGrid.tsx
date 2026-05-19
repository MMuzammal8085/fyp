import {
  BarChart3,
  FileSearch,
  Globe2,
  Layers3,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Voice Interviews",
    description:
      "Automate screening calls. Track live status, transcripts, and webhook updates in real time.",
    icon: PhoneCall,
  },
  {
    title: "Resume Parsing",
    description:
      "Extract skills and experience instantly. Score candidates against job descriptions.",
    icon: FileSearch,
  },
  {
    title: "Analytics Desk",
    description:
      "Sentiment insights, match scores, and executive dashboards for hiring decisions.",
    icon: BarChart3,
  },
  {
    title: "Smart Screening",
    description:
      "Structured skill extraction and role-fit signals accelerate shortlisting.",
    icon: Sparkles,
  },
  {
    title: "People Operations",
    description:
      "Employees, attendance, tasks, and payroll — without switching tools.",
    icon: Users,
  },
  {
    title: "Enterprise Security",
    description:
      "Role-based authentication and session control for sensitive HR data.",
    icon: ShieldCheck,
  },
  {
    title: "Cross-Team Visibility",
    description:
      "Align recruiting and leadership with live dashboards and status workflows.",
    icon: Layers3,
  },
  {
    title: "Global Ready",
    description:
      "Scale distributed hiring with timezone-friendly scheduling and invites.",
    icon: Globe2,
  },
];

export default function FeaturesGrid() {
  return (
    <section className="home-section">
      <div className="section-head">
        <p>Features</p>
        <h2>Everything your HR team needs</h2>
      </div>
      <div className="feature-grid">
        {features.map((card) => {
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
  );
}
