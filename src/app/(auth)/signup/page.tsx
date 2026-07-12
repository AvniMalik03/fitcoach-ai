import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/signup-form";
import Link from "next/link";
import { Zap, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Create account — FitCoach AI",
  description: "Create your free FitCoach AI account and start your fitness journey today.",
};

const benefits = [
  "AI-personalised workout plans",
  "Smart nutrition & macro tracking",
  "Adaptive coaching that evolves with you",
  "Injury prevention & recovery tools",
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5 z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">FitCoach AI</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Your AI coach,<br />always with you.
            </h2>
            <p className="mt-3 text-white/80 text-sm leading-relaxed">
              Join thousands of members achieving their fitness goals with personalised AI coaching.
            </p>
          </div>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-white/90">
                <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">FitCoach AI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Free forever. No credit card required.
            </p>
          </div>

          <SignUpForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
