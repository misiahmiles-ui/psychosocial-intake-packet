export const LEGAL_PROVIDER_NAME = "Marvin Miles";
export const LEGAL_BRAND_NAME = "Marvin M Digital Products";
export const LEGAL_CONTACT_EMAIL = "misiahmiles@gmail.com";
export const TERMS_VERSION = "2026-07-14";
export const PRIVACY_VERSION = "2026-07-14";
export const LEGAL_EFFECTIVE_DATE = "July 14, 2026";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Agreement and authority",
    paragraphs: [
      `These Terms of Service ("Terms") govern access to Adult Day Intake Pro, Adult Day Nursing Intake Pro, Adult Day Complete Intake Suite, and related account, billing, seat-management, PDF, print, update, and addendum features (collectively, the "Services") provided by ${LEGAL_PROVIDER_NAME}, operating under the ${LEGAL_BRAND_NAME} brand ("Provider," "we," "us," or "our").`,
      "Marvin Miles is the creator and owner of the Adult Day Intake product family (the \"Product Creator/Owner\"). The Product Creator/Owner is not the same as a purchasing facility, facility owner, customer administrator, or staff user. A facility or organization that purchases access is the \"Purchasing Facility\" or \"Customer\" and receives only the limited license described in these Terms; purchasing access does not transfer ownership of the software, workflow design, branding, or other Product Creator/Owner intellectual property.",
      "A \"Facility Administrator\" is the person authorized by the Purchasing Facility to manage its subscription, named staff accounts, and workflow-seat assignments. An \"Authorized User\" is an individually named staff member assigned access by the Purchasing Facility. Neither role makes that person an owner of the Services.",
      "By creating an account, accepting an invitation, starting checkout, or using a protected Service, you agree to these Terms. If you act for a facility or organization, you represent that you have authority to bind it. If you do not agree, do not create an account, purchase, or use a protected Service."
    ]
  },
  {
    title: "2. Documentation service - not professional judgment",
    paragraphs: [
      "The Services provide structured intake, documentation, review, PDF, and print workflows. They are not an electronic health record, medical advice, diagnosis, treatment, prescribing, provider orders, clinical decision-making, eligibility determination, legal advice, regulatory certification, or a substitute for qualified nursing, social-work, medical, compliance, or legal judgment.",
      "The facility is responsible for deciding whether each workflow is appropriate, adapting it to New Jersey and any other applicable requirements, and having qualified personnel review every entry and output before use or filing."
    ]
  },
  {
    title: "3. Facility licenses, accounts, and named seats",
    paragraphs: [
      "Unless an organizational Order Form states otherwise, one subscription covers one physical facility. Each staff member must use an individual account. Passwords, invitations, and sessions may not be shared.",
      "A Workflow Seat authorizes one named staff member to use one purchased workflow. The Complete Suite includes one Psychosocial Workflow Seat and one Nursing Workflow Seat. Those assignments may be given to two employees or both to one employee. Additional assignments require paid seats. The Product Creator/Owner's administrative access is separate from all Purchasing Facility and customer seats."
    ],
    bullets: [
      "Single-product additional seats are billed at the price presented at checkout or in the Order Form.",
      "Suite additional seats are workflow assignments, not separate products and not limits on PDF exports.",
      "Ten or more seats or multiple locations require written organizational pricing."
    ]
  },
  {
    title: "4. Facility administrators and users",
    paragraphs: [
      "The facility administrator controls staff invitations and workflow assignments and is responsible for promptly removing personnel who no longer need access. The facility is responsible for user conduct, accurate account information, suitable devices and networks, and safeguarding credentials.",
      "Single-session enforcement and seat controls reduce account sharing but do not replace the facility's supervision, access reviews, or security policies."
    ]
  },
  {
    title: "5. Fees, subscriptions, renewal, and cancellation",
    paragraphs: [
      "Prices, included seats, billing intervals, taxes, and any upfront fees are shown at checkout or in an Order Form. Recurring subscriptions continue until canceled. The facility authorizes the applicable payment processor to charge the selected payment method for recurring amounts and approved seat changes.",
      "Cancellation stops future renewal or billing as described in the account or Order Form; it does not automatically refund prior charges. Except where required by law or expressly stated in writing, upfront and completed billing-period charges are non-refundable and partial periods are not prorated. A failed or reversed payment may suspend access."
    ]
  },
  {
    title: "6. Participant information and official records",
    paragraphs: [
      "The intake workflows are designed so participant form responses remain in the active browser session until the user downloads, exports, or prints. The facility must not treat the browser session as permanent storage and must use an agency-approved secure location and official record process for exported files.",
      "The facility is responsible for confidentiality, accuracy, signatures, access, disclosure, retention, amendment, destruction, backups, incident response, and incorporation of exported documents into its designated record system. The facility must not submit participant or protected health information in account names, billing fields, support requests, or screenshots."
    ]
  },
  {
    title: "7. HIPAA and other legal compliance",
    paragraphs: [
      "The Services are not represented as universally HIPAA certified or legally sufficient for every facility. Unless Provider signs a separate Business Associate Agreement, the facility must not use Provider-controlled account, billing, support, analytics, or hosting channels to create, receive, maintain, or transmit protected health information on Provider's behalf.",
      "The facility is solely responsible for applicable privacy, security, breach-notification, adult-day, professional-licensure, Medicaid, payer, accessibility, employment, consent, record-retention, and other requirements."
    ]
  },
  {
    title: "8. Authorizations, consents, and signatures",
    paragraphs: [
      "Any authorization, consent, release, acknowledgment, or signature area is a documentation template. The facility must have its own counsel and compliance personnel approve the language and process before use and must determine the signer's identity, capacity, authority, informed consent, witness or notary requirements, and whether a wet or valid electronic signature is required.",
      "Typing a name into a draft field does not by itself create a complete electronic-signature service or guarantee enforceability."
    ]
  },
  {
    title: "9. Nursing updates and chart addenda",
    paragraphs: [
      "Nursing updates and addenda support documentation only. They are not provider orders, prescriptions, MARs, TARs, emergency protocols, or complete legal records. Qualified personnel must verify, sign, date, and file them without altering the original record and must follow facility policy, provider orders, and applicable law."
    ]
  },
  {
    title: "10. Acceptable use",
    paragraphs: [
      "You may not misuse the Services, bypass access or seat controls, share credentials, probe or disrupt security, introduce malicious code, copy or resell the Services, remove proprietary notices, use another facility's access, submit unlawful content, or use the Services for emergency response or autonomous clinical decisions.",
      "You must promptly report suspected unauthorized access, credential sharing, security issues, or material content concerns."
    ]
  },
  {
    title: "11. Third-party services",
    paragraphs: [
      "Authentication, hosting, payment, and infrastructure functions may be provided by third parties, including Supabase, Stripe, Netlify, and Vercel. Their services are governed by their own terms and may experience interruptions. Provider is not responsible for third-party services beyond Provider's obligations under applicable law and any written agreement."
    ]
  },
  {
    title: "12. Ownership and limited license",
    paragraphs: [
      "The Product Creator/Owner, Provider, and their licensors, as applicable, retain all rights in the Services, software, workflow design, branding, documentation, and protectable content. During an active paid subscription, Provider grants the Purchasing Facility a limited, non-exclusive, non-transferable, revocable license for its Authorized Users at the licensed facility to use the purchased workflows for internal operations. The purchase is a license to use the applicable Services, not a sale or transfer of the Services themselves.",
      "The facility retains rights in information it enters and in its exported records. Feedback may be used to improve the Services without identifying participant information."
    ]
  },
  {
    title: "13. Availability, updates, and support",
    paragraphs: [
      "Provider may maintain, secure, correct, or update the Services and may give notice of material changes. No uninterrupted or error-free operation is promised. The facility must maintain procedures that do not depend on the Services for emergencies or uninterrupted care.",
      "Support scope and response expectations are limited to what is stated in an Order Form or published support policy. Support is not clinical, legal, or emergency assistance."
    ]
  },
  {
    title: "14. Suspension and termination",
    paragraphs: [
      "Provider may suspend or terminate access for nonpayment, material breach, security risk, unlawful use, credential sharing, or conduct that threatens the Services or others. The facility may cancel as provided in its account, checkout disclosures, or Order Form.",
      "Before termination, the facility is responsible for downloading any account records it is entitled to retain. Participant workflow responses are not recoverable from Provider because the intake workflows are not designed as participant-data storage."
    ]
  },
  {
    title: "15. Disclaimers",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED \"AS IS\" AND \"AS AVAILABLE.\" PROVIDER DISCLAIMS IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, CLINICAL OUTCOME, REGULATORY COMPLIANCE, AND LEGAL SUFFICIENCY. No disclaimer limits a right that cannot lawfully be limited."
    ]
  },
  {
    title: "16. Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROVIDER WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR DAMAGES ARISING FROM CLINICAL DECISIONS, FACILITY RECORD HANDLING, OR UNAUTHORIZED CREDENTIAL USE.",
      "Provider's aggregate liability arising from the Services will not exceed the amounts the facility paid to Provider for the affected Services during the twelve months before the event giving rise to the claim. This section does not exclude liability that applicable law does not permit the parties to exclude."
    ]
  },
  {
    title: "17. Indemnification",
    paragraphs: [
      "To the extent permitted by law, the facility will defend and indemnify Provider from third-party claims arising from the facility's or its users' unlawful use, professional decisions, inaccurate or incomplete documentation, failure to obtain valid consent or signatures, mishandling of exported records, credential sharing, or violation of these Terms or applicable law. Provider will provide reasonable notice and cooperation."
    ]
  },
  {
    title: "18. Governing law, entire agreement, and changes",
    paragraphs: [
      "Unless a signed Order Form states otherwise, New Jersey law governs these Terms without regard to conflict-of-law principles, and the parties consent to state or federal courts located in New Jersey. An Order Form, these Terms, and any incorporated policies form the agreement; a signed Order Form controls over conflicting general Terms.",
      "Provider may update these Terms for legal, security, or service changes. Material changes will receive a new version and, when appropriate, require renewed acceptance before protected access."
    ]
  },
  {
    title: "19. Contact",
    paragraphs: [
      `Questions about these Terms may be sent to ${LEGAL_CONTACT_EMAIL}. Do not include participant, member, patient, or protected health information in the message.`
    ]
  }
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Scope",
    paragraphs: [
      `This Privacy Policy explains how ${LEGAL_PROVIDER_NAME} handles information associated with the Adult Day Intake product family, public websites, facility accounts, staff access, billing, support, and related Services. It does not replace a facility's own participant privacy notice or record policy.`
    ]
  },
  {
    title: "2. Information we collect",
    paragraphs: [
      "We may collect facility name and location; staff name, username, email, role, membership, workflow assignment, and authentication identifiers; product entitlements, seat quantities, subscription and billing status; legal-policy acceptance versions and timestamps; communications; and ordinary technical information such as device, browser, IP, security, and hosting logs.",
      "Payment card information is handled by Stripe. Provider generally receives transaction, customer, subscription, and status identifiers rather than complete card details."
    ]
  },
  {
    title: "3. Participant information and the no-retention workflow",
    paragraphs: [
      "The intake workflows are designed so participant form responses and facility logos remain in the active browser session and are not intentionally sent to Supabase, Stripe, Provider account databases, analytics, or support systems. Users control PDF download, export, and print output.",
      "Do not enter participant or protected health information in account profiles, facility names, payment fields, support requests, emails, analytics, or screenshots sent to Provider. If a future feature changes this data flow, this Policy and the applicable contractual/HIPAA analysis must be updated before that feature is used."
    ]
  },
  {
    title: "4. How we use information",
    paragraphs: [
      "We use account and service information to create and secure accounts; authenticate users; provide purchased workflow access; administer facilities, staff, seats, subscriptions, upgrades, and payments; prevent misuse; provide support; maintain and improve the Services; comply with law; enforce agreements; and respond to security or legal requests."
    ]
  },
  {
    title: "5. How information is shared",
    paragraphs: [
      "We may share limited information with service providers that support authentication, hosting, payment, communications, security, professional advice, and legal compliance. Current infrastructure may include Supabase, Stripe, Netlify, and Vercel. We may also disclose information when required by law, to protect rights or security, in a business transaction, or with the facility's direction.",
      "We do not sell participant intake information. The intake workflow is not designed to transmit participant responses to Provider."
    ]
  },
  {
    title: "6. Authentication technologies and logs",
    paragraphs: [
      "The Services may use necessary browser storage, cookies, tokens, and similar technologies for sign-in, session security, preferences, fraud prevention, and reliable operation. Hosting and security providers may generate logs. These technologies are for account and service operation, not participant-record storage."
    ]
  },
  {
    title: "7. Retention and deletion",
    paragraphs: [
      "We retain facility, account, entitlement, seat, billing, acceptance, security, and transaction records for as long as reasonably necessary to provide the Services, maintain evidence of transactions and agreements, prevent fraud, resolve disputes, and meet legal, tax, accounting, and security obligations.",
      "Account deletion requests are subject to required retention, active subscriptions, facility-administrator duties, security needs, and legal obligations. Deleting a user account does not delete PDFs or records controlled by the facility."
    ]
  },
  {
    title: "8. Security",
    paragraphs: [
      "We use reasonable administrative, technical, and organizational safeguards appropriate to the account and service information we handle. No online service is completely secure. Facilities must use unique accounts, strong passwords, approved devices and networks, timely access removal, and secure storage for downloaded or printed records."
    ]
  },
  {
    title: "9. HIPAA and facility responsibilities",
    paragraphs: [
      "This Policy does not state that Provider is a business associate for every customer or that the Services are universally HIPAA compliant. The facility must not transmit PHI to Provider-controlled account, billing, support, analytics, or hosting channels unless the parties have completed the required legal and technical review and signed any necessary agreement.",
      "The facility controls participant records it downloads or prints and is responsible for its own privacy notices, authorizations, security, access, retention, disclosure, and breach response."
    ]
  },
  {
    title: "10. Privacy choices and requests",
    paragraphs: [
      "Authorized users may update certain account information through the Services or facility administrator. Requests to access, correct, or delete Provider-held account information may be sent to the contact below. We may verify identity and authority and may deny or limit requests where permitted by law.",
      "Business contact and workforce information may not receive every consumer privacy right in every jurisdiction. We will respond as required by applicable law."
    ]
  },
  {
    title: "11. Children and individual consumer use",
    paragraphs: [
      "The Services are business tools for adult-day facilities and authorized workforce members. They are not directed to children and are not intended for participants or individual consumers to create accounts or submit their own health information."
    ]
  },
  {
    title: "12. Changes to this Policy",
    paragraphs: [
      "We may update this Policy to reflect service, legal, security, or vendor changes. We will post a new effective date and may require renewed acknowledgment for a material change before protected access."
    ]
  },
  {
    title: "13. Contact",
    paragraphs: [
      `Privacy and security questions may be sent to ${LEGAL_CONTACT_EMAIL}. Do not include participant, member, patient, or protected health information in the message.`
    ]
  }
];
