import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import {
  Zap,
  Brain,
  Dumbbell,
  Salad,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle2,
  Activity,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FitCoach AI — Personalised AI Fitness & Nutrition Coach",
  description:
    "Transform your body with personalised AI workout plans, smart nutrition tracking, and adaptive coaching that evolves with you. Start free today.",
};

const features = [
  {
    icon: Brain,
    title: "AI-Powered Personalisation",
    description:
      "Your coach learns from every workout, adapting plans in real-time based on your performance, recovery, and goals.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Dumbbell,
    title: "Dynamic Workout Engine",
    description:
      "Science-backed programmes designed for your fitness level, equipment availability, and schedule — updated weekly.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Salad,
    title: "Smart Nutrition Tracking",
    description:
      "Log meals effortlessly with AI food recognition. Get macro breakdowns and personalised meal recommendations.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Visualise your body composition changes, strength gains, and nutritional trends with beautiful charts.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Shield,
    title: "Injury Prevention",
    description:
      "Built-in injury screening and recovery protocols to keep you training safely for the long term.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Activity,
    title: "Adaptive Coaching Loop",
    description:
      "Weekly AI check-ins adjust your programme based on sleep, stress, and life — because one size never fits all.",
    gradient: "from-yellow-500 to-orange-500",
  },
];

const steps = [
  {
    num: "01",
    title: "Complete your profile",
    desc: "Tell us your goals, fitness level, and dietary preferences. Takes under 3 minutes.",
  },
  {
    num: "02",
    title: "Get your AI plan",
    desc: "Receive a fully personalised workout and nutrition plan generated for your unique profile.",
  },
  {
    num: "03",
    title: "Train, eat, track",
    desc: "Follow guided workouts, log meals, and track your body metrics — all in one place.",
  },
  {
    num: "04",
    title: "Evolve continuously",
    desc: "Your AI coach analyses progress weekly and automatically upgrades your plan.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-500/20 blur-[128px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-pink-500/20 blur-[128px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm mb-6">
              <span className="flex h-2 w-2 rounded-full gradient-bg" />
              AI-powered · Personalised · Science-backed
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              Your AI coach,{" "}
              <span className="gradient-text block sm:inline">
                built around you.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              FitCoach AI delivers personalised workout plans, smart nutrition
              tracking, and adaptive coaching that evolves with your progress —
              so you never plateau again.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl gradient-bg px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 transition-all duration-200"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              {["No credit card", "Free forever plan", "Cancel anytime", "GDPR compliant"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mt-20 mx-auto max-w-5xl w-full px-4">
            <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Calories", value: "1,842", sub: "burned today", icon: "🔥" },
                  { label: "Workouts", value: "4 / 5", sub: "this week", icon: "💪" },
                  { label: "Protein", value: "87%", sub: "of goal", icon: "🥩" },
                  { label: "Streak", value: "12 days", sub: "keep going!", icon: "⚡" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-background/50 p-4 text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <p className="text-lg font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl gradient-bg p-4 text-white">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xs">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold opacity-80">AI Insight</p>
                    <p className="text-sm font-medium mt-0.5">
                      Great work today! Increase protein by 30g and add a 10-min walk to hit your weekly deficit. 🎯
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
                Features
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Everything you need to{" "}
                <span className="gradient-text">transform your body</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                A complete fitness ecosystem powered by AI — not just another app with templates.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description, gradient }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-border bg-card p-6 card-hover relative overflow-hidden"
                >
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-4xl relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4">
                How it works
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Up and running in{" "}
                <span className="gradient-text">minutes</span>
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {steps.map(({ num, title, desc }) => (
                <div key={num} className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-7xl font-black text-muted-foreground/5 select-none">
                    {num}
                  </div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg gradient-bg text-xs font-bold text-white mb-4 shadow">
                    {num}
                  </div>
                  <h3 className="text-base font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="mx-auto max-w-3xl rounded-3xl gradient-bg p-12 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Start your transformation today
              </h2>
              <p className="mt-4 text-white/80 text-sm sm:text-base max-w-md mx-auto">
                Join thousands already training smarter. Your first month is completely free.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-lg hover:bg-white/95 transition-all"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-10 px-4">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg shadow">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold">
                FitCoach <span className="gradient-text">AI</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} FitCoach AI. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
