import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Adult Day Intake Pro™",
  description: "Create a new password for agency access."
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <Link className="text-sm font-bold text-sea hover:text-[#0b615b]" href="/">
            Adult Day Intake Pro™
          </Link>
          <h2 className="mt-4 text-4xl font-bold tracking-normal">
            Choose a new password.
          </h2>
          <p className="mt-4 leading-7 text-[#52645f]">
            This updates the agency access login only. It does not touch PDF
            exports or client/member information.
          </p>
          <Link
            className="mt-5 inline-flex font-bold text-sea hover:text-[#0b615b]"
            href="/psychosocial-intake-packet"
          >
            View the product page
          </Link>
        </div>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
