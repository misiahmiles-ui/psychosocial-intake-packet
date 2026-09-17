# Adult Day Intake Pro™

Psychosocial Intake & PDF Documentation Workflow for adult day care and adult medical daycare programs.

Created by Marvin Miles, LSW.

## What is included

- Responsive landing page for the digital product.
- Protected 18-step New Jersey intake workflow covering company setup plus PDF packet output structure.
- Conditional Maryland Psychosocial Edition that mirrors the baseline and adds a Maryland admission-document and coordination addendum.
- No-retention active browser session workflow.
- Download Editable Draft PDF.
- Review screen.
- Print action.
- Final PDF export.
- Mental status screening with automatic score and impairment level.
- Optional PHI-reviewed, source-grounded psychosocial assessment generation.
- Fictitious completed example at `/example`.
- Company placeholders for headers, consent language, and exports.
- Paid buyer access layer using Supabase Auth, Supabase profiles, and Stripe Checkout.

## Privacy note

The intake and PDF workflow does not persist assessment information inside the app, browser storage, Supabase, Netlify forms, analytics, logs, or a clinical-record database. Entered information remains active only in the current browser tab until the user downloads an Editable Draft PDF, exports a final PDF, prints, clears the form, refreshes, closes the tab, or navigates away.

The optional assessment generator is the one exception to a fully local workflow: after a clinician completes the PHI Review Gate, the app sends only the temporary, de-identified, structured fact set to its server-side generation endpoint and then to the configured OpenAI project. The full intake packet, participant identity fields, generated narrative, clinician edits, and final PDF are not stored in the entitlement ledger. The generated assessment returns to volatile browser state for clinician review and local final-PDF export.

Supabase is used only for buyer account login and paid access status. Stripe is used only for payment checkout. Do not add client/member/participant assessment fields, uploaded logos, completed packets, draft packets, or PHI to Supabase, Stripe metadata, Netlify forms, analytics, logs, or any backend.

Use Download Editable Draft PDF if work needs to continue later. The unfinished intake is saved only inside the downloaded PDF file controlled by the clinician or agency. Save downloaded PDFs only to an approved company hard drive, secure shared drive, or encrypted flash drive according to agency policy.

This is a privacy-conscious/no-retention workflow design, not a HIPAA compliance certification. HIPAA-compliant deployment would require separate hosting, security, business associate agreement, compliance, and agency policy review.

## Psychosocial assessment generation

The active assessment generator creates a deterministic draft from reviewed intake facts. Optional AI composes the clinician-facing clinical paragraphs by choosing, grouping, and ordering source-bound professional phrasings supplied from those same reviewed facts. The AI returns the actual paragraph text and source IDs. Server and browser validate every sentence against the exact approved options before display; valid AI wording is retained. One deterministic repair pass replaces unsupported clauses from their cited facts. If the result is still unsafe, contains output PHI, or retains no valid AI wording, the original built-in draft is used. Arbitrary free-form paraphrases cannot be deterministically certified and are not accepted. Legacy lexical validation and second-model review code is disconnected from the active workflow.

- OpenAI access is server-side only through the Responses API.
- `OPENAI_API_KEY` and `OPENAI_MODEL` are read only from this application's server environment.
- Strict JSON Schema structured output is validated again against the transmitted source facts before any result is accepted.
- The optional active AI request is one abortable attempt with sanitized errors, `store: false`, and no request/response-body logging.
- OpenAI instructions and the untrusted structured fact payload are kept separate.
- A final exact-payload PHI scan runs immediately before the outbound request, followed by source-grounding and output-PHI validation after generation.

`store: false` is an API request setting, not a legal, HIPAA, Business Associate Agreement, or zero-retention guarantee. The product owner and each agency must independently review the configured OpenAI account/project, data controls, contracts, hosting, and policies before production use.

### Generation entitlement

A qualifying Psychosocial Intake purchase includes **25 completed Psychosocial Assessments per monthly billing cycle**. The existing upfront amount and $19/month continuation are unchanged. The checkout activation starts the first pool; each paid cycle of the existing hosted-access subscription grants the next pool. AI enhancement is included in the same use. For shared-suite accounts, authorized Psychosocial users at the facility share the pool.

The quantity is fixed at 25 in `lib/assessmentEntitlementPolicy.ts`. The existing quota ledger records completed assessment workflows and billing-cycle windows; its older database names are internal only.

Only a successful workflow returning a usable assessment consumes one assessment use. Draft building, AI enhancement, validation, repair, and fallback do not consume separate uses. Failed or canceled workflows release their reservation. Product Owner access remains unlimited.

### Owner setup for Netlify and Supabase

Do not deploy this feature until the owner has reviewed the branch and completed these steps:

1. Open the existing Supabase project used by this Psychosocial Intake application.
2. Confirm the shared-suite schema migration is present. Apply `supabase/migrations/20260915_psychosocial_assessment_quota.sql`, then `supabase/migrations/20260917_included_psychosocial_assessments.sql` in order when approved. The latter aligns the single verified pre-customer 30-use entitlement to 25, preserves its completed and released events, and enforces 25 for newly inserted entitlement rows. Each paid renewal creates a new 25-use billing-cycle row.
3. In **Table Editor**, verify `psychosocial_assessment_generation_entitlements` contains only purchase, Stripe subscription/invoice, account-scope, included quantity, and billing-window metadata; `psychosocial_assessment_generation_events` contains only reservation/completion metadata. Confirm row-level security is enabled on both. Neither table may contain participant clinical content or PHI.
4. In the Netlify site for this application, open **Site configuration → Environment variables**.
5. Add `OPENAI_API_KEY` as a server-only value. It may be a key from the same approved OpenAI account/project/billing source used by LeanMaster, but it must be configured independently for this Netlify site. Never use a `NEXT_PUBLIC_` prefix.
6. Add or confirm `OPENAI_MODEL` and the existing assessment rate-limit and timeout settings. The assessment quantity is fixed in code. No separate assessment Stripe Price ID is required.
7. Scope the variables to the intended Netlify contexts, save them, and redeploy only after review. Do not copy LeanMaster's `.env` file or source code into this repository.

The API key never belongs in source code, browser code, a public environment variable, Supabase tables, Stripe metadata, or logs. Applying the migration and adding environment variables are manual owner actions; this branch does not change the live database or deploy the site.

Existing separate assessment add-on subscriptions, if any were previously created in Stripe, require an approved Stripe cancellation and billing review before deployment. This offline code change stops creating new add-ons but does not alter live Stripe subscriptions.

Run these checks before approving deployment:

```bash
pnpm run test:assessment-safeguards
pnpm run test:assessment-architecture
pnpm run typecheck
pnpm build
pnpm run verify:assessment-pdf
```

Any live provider verification requires separate owner approval. Use fictitious data and verify that a usable assessment increments usage once, provider failure still returns the built-in assessment, and a paid hosted-access invoice grants one 25-assessment billing-cycle pool.

## Editable draft PDF behavior

The app uses local PDF export only and does not save drafts internally. Editable Draft PDF behavior may vary by PDF viewer. Adobe Acrobat Reader is recommended for completing or revising downloaded editable draft PDFs. Checkbox, multiple-choice, and scoring responses include readable selected-answer summaries to preserve clarity across PDF viewers.

## State editions

The New Jersey Psychosocial Edition remains the protected 18-step baseline. Legacy packets and access records without a jurisdiction value resolve to New Jersey.

The Maryland Psychosocial Edition reuses the clinically equivalent baseline sections and adds a Maryland-only psychosocial coordination addendum. The addendum tracks the preadmission assessment, service contract, participant rights, home-environment assessment, Maryland social-work credential, referrals, multidisciplinary participation, official psychosocial forms, and discharge documentation. ADCAPS and RN-owned clinical tracking remain in the Maryland Nursing Edition.

Current official Maryland references used for the addendum:

- [Maryland Adult Medical Day Care Resources](https://health.maryland.gov/ohcq/Pages/Adult-Medical-Day-Care-Resources.aspx)
- [Maryland Medical Day Care Services and Forms](https://health.maryland.gov/mmcp/longtermcare/Pages/Medical-Day-Care-Services.aspx?Mobile=1)
- [COMAR 10.12](https://regs.maryland.gov/us/md/exec/comar/10.12/index.full.html)
- [Maryland Board of Social Work Examiners license roster](https://health.maryland.gov/bswe/Pages/Roster.aspx)

Maryland facilities should have counsel, compliance staff, and clinical leadership review the edition against the facility's license category, payer requirements, current State forms, and agency policy before production use.

## Standard Agency Access - $487 Upfront Access Fee + $19/Month

Standard Agency Access gives one adult day care or adult medical daycare program access to the hosted Adult Day Intake Pro™ digital psychosocial intake workflow. The workflow is designed for adult day care, adult medical daycare, social work, interdisciplinary team members, intake coordinators, and behavioral health documentation teams.

The $487 upfront access fee activates the agency's access to the standard hosted workflow. The $19/month subscription covers continued hosted access and standard maintenance for the hosted version. Continued hosted access depends on an active monthly subscription and the active availability of the hosted site. Agencies that want their own dedicated deployment, custom form language, permanent branding, staff logins, or long-term independent control may request a separate Agency-Owned Setup package.

### Package includes

- Buyer account login for protected hosted access.
- Monthly hosted access and standard maintenance for the hosted version.
- Access to the Adult Day Intake Pro™ hosted workflow.
- Facility/company information entry.
- Session-based company logo upload.
- Psychosocial assessment sections.
- Consent and ROI sections.
- Review page before export/print.
- Download Editable Draft PDF option.
- Export Final PDF option.
- Print-ready PDF packet output.
- Wet-signature lines for member, responsible party, and staff/witness.
- Signature reminder language: "Signature required after printout. Wet signature must be obtained according to agency policy."
- No internal draft saving.
- No app-based storage of client/member information.
- No database storage of client/member assessment data.
- No browser draft persistence.
- Local export/print workflow only.

### Hosted access limitation

Standard Agency Access is provided as access to the hosted standard version of the digital intake workflow. Continued access depends on an active monthly subscription and the active availability of the hosted site. The $19/month fee covers hosted access and standard maintenance for this hosted version. Customization, dedicated support, compliance review, and agency-owned deployment are not included unless provided under a separate written agreement.

The Standard Agency Access package does not include custom agency deployment, permanent built-in agency logo or branding, custom consent rewriting, custom intake sections, multiple staff seats unless separately configured, custom user roles, database storage of client/member assessment data, saved internal drafts, custom technical support beyond included hosted maintenance, HIPAA compliance certification, Business Associate Agreement review, dedicated agency-owned hosting, or custom long-term maintenance unless separately purchased.

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
3. Stripe collects the existing $487 upfront payment and starts the existing $19/month hosted access and maintenance subscription, which includes 25 Psychosocial Assessments per billing cycle.
4. Stripe sends webhooks back to the app.
5. The webhook marks the buyer profile as `has_access = true` while the subscription is active.
6. Subscription update/cancellation webhooks update access when Stripe reports the subscription is no longer active.
7. The buyer signs in and opens the protected workflow dashboard.
8. Client/member information remains local-only and is saved only by PDF download/export/print.

Run `supabase/schema.sql` in the Supabase SQL editor before launch. This creates the `profiles` table and signup trigger for buyer profiles only.

## Product Owner / Super Administrator access

The app includes a protected owner-only route at `/owner`.

Owner access is separate from buyer access. The owner account does not need a Stripe payment, does not require a monthly subscription, does not count as an agency customer seat, and is not affected by subscription cancellation. The owner role is verified server-side through Supabase profile/app metadata before owner tools are shown.

Owner access allows the creator to:

- Open the Owner Control Center.
- Open the full blank psychosocial intake workflow in Owner Review Mode.
- Preview the buyer workflow while bypassing Stripe only for the owner account.
- Load a fictitious demonstration case.
- Test editable draft PDF, final PDF, and print layout output.
- Click directly into every workflow section from the owner section index.

Owner access does not create a clinical record repository. Customer-entered client/member/participant information, drafts, uploaded logos, and completed packets are not stored for owner viewing.

### Owner role activation

1. Create or confirm the owner account in Supabase Auth.
2. Run `supabase/schema.sql` in Supabase SQL Editor so `profiles.account_role` exists.
3. Open `supabase/owner-role-activation.sql`.
4. Replace `<OWNER_EMAIL_HERE>` with the owner account email in the Supabase SQL Editor only.
5. Run the edited SQL in Supabase SQL Editor.
6. Do not commit the edited SQL with the real owner email address.
7. Sign in with the owner account and open `/owner`.

No additional environment variable is required for owner access. The owner account is activated through Supabase role data and server-verified app metadata.

### Owner feature testing

Run these checks before deploying owner-access changes:

```bash
pnpm run test:owner
pnpm run typecheck
pnpm build
```

Then sign in as the owner account and confirm:

1. `/owner` opens the Owner Control Center.
2. `/owner/intake?mode=review` opens the blank workflow with the Owner Review Mode banner.
3. `/owner/intake?mode=buyer` previews the normal purchaser workflow.
4. `/owner/intake?mode=review&demo=1` loads only fictitious demonstration data.
5. Draft PDF, final PDF, and print tests work from the Owner Control Center.
6. A non-owner account cannot open owner tools.

### Owner deployment steps

1. Commit and deploy the app after the build passes.
2. In Supabase, run `supabase/schema.sql` if the deployed database has not yet received the `account_role` column.
3. Run the edited `supabase/owner-role-activation.sql` in Supabase SQL Editor for the owner account only.
4. Do not add the owner email to the repository, browser code, Netlify public variables, or Stripe metadata.
5. Confirm the deployed owner account can open `/owner` without going through Stripe checkout.
6. Confirm regular buyer signup, Stripe checkout, webhook unlock, dashboard access, intake export, and print still work.

### Owner rollback

To remove owner access from an account without deleting buyer profiles or clinical workflow code, run this in Supabase SQL Editor for the affected owner email:

```sql
update public.profiles
set account_role = 'buyer', updated_at = now()
where lower(email) = lower('<OWNER_EMAIL_HERE>');

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) - 'account_role' - 'owner_access'
where lower(email) = lower('<OWNER_EMAIL_HERE>');
```

To fully roll back the owner feature code, revert the owner-access commit and redeploy. Do not delete the `profiles` table, buyer access fields, Stripe webhook settings, or any live buyer records.

Add these environment variables in Netlify:

```bash
NEXT_PUBLIC_SITE_URL=https://your-netlify-site.netlify.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STANDARD_ACCESS_UPFRONT_PRICE_ID=
STRIPE_STANDARD_ACCESS_MONTHLY_PRICE_ID=
STANDARD_ACCESS_UPFRONT_PRICE_CENTS=48700
STANDARD_ACCESS_MONTHLY_PRICE_CENTS=1900
```

The Stripe price IDs are optional for local testing. If they are left blank, checkout creates inline Stripe prices for `$487` up front plus `$19/month`. For the live product, create one non-recurring Stripe Price for `$487` and one recurring monthly Stripe Price for `$19/month`, then add their IDs as `STRIPE_STANDARD_ACCESS_UPFRONT_PRICE_ID` and `STRIPE_STANDARD_ACCESS_MONTHLY_PRICE_ID` in Netlify.

In Stripe, create a webhook endpoint pointing to:

```text
https://your-netlify-site.netlify.app/api/stripe/webhook
```

Send the `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, and `customer.subscription.deleted` events to that endpoint. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Do not hard-code secret keys, Stripe secret keys, Supabase service role keys, backend payment logic, or payment credentials in browser code. Use Netlify environment variables.

For password reset emails, add this URL to the allowed redirect URLs in
Supabase Auth settings:

```text
https://your-netlify-site.netlify.app/reset-password
```

Use `http://127.0.0.1:3002/reset-password` as an additional local redirect URL
while testing on the local preview server.

## Example packet

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
