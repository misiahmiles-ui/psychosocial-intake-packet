// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import type { DocumentationTypeId } from "@/lib/leanmaster/src/server/note/documentationTypes";

const traceableProgressNoteTypes = new Set<DocumentationTypeId>([
  "dap_note",
  "dap_note_with_treatment_plan",
  "soap_note",
  "soap_note_with_treatment_plan"
]);

const performedInterventionPattern =
  /\b(?:clinician|staff|provider|nurse|therapist|counselor|case manager|care coordinator)\s+(?:(?:has|had)\s+)?(?:provided|completed|used|reviewed|practiced|guided|taught|introduced|explored|validated|facilitated|conducted|coordinated|referred|contacted|assisted|supported)\b|\b(?:CBT|DBT|MI|ACT|cognitive behavioral therapy|dialectical behavior therapy|motivational interviewing|acceptance and commitment therapy|trauma-informed (?:care|engagement)|supportive counseling|psychoeducation|grounding|skills? practice|care coordination|resource navigation|problem[- ]solving|intervention)\s+(?:(?:was|were)\s+)?(?:provided|completed|used|reviewed|practiced|conducted)\b|\bwork completed during (?:the )?session\b/i;

const clientCommitmentPattern =
  /\b(?:client|member|patient|participant)\s+(?:agreed(?:\s+to)?|will|plans?\s+to|intends?\s+to|committed\s+to)\b/i;

const nonCommitmentPassivePattern =
  /\b(?:client|member|patient|participant)\s+will\s+be\s+(?:offered|supported|assisted|contacted|referred|asked|invited)\b/i;

const payerActionPattern =
  /\b(?:payer|mco|insurance|benefits? verification|eligibility|authorization|service availability)\b/i;

const internalTraceabilityLabelPattern =
  /\b(?:according to (?:the )?raw data|source field|traceability code|leanmaster factual client record|clinical_guidance_context|guidance_not_client_evidence)\b/i;

const automaticModalityListPattern =
  /(?=[\s\S]*\bCBT\b)(?=[\s\S]*\bDBT\b)(?=[\s\S]*\bMI\b)(?=[\s\S]*\bACT\b)/i;

const tokenStopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "assessment",
  "before",
  "client",
  "completed",
  "clinician",
  "continued",
  "during",
  "follow",
  "member",
  "patient",
  "participant",
  "plan",
  "provided",
  "session",
  "staff",
  "their",
  "these",
  "those",
  "through",
  "using",
  "with"
]);

function isTraceableProgressNoteType(documentationTypeId: DocumentationTypeId) {
  return traceableProgressNoteTypes.has(documentationTypeId);
}

export function assessmentPlanTraceabilityInstructions(
  documentationTypeId: DocumentationTypeId
) {
  if (!isTraceableProgressNoteType(documentationTypeId)) return "";

  const isSoap =
    documentationTypeId === "soap_note" ||
    documentationTypeId === "soap_note_with_treatment_plan";
  const includesTreatmentPlan =
    documentationTypeId === "dap_note_with_treatment_plan" ||
    documentationTypeId === "soap_note_with_treatment_plan";

  return [
    "ASSESSMENT AND PLAN TRACEABILITY CONTRACT - HIGHEST PRIORITY FOR DAP/SOAP:",
    "This contract replaces the legacy fixed four-bullet Plan, automatic modality list, generic homework, and automatic referral/payer language.",
    "Raw clinician-entered session fields establish client facts and completed work. Assessment interprets those facts. Plan responds to Assessment. Diagnosis and all guidance sources provide clinical context only and never establish a current client fact or prove that an intervention occurred.",
    "ASSESSMENT ORDER AND GROUNDING:",
    "1. Begin with the documented presentation, symptoms, concerns, or functional difficulty. Preserve whether each item was client-reported, clinician-observed, otherwise documented, unknown, or not assessed.",
    "2. Connect those facts to the documented or reasonably interpreted effect on this client's daily functioning, treatment participation, medication-management follow-through, attendance, relationships, housing stability, personal care, safety, coping, or community participation.",
    "3. Include progress, engagement, strengths, willingness, or response only when supported. Include barriers only when supported.",
    "4. Explain why continued intervention or follow-up is relevant now by tying it to the documented functional effect; do not use a generic medical-necessity sentence.",
    "5. Qualify clinical interpretation with wording such as suggests, appears consistent with, may interfere with, or may be at risk if the documented pattern continues. Never convert an interpretation into a confirmed fact.",
    "6. A client-reported belief, perception, or concern must remain attributed to the client. Do not independently verify it, relabel it as a symptom, or infer psychosis, hallucinations, or delusions from it.",
    "6A. Preserve the exact reporter and relationship provenance for every third-party fact. For example, Client reported that his daughter helps must remain client-attributed; do not rewrite it as Daughter reported or as an independently confirmed fact. Mother, daughter, family, caregiver, landlord, prescriber, school, and other relationship labels may appear only when the clinician-entered source uses that exact relationship label. Diagnosis, intervention cards, guidance, modules, and citations cannot create or broaden a relationship.",
    "7. Include safety information only at its documented atomic scope and polarity: present, denied, unknown, or not assessed. Diagnosis, interventions, guidance, resources, and citations cannot create or alter a safety fact.",
    "8. Write a natural professional Assessment. Do not expose source labels, traceability codes, or phrases such as according to the raw data.",
    isSoap
      ? "SOAP boundary: ground Assessment in both Subjective and Objective. Keep client reports attributed to the client and keep objective observations separate from subjective statements."
      : "DAP boundary: ground Assessment in Data and do not unnecessarily change the existing Data structure.",
    "PLAN ORDER AND TEMPORAL BOUNDARIES:",
    "Use the following relative order when supported, omitting unsupported items and renumbering the remaining items naturally:",
    "1. Work completed during the session. State only actions explicitly documented in Staff Intervention or raw session data. Selected library guidance never proves completion.",
    "2. Reason for continued intervention. Briefly connect the next step to the specific symptom, functional effect, barrier, or follow-through concern established in Assessment.",
    "3. Library-guided continued approach. Tailor selected or server-routed guidance to documented facts, current engagement, and role. If an action is not independently documented as performed, use future language such as clinician will introduce, clinician will offer, or the guidance may inform the next contact.",
    "4. Client actions or homework. Use agreed, will, or plans to only when the entered record documents that commitment. Otherwise describe the action as recommended, offered, or to be discussed. Never invent homework or agreement.",
    "5. Clinician actions. Routine therapeutic planning is prospective and may be professionally synthesized when grounded in the current case, Assessment, selected treatment direction, or authorized Clinical Library guidance. Clinician will may be appropriate for ordinary monitoring, review, reinforcement, continued counseling, psychoeducation, exploration, and coping support.",
    "5A. Consequential commitments. Provider or family contact, outside referral, agency notification, record transmission, external scheduling, treatment-frequency changes, and deadlines require explicit clinician-entered or professional-selected authorization. Otherwise use nonbinding recommendation wording when clinically appropriate or omit the action.",
    "6. Follow-up measures. Identify the observable or reportable facts to monitor or review, such as sleep, symptoms, attendance, appointment completion, medication follow-through, coping-skill use/effect, avoidance, personal-care ability, housing status, reassessed safety statements, or progress toward an entered goal. Do not invent a measurement or deadline.",
    "7. Treatment-plan connection. Include a connection only when a specific goal or objective was entered or selected. Never invent a treatment-plan goal.",
    "Do not automatically list CBT, DBT, MI, ACT, trauma-informed care, or any other modality. Name an approach only when supported by documented work, selected guidance, or a role-appropriate next-step recommendation.",
    "Preserve the actor: a client agreement remains a client action and does not by itself become a separate clinician commitment. A prior Plan is prospective only and never proves that the planned action was completed in a later encounter.",
    "Do not automatically add payer, eligibility, authorization, benefit-verification, service-availability, referral, or coordination boilerplate. Payer metadata alone does not establish a payer action.",
    "The Plan may be a concise numbered list or cohesive paragraph, but the supported content must remain in the relative sequence above.",
    includesTreatmentPlan
      ? "After the traceable progress-note Plan is complete, keep the existing separate three-heading Treatment Plan workflow intact. Build it only from the completed progress note, preserve role boundaries, and do not turn a proposed objective into a documented client agreement."
      : "Do not append a formal Treatment Plan to this progress note."
  ].join("\n");
}

function normalizeHeading(value: string) {
  return value
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/:\s*$/, "")
    .trim()
    .toLowerCase();
}

const sectionHeadings = new Set([
  "data",
  "subjective",
  "objective",
  "assessment",
  "plan",
  "i. long-term goal",
  "ii. short-term objectives",
  "iii. interventions",
  "signature"
]);

function extractSection(text: string, requestedHeading: "assessment" | "plan") {
  const content: string[] = [];
  let inSection = false;

  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    const inline = line.match(
      /^(?:#{1,6}\s*)?(?:\*\*)?(Assessment|Plan)(?:\*\*)?\s*:\s*(.*)$/i
    );
    if (inline) {
      const heading = inline[1].toLowerCase();
      if (heading === requestedHeading) {
        inSection = true;
        if (inline[2].trim()) content.push(inline[2].trim());
      } else if (inSection) {
        break;
      }
      continue;
    }

    const heading = normalizeHeading(line);
    if (sectionHeadings.has(heading)) {
      if (heading === requestedHeading) {
        inSection = true;
        continue;
      }
      if (inSection) break;
    }

    if (inSection && line) content.push(line);
  }

  return content.join("\n").trim();
}

function stemToken(token: string) {
  return token
    .replace(/(?:ization|ation|ition)$/i, "")
    .replace(/(?:ments?|ness|ingly|edly|ing|ed|es|s)$/i, "");
}

function materialTokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(
        (token) =>
          (token.length >= 4 || /^(?:cbt|dbt|mi|act|erp|tic)$/.test(token)) &&
          !tokenStopWords.has(token)
      )
      .map(stemToken)
      .filter((token) => token.length >= 2)
  );
}

function overlapsMaterially(left: string, right: string) {
  const expected = materialTokens(left);
  for (const token of materialTokens(right)) {
    if (expected.has(token)) return true;
  }
  return false;
}

function sentences(text: string) {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function performedClaimCore(sentence: string) {
  const active = sentence.match(
    /\b(?:clinician|staff|provider|nurse|therapist|counselor|case manager|care coordinator)\s+(?:(?:has|had)\s+)?(?:provided|completed|used|reviewed|practiced|guided|taught|introduced|explored|validated|facilitated|conducted|coordinated|referred|contacted|assisted|supported)\s+(.+)/i
  );
  if (active) {
    return active[1].split(
      /\b(?:to address|in response to|because of|for the documented|related to the documented)\b/i
    )[0];
  }
  const passive = sentence.match(
    /(.+?)\s+(?:(?:was|were)\s+)?(?:provided|completed|used|reviewed|practiced|conducted)\b/i
  );
  if (passive) return passive[1];
  return sentence.replace(/^.*?work completed during (?:the )?session\s*:?\s*/i, "");
}

export type AssessmentPlanTraceabilityValidation = {
  valid: boolean;
  issues: string[];
};

export function validateAssessmentPlanTraceability(options: {
  text: string;
  documentationTypeId: DocumentationTypeId;
  programContext?: string;
  observedNeed?: string;
  staffSupport?: string;
  followUpPlan?: string;
}): AssessmentPlanTraceabilityValidation {
  if (!isTraceableProgressNoteType(options.documentationTypeId)) {
    return { valid: true, issues: [] };
  }

  const issues: string[] = [];
  const assessment = extractSection(options.text, "assessment");
  const plan = extractSection(options.text, "plan");
  const completedWorkAuthority = [options.programContext, options.staffSupport]
    .filter(Boolean)
    .join("\n");
  const commitmentAuthority = [
    options.programContext,
    options.observedNeed,
    options.staffSupport,
    options.followUpPlan
  ]
    .filter(Boolean)
    .join("\n");
  const commitmentSources = sentences(commitmentAuthority).filter((sentence) =>
    clientCommitmentPattern.test(sentence)
  );

  for (const sentence of sentences(plan)) {
    if (
      performedInterventionPattern.test(sentence) &&
      !overlapsMaterially(performedClaimCore(sentence), completedWorkAuthority)
    ) {
      issues.push("unsupported_performed_intervention");
    }
    if (
      clientCommitmentPattern.test(sentence) &&
      !nonCommitmentPassivePattern.test(sentence) &&
      !commitmentSources.some((source) => overlapsMaterially(sentence, source))
    ) {
      issues.push("unsupported_client_commitment");
    }
  }

  if (
    payerActionPattern.test(plan) &&
    !payerActionPattern.test(commitmentAuthority)
  ) {
    issues.push("unsupported_payer_coordination");
  }
  if (automaticModalityListPattern.test(plan)) {
    issues.push("automatic_modality_list");
  }
  if (internalTraceabilityLabelPattern.test(`${assessment}\n${plan}`)) {
    issues.push("internal_traceability_label_exposed");
  }

  const uniqueIssues = Array.from(new Set(issues));
  return { valid: uniqueIssues.length === 0, issues: uniqueIssues };
}
