import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In | Adult Day Intake Pro",
  description: "Sign in to access the Psychosocial Intake Packet dashboard."
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <Link className="text-sm font-bold text-sea hover:text-[#0b615b]" href="/">
            Adult Day Intake Pro
          </Link>
          <h2 className="mt-4 text-4xl font-bold tracking-normal">
            Access your packet workspace.
          </h2>
          <p className="mt-4 leading-7 text-[#52645f]">
            Sign in with the buyer account used for Standard Agency Access. The
            login system stores access details only, not completed packet data.
          </p>
          <Link
            className="mt-5 inline-flex font-bold text-sea hover:text-[#0b615b]"
            href="/psychosocial-intake-packet"
          >
            View the blossom product page
          </Link>
        </div>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
