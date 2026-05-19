import PublicShell from "../components/PublicShell";
import Hero from "../components/landing/Hero";
import StatsSection from "../components/landing/StatsSection";
import FeaturesGrid from "../components/landing/FeaturesGrid";
import WorkflowSteps from "../components/landing/WorkflowSteps";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CtaSection from "../components/landing/CtaSection";
import "./Home.css";

export default function Home() {
  const hasToken = Boolean(localStorage.getItem("token"));
  const storedUsername = localStorage.getItem("username");
  const storedEmail = localStorage.getItem("userEmail");
  const username =
    storedUsername || (storedEmail ? storedEmail.split("@")[0] : "User");

  return (
    <PublicShell headerSlot={<Hero hasToken={hasToken} username={username} />}>
      <StatsSection />
      <FeaturesGrid />
      <WorkflowSteps />
      <TestimonialsSection />
      <CtaSection />
    </PublicShell>
  );
}
