// Extracted unchanged from ef76ca0735ed841e82fa98eed48420724709468b:src/server/note/assessmentPlanTraceability.ts
// Only the four documentation type declarations are local; the instruction function is unchanged.
type DocumentationTypeId = "dap_note" | "dap_note_with_treatment_plan" | "soap_note" | "soap_note_with_treatment_plan";
const traceableProgressNoteTypes = new Set<DocumentationTypeId>(["dap_note", "dap_note_with_treatment_plan", "soap_note", "soap_note_with_treatment_plan"]);
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
