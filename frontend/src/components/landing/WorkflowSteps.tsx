import { ChevronRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Upload & parse",
    description:
      "Paste a job description and upload resumes. Skills and match scores are extracted automatically.",
  },
  {
    step: "02",
    title: "Interview",
    description:
      "Send voice invites. Candidates join, speak naturally, and transcripts stream to your hub.",
  },
  {
    step: "03",
    title: "Automated scoring",
    description:
      "Sentiment, summaries, and evidence quotes support consistent evaluation.",
  },
  {
    step: "04",
    title: "Hire & onboard",
    description:
      "Shortlist from the evaluation desk and transition winners into employee records.",
  },
];

export default function WorkflowSteps() {
  return (
    <section className="home-section">
      <div className="section-head">
        <p>Workflow</p>
        <h2>From upload to automated scoring</h2>
      </div>
      <div className="workflow-track">
        {steps.map((item, index) => (
          <article key={item.step} className="workflow-step hover-lift">
            <span className="workflow-num">{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {index < steps.length - 1 && (
              <ChevronRight className="workflow-arrow" size={20} />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
