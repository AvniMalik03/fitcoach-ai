import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const session = await auth();

  // Redirect is also handled in middleware, but double-checking here is safe
  if (!session?.user) {
    redirect("/login");
  }
  
  if (session.user.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <OnboardingFlow 
          defaultName={session.user.name || ""} 
          userEmail={session.user.email || ""} 
        />
      </div>
    </div>
  );
}
