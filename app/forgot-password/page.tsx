import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Adult Day Intake Pro",
  description: "Request a password reset link for agency access."
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <Link className="text-sm font-bold text-sea hover:text-[#0b615b]" href="/">
            Adult Day Intake Pro
          </Link>
          <h2 className="mt-4 text-4xl font-bold tracking-normal">
            Get back into your packet workspace.
          </h2>
          <p className="mt-4 leading-7 text-[#52645f]">
            Password reset is for the buyer account only. Client/member packet
            responses are not stored in the account system.
          </p>
          <Link
            className="mt-5 inline-flex font-bold text-sea hover:text-[#0b615b]"
            href="/psychosocial-intake-packet"
          >
            View the blossom product page
          </Link>
        </div>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
