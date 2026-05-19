import { InfoPageLayout } from "./InfoPage";

const roles = [
  { title: "Senior Frontend Engineer", location: "Remote · Lahore" },
  { title: "HR Solutions Consultant", location: "Hybrid · Karachi" },
  { title: "Customer Success Lead", location: "On-site · Islamabad" },
];

export default function Careers() {
  return (
    <InfoPageLayout
      eyebrow="Careers"
      title="Build the future of HR technology"
      subtitle="Join a product-focused team shipping tools recruiters and HR leaders love."
    >
      <div className="modules-grid">
        {roles.map((role) => (
          <article key={role.title} className="hover-lift">
            <h3>{role.title}</h3>
            <p>{role.location}</p>
            <p className="mt-2 text-sm">
              Apply:{" "}
              <a href="mailto:webdevmuz@gmail.com" className="text-cyan-700">
                webdevmuz@gmail.com
              </a>
            </p>
          </article>
        ))}
      </div>
    </InfoPageLayout>
  );
}
