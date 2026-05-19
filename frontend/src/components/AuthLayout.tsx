import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  heroTitle: string;
  heroBody: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  heroTitle,
  heroBody,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
        <BrandLogo size="md" />
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] lg:grid-cols-2">
        <section className="relative overflow-hidden bg-linear-to-br from-teal-900 via-cyan-800 to-slate-900 p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute -bottom-16 -left-14 h-52 w-52 rounded-full bg-orange-300/20 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col">
            <p className="text-xs font-semibold tracking-[0.24em] text-cyan-100/90 uppercase">
              Enterprise HR Platform
            </p>
            <h1 className="mt-4 max-w-sm text-3xl leading-tight font-extrabold sm:text-4xl">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-md text-sm text-cyan-50/90 sm:text-base">
              {heroBody}
            </p>

            <div className="mt-8 space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <CheckCircle2 size={16} />
                AI interviews & structured scoring
              </p>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <CheckCircle2 size={16} />
                Secure, role-based access
              </p>
            </div>

            {footer ?? (
              <p className="mt-auto pt-10 text-sm text-cyan-50/85">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 font-semibold text-white underline decoration-cyan-200/70 underline-offset-4"
                >
                  Back to home
                  <ArrowRight size={15} />
                </Link>
              </p>
            )}
          </div>
        </section>

        <section className="flex items-center bg-[var(--surface)] p-5 sm:p-8 lg:p-10">
          <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="mb-6 border-b border-[var(--border)] pb-4">
              <h2 className="text-2xl font-bold text-[var(--text)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
