import { InfoPageLayout } from "./InfoPage";

const plans = [
  {
    name: "Starter",
    price: "Free",
    detail: "Up to 5 interview roles · 50 invites/month",
  },
  {
    name: "Growth",
    price: "$49/mo",
    detail: "Unlimited roles · priority support · analytics",
  },
  {
    name: "Enterprise",
    price: "Custom",
    detail: "SSO · dedicated onboarding · SLA",
  },
];

export default function Pricing() {
  return (
    <InfoPageLayout
      eyebrow="Pricing"
      title="Plans that scale with your team"
      subtitle="Transparent tiers for startups and enterprises. No hidden fees."
    >
      <div className="plans-grid">
        {plans.map((plan) => (
          <article key={plan.name} className="hover-lift">
            <h3>{plan.name}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.detail}</p>
          </article>
        ))}
      </div>
    </InfoPageLayout>
  );
}
