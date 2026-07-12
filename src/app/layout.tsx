import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "FitCoach AI — Personalised Fitness & Nutrition Coach",
    template: "%s | FitCoach AI",
  },
  description:
    "Your AI-powered personal fitness and nutrition coach. Get personalised workout plans, meal tracking, and adaptive coaching to achieve your fitness goals.",
  keywords: [
    "AI fitness coach",
    "personalised workout",
    "nutrition tracking",
    "fitness app",
  ],
  authors: [{ name: "FitCoach AI" }],
  openGraph: {
    title: "FitCoach AI — Personalised Fitness & Nutrition Coach",
    description:
      "AI-powered personal fitness and nutrition coaching tailored to you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
