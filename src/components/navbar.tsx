"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl shadow-lg shadow-black/5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-md group-hover:shadow-primary/30 transition-shadow duration-300">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              FitCoach <span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-primary/30 hover:opacity-90 transition-all duration-200"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="hidden md:inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-primary/30 hover:opacity-90 transition-all duration-200"
                >
                  Get started
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 rounded-2xl border border-border/60 bg-background/95 p-4 backdrop-blur-xl shadow-lg md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-border flex flex-col gap-2">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="rounded-lg gradient-bg px-4 py-2.5 text-sm font-medium text-white text-center"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground text-center hover:bg-accent transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-lg gradient-bg px-4 py-2.5 text-sm font-medium text-white text-center"
                    >
                      Get started free
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
