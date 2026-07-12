import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthPage =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnboarding = nextUrl.pathname === "/onboarding";

  // Redirect unauthenticated users away from protected routes
  if ((isDashboard || isOnboarding) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Handle onboarding state for logged-in users
  if (isLoggedIn) {
    const hasCompletedOnboarding = req.auth?.user?.onboardingCompleted;

    // If trying to access dashboard but hasn't completed onboarding -> /onboarding
    if (isDashboard && !hasCompletedOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }

    // If trying to access onboarding but already completed it -> /dashboard
    if (isOnboarding && hasCompletedOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
