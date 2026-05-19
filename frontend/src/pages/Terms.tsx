import { InfoPageLayout } from "./InfoPage";

export default function Terms() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Usage terms for the IntelliHire platform."
    >
      <article className="hover-lift legal-copy">
        <p>
          By using IntelliHire you agree to use the platform lawfully and keep
          credentials confidential. Service availability targets 99.9% uptime for
          paid plans.
        </p>
        <p>
          Questions: webdevmuz@gmail.com · +92 321 7762937
        </p>
      </article>
    </InfoPageLayout>
  );
}
