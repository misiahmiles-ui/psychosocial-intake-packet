import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Create Access | Adult Day Intake Pro",
  description:
    "Create an agency access account for the Psychosocial Intake Packet."
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <Link className="text-sm font-bold text-sea hover:text-[#0b615b]" href="/">
            Adult Day Intake Pro
          </Link>
          <h2 className="mt-4 text-4xl font-bold tracking-normal">
            Create Standard Agency Access.
          </h2>
          <p className="mt-4 leading-7 text-[#52645f]">
            Create the account first, then complete the $497 Stripe checkout.
            After payment is confirmed, this account can open the packet
            workflow.
          </p>
          <Link
            className="mt-5 inline-flex font-bold text-sea hover:text-[#0b615b]"
            href="/psychosocial-intake-packet"
          >
            View the blossom product page
          </Link>
        </div>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
