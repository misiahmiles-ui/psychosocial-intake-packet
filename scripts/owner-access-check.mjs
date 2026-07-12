import { existsSync, readFileSync } from "node:fs";

const checks = [
  {
    name: "Owner route exists",
    pass: existsSync("app/owner/page.tsx") && existsSync("app/owner/intake/page.tsx")
  },
  {
    name: "Owner role column is additive in Supabase schema",
    pass:
      fileIncludes("supabase/schema.sql", "account_role text not null default 'buyer'") &&
      fileIncludes("supabase/schema.sql", "profiles_account_role_check")
  },
  {
    name: "Owner activation template does not contain a real email address",
    pass:
      fileIncludes("supabase/owner-role-activation.sql", "<OWNER_EMAIL_HERE>") &&
      !/@gmail\.com|@yahoo\.com|@outlook\.com|@hotmail\.com/i.test(
        read("supabase/owner-role-activation.sql")
      )
  },
  {
    name: "Owner role is verified in a server API route",
    pass:
      fileIncludes("app/api/owner/status/route.ts", "admin.auth.getUser(token)") &&
      fileIncludes("app/api/owner/status/route.ts", "resolveOwnerAuthorization")
  },
  {
    name: "Dashboard and owner APIs share the same owner authorization function",
    pass:
      fileIncludes("app/api/access/status/route.ts", "resolveOwnerAuthorization") &&
      fileIncludes("app/api/owner/status/route.ts", "resolveOwnerAuthorization") &&
      fileIncludes("app/api/stripe/create-checkout-session/route.ts", "resolveOwnerAuthorization")
  },
  {
    name: "Owner API does not reject app-metadata owners because of a profile read issue",
    pass:
      !fileIncludes("app/api/owner/status/route.ts", "profileError || !owner") &&
      fileIncludes("app/api/owner/status/route.ts", "profileError && !ownerAuthorization.isOwner")
  },
  {
    name: "Protected access status exposes owner access without changing Stripe",
    pass:
      fileIncludes("app/api/access/status/route.ts", "isOwner") &&
      fileIncludes("app/api/access/status/route.ts", "ownerAuthorization.isOwner") &&
      fileIncludes("app/api/access/status/route.ts", "Boolean(profile?.has_access)")
  },
  {
    name: "Checkout redirects owners away from Stripe",
    pass:
      fileIncludes("app/api/stripe/create-checkout-session/route.ts", "resolveOwnerAuthorization") &&
      fileIncludes("app/api/stripe/create-checkout-session/route.ts", "/owner")
  },
  {
    name: "Owner workflow reuses production intake and PDF export logic",
    pass:
      fileIncludes("components/owner/OwnerIntakeReview.tsx", "IntakeApp") &&
      fileIncludes("components/owner/OwnerExportTestPanel.tsx", "buildPacketPdf")
  },
  {
    name: "Owner files do not add browser storage for workflow responses",
    pass: !/localStorage|sessionStorage|IndexedDB|indexedDB|document\.cookie/.test(
      [
        read("components/owner/OwnerControlCenter.tsx"),
        read("components/owner/OwnerExportTestPanel.tsx"),
        read("components/owner/OwnerIntakeReview.tsx"),
        read("components/IntakeApp.tsx")
      ].join("\n")
    )
  }
];

const failures = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failures.length) {
  process.exitCode = 1;
}

function fileIncludes(path, text) {
  return read(path).includes(text);
}

function read(path) {
  return readFileSync(path, "utf8");
}
