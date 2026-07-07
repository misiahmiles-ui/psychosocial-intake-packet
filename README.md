# Adult Day Intake Pro

White-label digital intake packet workflow for Adult Medical Day Care and Adult Day Health programs.

Created by Marvin Miles, LSW.

## What is included

- Responsive landing page for the digital product.
- 18-step intake workflow covering company setup plus the full packet structure.
- No-retention active browser session workflow.
- Download Editable Draft PDF.
- Review screen.
- Print action.
- Final PDF export.
- Mental status screening with automatic score and impairment level.
- In-app guide page at `/guide`.
- Fictitious completed example packet at `/example`.
- Company placeholders for headers, consent language, and exports.
- Paid buyer access layer using Supabase Auth, Supabase profiles, and Stripe Checkout.

## Privacy note

This app is local PDF export only. It does not save assessment information inside the web app, browser storage, backend, database, Netlify, cloud storage, cookies, analytics, logs, or service worker cache. Entered information remains active only in the current browser tab until the user downloads an Editable Draft PDF, exports a final PDF, prints, clears the form, refreshes, closes the tab, or navigates away.

Supabase is used only for buyer account login and paid access status. Stripe is used only for payment checkout. Do not add client/member/participant assessment fields, uploaded logos, completed packets, draft packets, or PHI to Supabase, Stripe metadata, Netlify forms, analytics, logs, or any backend.

Use Download Editable Draft PDF if work needs to continue later. The unfinished intake is saved only inside the downloaded PDF file controlled by the clinician or agency. Save downloaded PDFs only to an approved company hard drive, secure shared drive, or encrypted flash drive according to agency policy.

This is a privacy-conscious/no-retention workflow design, not a HIPAA compliance certification. HIPAA-compliant deployment would require separate hosting, security, business associate agreement, compliance, and agency policy review.

## Editable draft PDF behavior

The app uses local PDF export only and does not save drafts internally. Editable Draft PDF behavior may vary by PDF viewer. Adobe Acrobat Reader is recommended for completing or revising downloaded editable draft PDFs. Checkbox, multiple-choice, and scoring responses include readable selected-answer summaries to preserve clarity across PDF viewers.

## Standard Agency Access - $497 One-Time

Standard Agency Access provides one agency/location with access to the standard hosted version of the digital psychosocial intake workflow. The tool is designed for Adult Medical Day Care, Adult Day Health, social workers, interdisciplinary team members, intake coordinators, and behavioral health documentation teams.

This one-time package gives an agency access to the standard hosted version of the intake tool. The tool remains available while the hosted version is active. Agencies that want their own dedicated deployment, custom form language, permanent branding, staff logins, or long-term independent control may request a separate Agency-Owned Setup package.

### Package includes

- Buyer account login for protected hosted access.
- Access to the standard digital psychosocial intake workflow.
- Facility/company information entry.
- Session-based company logo upload.
- Psychosocial assessment sections.
- Consent and ROI sections.
- Review page before export/print.
- Download Editable Draft PDF option.
- Export Final PDF option.
- Print-ready packet option.
- Wet-signature lines for member, responsible party, and staff/witness.
- Signature reminder language: "Signature required after printout. Wet signature must be obtained according to agency policy."
- No internal draft saving.
- No app-based storage of client/member information.
- No database storage of client/member assessment data.
- No browser draft persistence.
- Local export/print workflow only.

### Hosted access limitation

Standard Agency Access is provided as access to the hosted standard version of the digital intake workflow. Continued access depends on the active availability of the hosted site. Hosting, updates, technical support, customization, and long-term maintenance are not included unless provided under a separate written agreement.

The $497 Standard Agency Access package does not include custom agency deployment, permanent built-in agency logo or branding, custom consent rewriting, custom intake sections, multiple staff seats unless separately configured, custom user roles, database storage of client/member assessment data, saved internal drafts, ongoing technical support, HIPAA compliance certification, Business Associate Agreement review, hosting guarantee beyond the active hosted version, or long-term maintenance unless separately purchased.

### No-retention/local export explanation

This tool is designed as a no-retention, local PDF export-only workflow. Assessment information entered into the app remains active only during the current browser session unless the user downloads or prints the packet. The app does not intentionally save completed intakes, drafts, client/member information, or uploaded logos inside the application.

### HIPAA disclaimer

This tool is designed to support privacy-conscious documentation workflows; however, it should not be described as HIPAA-compliant unless the purchasing agency completes its own HIPAA, security, hosting, policy, and Business Associate Agreement review. Each agency is responsible for using approved devices, secure storage locations, staff procedures, and internal privacy policies when handling client/member information.

### Signature-after-printout language

Completed packets are designed for printout and wet signature. Signature required after printout. Wet signature must be obtained according to agency policy.

## Paid access setup: Netlify + Stripe + Supabase

This project is set up for the simple paid-access model:

1. Netlify hosts the web app.
2. Supabase stores buyer accounts and access status only.
3. Stripe collects the $497 payment.
4. Stripe sends a webhook back to the app.
5. The webhook marks the buyer profile as `has_access = true`.
6. The buyer signs in and opens the protected packet dashboard.
7. Packet/client/member information remains local-only and is saved only by PDF download/export/print.

Run `supabase/schema.sql` in the Supabase SQL editor before launch. This creates the `profiles` table and signup trigger for buyer profiles only.

Add these environment variables in Netlify:

```bash
NEXT_PUBLIC_SITE_URL=https://your-netlify-site.netlify.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STANDARD_ACCESS_PRICE_ID=
STANDARD_ACCESS_PRICE_CENTS=49700
```

`STRIPE_STANDARD_ACCESS_PRICE_ID` is optional. If it is left blank, checkout creates a one-time $497 payment line item from `STANDARD_ACCESS_PRICE_CENTS`.

In Stripe, create a webhook endpoint pointing to:

```text
https://your-netlify-site.netlify.app/api/stripe/webhook
```

Send the `checkout.session.completed` event to that endpoint. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Do not hard-code secret keys, Stripe secret keys, Supabase service role keys, backend payment logic, or payment credentials in browser code. Use Netlify environment variables.

For password reset emails, add this URL to the allowed redirect URLs in
Supabase Auth settings:

```text
https://your-netlify-site.netlify.app/reset-password
```

Use `http://127.0.0.1:3002/reset-password` as an additional local redirect URL
while testing on the local preview server.

## In-app guide and example

The README information is also available inside the web app at `/guide` so buyers and users can access the operating notes without opening this source file.

The app includes a fictitious completed participant example at `/example`. The example uses fake participant, company, provider, phone, email, and address information. Users can review the completed sample on screen and download an example draft PDF or example final PDF to understand what kind of information belongs in each section.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Build

```bash
pnpm build
```

## Deploy

This is a standard Next.js app and can be deployed to Netlify. Configure the project with the build command `pnpm build`. The included `netlify.toml` sets the publish directory to `.next`.

## Selling next steps

1. Build a public sales page with product screenshots, a short demo video, and a clear CTA.
2. Create the Supabase project and run `supabase/schema.sql`.
3. Create or confirm the Stripe account and webhook endpoint.
4. Add the Supabase and Stripe environment variables in Netlify.
5. Deploy this app to Netlify using `pnpm build`.
6. Test the full buyer flow: signup, Stripe checkout, webhook access unlock, dashboard access, intake export, final PDF export, and print.
7. Give buyers an onboarding note explaining local PDF export only, approved storage expectations, and Adobe Acrobat Reader recommendation.
8. Before marketing to agencies as compliant infrastructure, complete separate hosting, HIPAA, BAA, privacy/security, and agency policy reviews.

## Branding placeholders

Default placeholder text lives in `lib/placeholders.ts`. The purchasing company can enter its own company name, address, phone, fax, email, tagline, administrator, session-based logo upload, and therapy provider details in Step 1 of the intake workflow.
