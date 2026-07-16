import { Suspense } from "react";
import { PsychosocialIntakeAccess } from "@/components/PsychosocialIntakeAccess";

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cloud p-8 text-ink">
          Loading protected intake edition...
        </main>
      }
    >
      <PsychosocialIntakeAccess />
    </Suspense>
  );
}
