import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — FitCoach AI",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-24">
      <div className="mx-auto max-w-2xl prose prose-sm dark:prose-invert">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: July 2026</p>
        <p>
          By using FitCoach AI you agree to these terms. Our service provides
          AI-generated fitness guidance for informational purposes only and is
          not a substitute for professional medical advice.
        </p>
        <h2 className="text-xl font-semibold mt-6">Acceptable use</h2>
        <p>
          You agree not to misuse the platform, attempt to reverse-engineer our
          AI systems, or share your account credentials with others.
        </p>
        <h2 className="text-xl font-semibold mt-6">Disclaimer</h2>
        <p>
          FitCoach AI is provided &quot;as is&quot;. Consult a qualified health
          professional before starting any new fitness programme.
        </p>
      </div>
    </div>
  );
}
