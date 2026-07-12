import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FitCoach AI",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-24">
      <div className="mx-auto max-w-2xl prose prose-sm dark:prose-invert">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: July 2026</p>
        <p>
          FitCoach AI takes your privacy seriously. We collect only the data
          necessary to provide personalised fitness coaching and never sell your
          personal information to third parties.
        </p>
        <h2 className="text-xl font-semibold mt-6">Data we collect</h2>
        <ul>
          <li>Account information (name, email)</li>
          <li>Fitness profile data (weight, goals, activity)</li>
          <li>Workout and nutrition logs</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6">How we use it</h2>
        <p>
          Your data is used exclusively to personalise your coaching experience
          and improve our AI models. All data is encrypted at rest and in
          transit.
        </p>
      </div>
    </div>
  );
}
