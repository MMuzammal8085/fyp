import { InfoPageLayout } from "./InfoPage";

export default function Privacy() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How IntelliHire collects, uses, and protects your data."
    >
      <article className="hover-lift legal-copy">
        <p>
          We collect account information (name, email) and operational HR data you
          upload. Data is stored securely and never sold to third parties.
        </p>
        <p>
          Contact webdevmuz@gmail.com for data export or deletion requests.
        </p>
      </article>
    </InfoPageLayout>
  );
}
