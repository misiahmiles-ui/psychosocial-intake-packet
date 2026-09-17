// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import {
  hasExplicitSafetyDenialText,
  isRevokedSafetyDenialText
} from "@/lib/leanmaster/src/support/adultSafetyClassification";
import {
  normalizeSupportText,
  segmentSupportSources,
  type SupportSourceInput
} from "@/lib/leanmaster/src/support/textNormalization";
import { documentationTypeCatalog } from "@/lib/leanmaster/src/server/note/documentationTypes";
import type { CareThreadContinuityItem } from "@/lib/leanmaster/src/server/note/careThreadContinuity";
import {
  diagnosisRegistry,
  diagnosesAreEquivalent,
  resolveDiagnosis,
  type DiagnosisId
} from "@/lib/leanmaster/src/clinical-guidance/diagnosisRegistry";
import {
  compareSafetyFactContracts,
  extractSafetyFactContract,
  safetyFactCategories,
  validateSafetyFactContract,
  type SafetyFactContract
} from "@/lib/leanmaster/src/server/note/safetyFactContract";

export const sourceEvidenceClassifications = [
  "EXPLICITLY_DOCUMENTED",
  "EXPLICITLY_DENIED",
  "HISTORICAL",
  "THIRD_PARTY_REPORT",
  "CLINICIAN_OBSERVATION",
  "USER_CONCLUSION",
  "NOT_DOCUMENTED",
  "INSUFFICIENT_EVIDENCE"
] as const;

export type SourceEvidenceClassification =
  (typeof sourceEvidenceClassifications)[number];

export type SourceEvidenceRecord = {
  sourceField: string;
  sourceLocation: string;
  classification: SourceEvidenceClassification;
  originalText: string;
  normalizedText: string;
};

export type NormalizedSourceEvidence = {
  schemaVersion: "source-evidence.v1";
  records: SourceEvidenceRecord[];
  normalizedAuthorityText: string;
  diagnosis: { id: DiagnosisId | null; canonicalLabel: string };
  safetyFacts: SafetyFactContract;
};

export type GroundingValidationSeverity = "advisory" | "fatal";

export type GroundingValidationFinding = {
  issue: string;
  severity: GroundingValidationSeverity;
  validator: "source_grounding";
  sourcePath?: string;
  outputPath?: string;
  detailCode?: string;
};

export type GroundingSourcePayload = {
  diagnosis?: string;
  diagnosisId?: string | null;
  dateOfService?: string;
  payerDisplay?: string;
  county?: string;
  programContext?: string;
  observedNeed?: string;
  staffSupport?: string;
  participantResponse?: string;
  followUpPlan?: string;
  careThreadContinuity?: CareThreadContinuityItem[];
};

const DENIAL =
  /\b(?:denies?|denied|denials?\s+of\s+(?:(?:any|current)\s+)?(?:suicidal|homicidal|psychotic|psychosis|hallucinations?|delusions?)|no|not\s+experiencing|without|negative\s+for|does\s+not\s+have|did\s+not\s+report|reports?\s+no|(?:does|did)\s+not\s+endorse|(?:is|was)\s+not\s+endorsing|endorses?\s+no)\b/i;
const HISTORICAL =
  /\b(?:history\s+of|historical(?:ly)?|previous(?:ly)?|in\s+the\s+past|prior|formerly|years?\s+ago|months?\s+ago|resolved)\b/i;
const THIRD_PARTY_ROLE =
  "mother|father|parent|guardian|family|sister|brother|spouse|husband|wife|partner|friend|school|teacher|caregiver|neighbor|landlord|prescriber|son|daughter|child";
const SOURCE_REPORTER =
  `client|member|patient|participant|${THIRD_PARTY_ROLE}`;
const REPORTING_VERB =
  "reports?|reported|states?|stated|said|expressed|voiced|requested|asked|is\\s+concerned|was\\s+concerned";
const THIRD_PARTY = new RegExp(
  `\\b(?:(?:the\\s+)?(?:${THIRD_PARTY_ROLE})\\s+(?:${REPORTING_VERB})|(?:based\\s+on|in\\s+response\\s+to)\\s+(?:the\\s+)?(?:${THIRD_PARTY_ROLE})(?:['’]s)?\\s+report|documented\\s+third-party\\s+reports?\\s+(?:indicate|indicates|suggest|suggests)|according\\s+to|per\\s+(?:the\\s+)?(?:${THIRD_PARTY_ROLE}))\\b`,
  "i"
);
const CLIENT_REPORTED = new RegExp(
  `\\b(?:the\\s+)?(?:client|member|patient|participant)\\s+(?:${REPORTING_VERB})\\b`,
  "i"
);
const THIRD_PARTY_ENTITY = new RegExp(`\\b(?:${THIRD_PARTY_ROLE})\\b`, "i");
const CLIENT_REPORTED_THIRD_PARTY_FACT = new RegExp(
  `\\b(?:the\\s+)?(?:client|member|patient|participant)\\s+(?:${REPORTING_VERB})\\b[^.!?]{0,90}\\b(?:${THIRD_PARTY_ROLE})\\b`,
  "i"
);
const CLINICIAN_OBSERVATION =
  /\b(?:clinician|staff|nurse|therapist|counselor)\s+(?:observed|noted|witnessed|documented)|\bobserved\s+by\s+(?:the\s+)?(?:clinician|staff|nurse|therapist|counselor)\b/i;
const INSUFFICIENT =
  /\b(?:unclear|uncertain|unknown|insufficient\s+(?:information|evidence)|(?:information|evidence)\s+is\s+insufficient|cannot\s+(?:confirm|determine)|not\s+enough\s+information)\b/i;

function classifyRecord(field: string, text: string): SourceEvidenceClassification {
  if (INSUFFICIENT.test(text)) return "INSUFFICIENT_EVIDENCE";
  if (
    THIRD_PARTY.test(text) ||
    (CLIENT_REPORTED.test(text) &&
      THIRD_PARTY_ENTITY.test(text) &&
      CLIENT_REPORTED_THIRD_PARTY_FACT.test(text))
  ) {
    return "THIRD_PARTY_REPORT";
  }
  if (DENIAL.test(text) || hasExplicitSafetyDenialText(text)) {
    return "EXPLICITLY_DENIED";
  }
  if (HISTORICAL.test(text)) return "HISTORICAL";
  if (CLINICIAN_OBSERVATION.test(text)) return "CLINICIAN_OBSERVATION";
  if (field === "observedNeed") return "USER_CONCLUSION";
  return "EXPLICITLY_DOCUMENTED";
}

export function sourceInputsForGrounding(
  payload: GroundingSourcePayload
): SupportSourceInput[] {
  return [
    { field: "programContext", text: payload.programContext || "" },
    { field: "observedNeed", text: payload.observedNeed || "" },
    { field: "staffSupport", text: payload.staffSupport || "" },
    { field: "participantResponse", text: payload.participantResponse || "" },
    { field: "followUpPlan", text: payload.followUpPlan || "" },
    ...(payload.careThreadContinuity || []).map((item, index) => ({
      field: `careThreadContinuity.${index}`,
      text: `Care topic: ${item.topic}\nStatus: ${item.status}\nSpecific client update: ${item.update}`
    }))
  ];
}

export function buildNormalizedSourceEvidence(
  payload: GroundingSourcePayload
): NormalizedSourceEvidence {
  const sources = sourceInputsForGrounding(payload);
  const sourceSegments = segmentSupportSources(sources);
  const canonicalSourceText = sourceSegments
    .map((segment) => segment.originalText)
    .join("\n");
  const records = sourceSegments.map(
    (segment): SourceEvidenceRecord => ({
      sourceField: segment.sourceField,
      sourceLocation: segment.sourceLocation,
      classification: classifyRecord(
        segment.sourceField,
        segment.normalizedText
      ),
      originalText: segment.originalText,
      normalizedText: segment.normalizedText
    })
  );

  for (const source of sources) {
    if (!source.text.trim()) {
      records.push({
        sourceField: source.field,
        sourceLocation: `${source.field}:not-documented`,
        classification: "NOT_DOCUMENTED",
        originalText: "",
        normalizedText: ""
      });
    }
  }

  const selectedFacts = [
    payload.diagnosis,
    payload.dateOfService,
    payload.payerDisplay,
    payload.county
  ].filter((value): value is string => Boolean(value?.trim()));
  const resolvedDiagnosis = resolveDiagnosis(
    payload.diagnosis,
    payload.diagnosisId
  );
  const safetyFacts = extractSafetyFactContract(canonicalSourceText);
  return {
    schemaVersion: "source-evidence.v1",
    records,
    normalizedAuthorityText: normalizeSupportText(
      [canonicalSourceText, ...selectedFacts].join("\n")
    ),
    diagnosis: {
      id: resolvedDiagnosis.id,
      canonicalLabel: resolvedDiagnosis.canonicalLabel
    },
    safetyFacts
  };
}

export function sourceEvidencePromptSummary(evidence: NormalizedSourceEvidence) {
  return evidence.records
    .filter((record) => record.classification !== "NOT_DOCUMENTED")
    .map(
      (record) =>
        `${record.sourceLocation} [${record.classification}]: ${record.originalText}`
    )
    .join("\n");
}

type ProtectedConcept = { id: string; pattern: RegExp };

const PROTECTED_CONCEPTS: ProtectedConcept[] = [
  { id: "depression", pattern: /\b(?:depress(?:ion|ed|ive)|major depressive disorder)\b/i },
  { id: "anxiety", pattern: /\b(?:anxiety|anxious|panic attacks?)\b/i },
  { id: "mania", pattern: /\b(?:mania|manic|bipolar disorder)\b/i },
  { id: "trauma", pattern: /\b(?:ptsd|post[- ]traumatic stress disorder|trauma symptoms?)\b/i },
  { id: "sleep", pattern: /\b(?:insomnia|sleep disturbance|difficulty sleeping)\b/i },
  { id: "appetite", pattern: /\b(?:poor appetite|appetite loss|decreased appetite)\b/i },
  { id: "medication", pattern: /\b(?:medication|medications|medicine|prescription|antidepressant|antipsychotic|mood stabilizer)\b/i },
  { id: "treatment_history", pattern: /\b(?:treatment history|previous treatment|prior treatment|psychiatric hospitalization|hospitalized for psychiatric)\b/i },
  { id: "housing", pattern: /\b(?:homeless|homelessness|eviction|rent arrears|housing instability|unsafe housing|shelter)\b/i },
  { id: "financial", pattern: /\b(?:financial hardship|financial stress|income loss|unemployed|job loss|unable to afford|debt)\b/i },
  { id: "function", pattern: /\b(?:unable to (?:bathe|dress|walk|transfer|cook|clean)|requires? assistance with|functional limitation|activities of daily living|\badls?\b)\b/i },
  { id: "substance", pattern: /\b(?:substance use|alcohol use|drug use|opioid use|cocaine use|cannabis use)\b/i },
  { id: "violence", pattern: /\b(?:violence risk|violent behavior|assaulted|physical aggression)\b/i }
];

const DIAGNOSIS_CLAIM =
  /\b(?:diagnos(?:is|ed)\s*(?::|with|of|is)?\s*)([a-z][^.;\n]{1,70})/i;
const REGISTERED_DIAGNOSIS_LABELS = diagnosisRegistry
  .flatMap((entry) => [entry.label, ...entry.aliases])
  .sort((left, right) => right.length - left.length);

function registeredDiagnosisMentions(text: string) {
  const normalized = normalizeSupportText(text);
  return REGISTERED_DIAGNOSIS_LABELS.filter((label) => {
    const candidate = normalizeSupportText(label);
    return new RegExp(`(?:^|\\b)${candidate.replace(/\s+/g, "\\s+")}(?:\\b|$)`, "i").test(normalized);
  });
}
const AGE_CLAIM = /\b(?:age(?:d)?\s*)?(\d{1,3})[- ]year[- ]old\b|\baged\s+(\d{1,3})\b/i;
const DATE_CLAIM =
  /\b(?:\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4})|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,\s*\d{4})?)\b/gi;
const RELATIONSHIP_WORD =
  /\b(?:mother|father|parent|guardian|family|sister|brother|spouse|husband|wife|partner|son|daughter|child|caregiver|friend|neighbor|landlord|prescriber|teacher|school)\b/gi;
const RECEIVED_SERVICE =
  /\b(?:received|attended|completed|enrolled\s+in|admitted\s+to|discharged\s+from)\s+(?:[a-z-]+\s+){0,4}(?:therapy|counseling|treatment|services?|program|hospital|clinic|group)\b/gi;
const QUOTED_TEXT = /["“]([^"”]{3,})["”]/g;
const RECOMMENDATION =
  /\b(?:recommend(?:s|ed|ing|ation|ations)?|should|consider|plan\s+to|will\s+(?:review|coordinate|follow|monitor|support))\b/i;

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for",
  "with", "was", "were", "is", "are", "has", "had", "that", "this", "member",
  "client", "patient", "participant", "reported", "stated", "said", "noted",
  "during"
]);

function salientTokens(text: string) {
  return normalizeSupportText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

function overlapsMaterially(left: string, right: string) {
  const expected = new Set(salientTokens(left));
  let overlap = 0;
  for (const token of new Set(salientTokens(right))) {
    if (expected.has(token)) overlap += 1;
  }
  return overlap >= Math.min(2, expected.size);
}

function sharesProtectedConcept(left: string, right: string) {
  return PROTECTED_CONCEPTS.some(
    (concept) => concept.pattern.test(left) && concept.pattern.test(right)
  );
}

function isRecommendationSection(section: string) {
  return /\b(?:plan|recommendations?|interventions?|follow[- ]?up|objectives?|goals?|support)\b/i.test(
    section.replace(/^[ivx]+\.\s*/i, "")
  );
}

const registeredDocumentationSectionHeadings = new Set(
  Object.values(documentationTypeCatalog)
    .flatMap(({ sectionHeadings }) => sectionHeadings)
    .map((heading) =>
      normalizeSupportText(
        heading.replace(/^\w+\.\s*/, "").replace(/:\s*$/, "")
      )
    )
);

function isRegisteredDocumentationSectionHeading(heading: string) {
  return registeredDocumentationSectionHeadings.has(
    normalizeSupportText(heading.replace(/^\w+\.\s*/, ""))
  );
}

function normalizedSectionHeadingCandidate(value: string) {
  return value
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/:\s*$/, "")
    .trim();
}

function isDocumentationSectionHeading(heading: string) {
  return (
    /^(?:Data|Assessment|Plan|Subjective|Objective|Interventions?|Recommendations?)(?:\s*\/\s*Follow[- ]?Up)?$/i.test(
      heading
    ) || isRegisteredDocumentationSectionHeading(heading)
  );
}

function generatedSentences(text: string) {
  const results: Array<{ section: string; text: string; outputPath: string }> = [];
  let section = "";
  let sentenceIndex = 0;
  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    let line = rawLine.trim();
    if (!line) continue;
    const inlineHeading = line.match(
      /^(?:#{1,6}\s*)?(?:\*\*)?([^:*]{1,80}?)(?:\*\*)?\s*:\s*(.+)$/
    );
    if (inlineHeading) {
      const heading = normalizedSectionHeadingCandidate(inlineHeading[1]);
      if (isDocumentationSectionHeading(heading)) {
        section = heading.replace(/^\w+\.\s*/, "");
        line = inlineHeading[2].trim();
      }
    }
    const heading = normalizedSectionHeadingCandidate(line);
    if (isDocumentationSectionHeading(heading)) {
      section = heading.replace(/^\w+\.\s*/, "");
      continue;
    }
    for (const sentence of line.split(/(?<=[.!?])\s+/)) {
      if (sentence.trim()) {
        sentenceIndex += 1;
        results.push({
          section,
          text: sentence.trim(),
          outputPath: `${section || "Document"}:sentence-${sentenceIndex}`
        });
      }
    }
  }
  return results;
}

function relationshipIsSupported(relationship: string, authority: string) {
  const candidate = normalizeSupportText(relationship);
  const authorityRelationships = new Set(
    Array.from(authority.matchAll(RELATIONSHIP_WORD), (match) =>
      normalizeSupportText(match[0])
    )
  );
  return authorityRelationships.has(candidate);
}

export function groundingValidationSeverity(
  _issue: string
): GroundingValidationSeverity {
  // Natural-language grounding is defense in depth only. The server-created
  // source-fact and atomic-safety records are the sole fatal authorities.
  return "advisory";
}

function sourceReporter(text: string) {
  const normalized = normalizeSupportText(text);
  const direct = normalized.match(
    new RegExp(
      `\\b(?:the\\s+)?(${SOURCE_REPORTER})\\s+(?:${REPORTING_VERB})\\b`,
      "i"
    )
  );
  if (direct?.[1]) return direct[1].toLowerCase();
  const attributed = normalized.match(
    new RegExp(
      `\\b(?:according\\s+to|per|based\\s+on|in\\s+response\\s+to)\\s+(?:the\\s+)?(${THIRD_PARTY_ROLE})`,
      "i"
    )
  );
  return attributed?.[1]?.toLowerCase() || "";
}

function reporterAttributionPattern(reporter: string) {
  const escaped = reporter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `\\b(?:(?:the\\s+)?${escaped}\\s+(?:${REPORTING_VERB})|(?:based\\s+on|in\\s+response\\s+to|according\\s+to|per)\\s+(?:the\\s+)?${escaped}(?:['’]s)?\\s+report)\\b`,
    "i"
  );
}

function isProspectiveActionSentence(sentence: { section: string; text: string }) {
  return (
    /\b(?:goals?|objectives?|interventions?|recommendations?|follow[- ]?up)\b/i.test(
      sentence.section
    ) ||
    (isRecommendationSection(sentence.section) &&
      /\b(?:will|may|should|proposed|recommended|plans?\s+to|at\s+the\s+next\s+contact)\b/i.test(
        sentence.text
      ))
  );
}

function hasAnyReporterAttribution(text: string) {
  return (
    THIRD_PARTY.test(text) ||
    new RegExp(
      `\\b(?:the\\s+)?(?:client|member|patient|participant)\\s+(?:${REPORTING_VERB})\\b|\\b(?:based\\s+on|in\\s+response\\s+to|according\\s+to|per)\\s+(?:the\\s+)?(?:client|member|patient|participant)(?:['’]s)?\\s+report\\b`,
      "i"
    ).test(text)
  );
}

function preservesReporterAttribution(text: string, reporter: string) {
  return reporter ? reporterAttributionPattern(reporter).test(text) : THIRD_PARTY.test(text);
}

function unsupportedProtectedConcepts(text: string, authority: string) {
  return PROTECTED_CONCEPTS
    .filter((concept) => concept.pattern.test(text) && !concept.pattern.test(authority))
    .map((concept) => concept.id);
}

export function validateGroundedClinicalOutput(options: {
  text: string;
  evidence: NormalizedSourceEvidence;
}) {
  const issues: string[] = [];
  const detailedFindings: GroundingValidationFinding[] = [];
  const authority = options.evidence.normalizedAuthorityText;
  const sentences = generatedSentences(options.text);
  const generatedSafetyFacts = extractSafetyFactContract(options.text);
  issues.push(
    ...compareSafetyFactContracts(
      options.evidence.safetyFacts,
      generatedSafetyFacts
    )
  );

  for (const concept of unsupportedProtectedConcepts(options.text, authority)) {
    issues.push(`unsupported_clinical_concept:${concept}`);
  }

  const diagnosis = options.text.match(DIAGNOSIS_CLAIM)?.[1]?.trim();
  if (
    diagnosis &&
    !diagnosesAreEquivalent(
      diagnosis,
      options.evidence.diagnosis.canonicalLabel
    ) &&
    !authority.includes(normalizeSupportText(diagnosis))
  ) {
    issues.push("unsupported_diagnosis");
  }
  for (const mention of registeredDiagnosisMentions(options.text)) {
    if (
      !options.evidence.diagnosis.canonicalLabel ||
      !diagnosesAreEquivalent(
        mention,
        options.evidence.diagnosis.canonicalLabel
      )
    ) {
      issues.push("unsupported_diagnosis");
      break;
    }
  }

  if (AGE_CLAIM.test(options.text) && !AGE_CLAIM.test(authority)) {
    issues.push("unsupported_age");
  }
  for (const match of options.text.matchAll(DATE_CLAIM)) {
    if (!authority.includes(normalizeSupportText(match[0]))) {
      issues.push("unsupported_date");
      break;
    }
  }
  for (const sentence of sentences) {
    for (const match of sentence.text.matchAll(RELATIONSHIP_WORD)) {
      if (!relationshipIsSupported(match[0], authority)) {
        issues.push("unsupported_relationship");
        detailedFindings.push({
          issue: "unsupported_relationship",
          severity: "fatal",
          validator: "source_grounding",
          outputPath: sentence.outputPath,
          detailCode: `generated_relationship:${normalizeSupportText(match[0])}`
        });
        break;
      }
    }
    if (issues.includes("unsupported_relationship")) break;
  }
  for (const match of options.text.matchAll(RECEIVED_SERVICE)) {
    if (!authority.includes(normalizeSupportText(match[0]))) {
      issues.push("unsupported_service_history");
      break;
    }
  }
  for (const match of options.text.matchAll(QUOTED_TEXT)) {
    const quotedWords = normalizeSupportText(match[1]).replace(
      /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
      ""
    );
    if (!quotedWords || !authority.includes(quotedWords)) {
      issues.push("unsupported_quotation");
      break;
    }
  }

  for (const record of options.evidence.records) {
    if (!record.originalText) continue;
    const related = sentences.filter((sentence) =>
      overlapsMaterially(record.originalText, sentence.text) ||
      sharesProtectedConcept(record.originalText, sentence.text)
    );
    if (record.classification === "THIRD_PARTY_REPORT") {
      const reporter = sourceReporter(record.originalText);
      const unattributed = related.find(
        (sentence) =>
          !isProspectiveActionSentence(sentence) &&
          !preservesReporterAttribution(sentence.text, reporter)
      );
      if (unattributed) {
        issues.push("third_party_attribution_lost");
        detailedFindings.push({
          issue: "third_party_attribution_lost",
          severity: "fatal",
          validator: "source_grounding",
          sourcePath: record.sourceLocation,
          outputPath: unattributed.outputPath,
          detailCode: hasAnyReporterAttribution(unattributed.text)
            ? "reporter_mismatch"
            : "attribution_missing"
        });
      }
    } else if (record.classification === "HISTORICAL") {
      if (related.some((sentence) => !HISTORICAL.test(sentence.text))) {
        issues.push("historical_fact_made_current");
      }
    } else if (record.classification === "EXPLICITLY_DENIED") {
      const deniedSafetyFacts = safetyFactCategories.filter(
        (category) => options.evidence.safetyFacts.facts[category].state === "DENIED"
      );
      if (
        related.some(
          (sentence) => {
            const sentenceFacts = extractSafetyFactContract(sentence.text);
            return (
              deniedSafetyFacts.some(
                (category) => sentenceFacts.facts[category].state === "PRESENT"
              ) || isRevokedSafetyDenialText(sentence.text)
            );
          }
        )
      ) {
        issues.push("denial_changed_to_positive");
      }
    }
  }

  for (const sentence of sentences) {
    if (
      RECOMMENDATION.test(sentence.text) &&
      !isRecommendationSection(sentence.section)
    ) {
      issues.push("recommendation_not_separated_from_facts");
      detailedFindings.push({
        issue: "recommendation_not_separated_from_facts",
        severity: "advisory",
        validator: "source_grounding",
        outputPath: sentence.outputPath,
        detailCode: "recommendation_outside_plan"
      });
    }
  }

  const uniqueIssues = Array.from(new Set(issues));
  const findings = [
    ...detailedFindings,
    ...uniqueIssues
      .filter(
        (issue) => !detailedFindings.some((finding) => finding.issue === issue)
      )
      .map(
        (issue): GroundingValidationFinding => ({
          issue,
          severity: groundingValidationSeverity(issue),
          validator: "source_grounding"
        })
      )
  ];

  return uniqueIssues.length
    ? {
        valid: false,
        reason: "The generated note contained content that was not grounded in the submitted source material.",
        issues: uniqueIssues,
        findings
      }
    : {
        valid: true,
        issues: [] as string[],
        findings: [] as GroundingValidationFinding[]
      };
}

export function validateSourceEvidence(evidence: NormalizedSourceEvidence) {
  return (
    evidence.schemaVersion === "source-evidence.v1" &&
    evidence.records.length >= 4 &&
    evidence.records.every((record) =>
      sourceEvidenceClassifications.includes(record.classification)
    ) &&
    validateSafetyFactContract(evidence.safetyFacts)
  );
}

// Expose unchanged source classification/attribution primitives for schema adaptation.
export { classifyRecord, sourceReporter, preservesReporterAttribution };
