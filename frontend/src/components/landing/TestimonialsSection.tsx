import { Star } from "lucide-react";

const items = [
  {
    quote:
      "We cut hiring turnaround by nearly 40% after centralizing screening and HR ops.",
    name: "Ayesha Tariq",
    role: "Head of HR, NovaTech",
  },
  {
    quote:
      "The workflow clarity is excellent. Recruiting and payroll finally work in sync.",
    name: "Rafay Ahmed",
    role: "Operations Manager, BrightScale",
  },
  {
    quote:
      "Clean, modern, and practical. Our team adopted it with almost no training.",
    name: "Sara Malik",
    role: "HR Business Partner, Elevate Systems",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="home-section">
      <div className="section-head">
        <p>Testimonials</p>
        <h2>Trusted by growing teams</h2>
      </div>
      <div className="testimonials-grid">
        {items.map((item) => (
          <article key={item.name} className="hover-lift">
            <div className="stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} />
              ))}
            </div>
            <p>&ldquo;{item.quote}&rdquo;</p>
            <h3>{item.name}</h3>
            <span>{item.role}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
