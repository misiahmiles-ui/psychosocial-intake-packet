// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import type {
  NoteOriginReviewEligibility,
  NoteOriginReviewUnitManifest,
  NoteOriginReviewUnitType,
  NoteOriginSentence,
  NoteOriginStatus
} from "@/lib/leanmaster/src/noteorigin/types";
import type { InternalNoteOriginSource } from "./sourceLedger";
import type {
  StructuredClaimKind,
  StructuredGeneratedNote,
  StructuredGeneratedProposition
} from "@/lib/leanmaster/src/server/note/sourceFactLedger";
import {
  classifyPlanProposition,
  clientActionReassignedToProfessional,
  hasExplicitConsequentialAuthorization,
  plannedSourceCannotProveCompletion
} from "@/lib/leanmaster/src/server/note/planProposition";

const stopWords = new Set(
  "a an and are as at attendance be been being by can client clinician could did do does during each for from had has have he her hers him his i in into is it its may member might of on or our participant patient professional psychiatric recent she should staff that the their them they this those to was were will with would reported reports stated states identified discussed continued continue current ongoing prior period similar changes importance attention pattern patterns reflect reflects suggests suggested indicating indicates demonstrates demonstrated including include symptoms symptom information session documentation treatment clinical overall use through".split(" ")
);

const semanticPhrases: Array<[RegExp, string]> = [
  [/\b(?:feeling\s+)?(?:increasingly|worsening|more)\s+depress(?:ed|ive)|\b(?:recent\s+increase\s+in\s+)?depressive\s+symptoms?|\bdepressed\s+mood\b/gi, " depressive_symptoms "],
  [/\b(?:current\s+)?mood[- ]related\s+distress\b/gi, " depressive_symptoms "],
  [/\b(?:decreased|reduced|low)\s+motivation\b/gi, " low_motivation "],
  [/\b(?:decreased|reduced|low)\s+energy\b/gi, " low_energy "],
  [/\b(?:increased|elevated|high)\s+energy\b/gi, " high_energy "],
  [/\b(?:decreased|reduced)\s+(?:need\s+for\s+)?sleep|\bless\s+sleep\s+needed\b/gi, " low_sleep_need "],
  [/\b(?:rapid|pressured)\s+speech\b/gi, " rapid_speech "],
  [/\b(?:increased|elevated)\s+activity\b/gi, " high_activity "],
  [/\bimpulsive\s+(?:online\s+)?spending|\bspending\s+(?:behavior|behaviour|patterns?)\b/gi, " impulsive_spending "],
  [/\b(?:difficulty|struggl\w*)\s+(?:with\s+)?(?:completing|managing)\s+(?:household|daily)\s+responsibilit\w*|\binterfere\w*\s+with[^.!?;]{0,50}\b(?:completion\s+of\s+)?daily\s+responsibilit\w*|\b(?:affect|affecting|interfere\w*\s+with)\s+daily\s+functioning\b/gi, " responsibility_difficulty daily_functioning "],
  [/\b(?:daily|functional)\s+(?:functioning|follow[- ]?through|progress)\b/gi, " daily_functioning "],
  [/\bfunctionally\s+connected\s+to\s+(?:household\s+)?responsibilit\w*|\bhousehold\s+responsibilit\w*/gi, " daily_functioning "],
  [/\bnegative\s+(?:thoughts?|self[- ]appraisal)|\bfailing\s+at\s+everything\b/gi, " negative_self_appraisal "],
  [/\b(?:continued\s+)?taking\s+prescribed\s+(?:psychiatric\s+)?medication|\bmedication\s+(?:adherence|follow[- ]?through)\b/gi, " medication_adherence "],
  [/\b(?:attended|completed)\s+(?:a\s+)?(?:recent\s+)?follow[- ]?up\s+appointment\s+with\s+(?:her|his|their|the)\s+psychiatric\s+provider|\battendance\s+at\s+(?:a\s+)?(?:recent\s+)?psychiatric\s+follow[- ]?up|\bpsychiatric\s+follow[- ]?up\b/gi, " psychiatric_followup "],
  [/\battended\s+(?:the\s+)?scheduled\s+(?:individual\s+)?session|\btreatment\s+(?:attendance|engagement|participation)\b/gi, " treatment_engagement "],
  [/\b(?:manageable\s+(?:tasks?|goals?)|identification\s+of\s+manageable\s+(?:tasks?|goals?))\b/gi, " manageable_tasks "],
  [/\b(?:selected|identified)\s+tasks?\s+(?:are|as)\s+(?:realistic|manageable)\b/gi, " manageable_tasks "],
  [/\b(?:participation|engagement)\s+in\s+symptom[- ]management\s+efforts\b/gi, " treatment_engagement "],
  [/\binterfere\w*\s+with\s+motivation\b/gi, " low_motivation "],
  [/\b(?:examining|considering|reviewing|consider)\s+evidence\s+for\s+and\s+against|\bcognitive\s+restructur\w*|\brefram\w*\s+(?:the\s+)?(?:thought|belief)|\b(?:supportive,?\s+nonclinical\s+)?coping(?:-skills?)?\s+reinforcement\b/gi, " cognitive_restructuring "],
  [/\b(?:more\s+)?(?:balanced|alternative)\s+(?:coping\s+)?(?:statement|thought)\b/gi, " balanced_thought "],
  [/\b(?:distressing\s+)?recurring\s+(?:negative\s+)?thought\b/gi, " recurring_thought "],
  [/\b(?:continue\s+)?(?:monitor|track)(?:ing)?\s+mood|\bmood\s+monitoring\b|\battention\s+to\s+mood\b/gi, " monitor_mood "],
  [/\b(?:continue\s+)?(?:monitor|track)(?:ing)?\s+(?:sleep|sleep\s+patterns?)|\bsleep\s+monitoring\b|\battention\s+to\s+sleep\b/gi, " monitor_sleep "],
  [/\b(?:continue\s+)?(?:monitor|track)(?:ing)?\s+(?:energy|energy\s+level)|\benergy\s+monitoring\b|\battention\s+to\s+energy\b/gi, " monitor_energy "],
  [/\b(?:continue\s+)?(?:monitor|track)(?:ing)?\s+(?:impulsive\s+)?spending|\bspending\s+monitoring\b|\battention\s+to\s+spending\b/gi, " monitor_spending "],
  [/\b(?:suicidal\s+ideation|suicidal\s+thoughts?|\bsi\b)/gi, " suicidal_ideation "],
  [/\b(?:homicidal\s+ideation|homicidal\s+thoughts?|\bhi\b)/gi, " homicidal_ideation "],
  [/\bhallucinations?\b/gi, " hallucination "],
  [/\bno\s+acute\s+safety\s+concerns?\b/gi, " no_acute_safety "],
  [/\b(?:attempt\s+to\s+|complet(?:e|ing)\s+)?one\s+load\s+of\s+laundry\b/gi, " one_load_laundry "],
  [/\bprepar(?:e|ing)\s+meals?|\bmeal\s+preparation\b|\bworkday\s+preparation\b/gi, " prepare_meals "],
  [/\b(?:consistent\s+)?bedtime|\bsleep\s+routine\b/gi, " bedtime "],
  [/\b(?:contact|report(?:ing)?)\s+(?:any\s+)?(?:significant\s+[^.!?;]{0,80}\s+to\s+)?(?:the\s+)?psychiatric\s+provider\b/gi, " contact_psychiatric_provider "],
  [/\bmonitor(?:ing)?\s+for\s+(?:the\s+)?recurrence\s+of\s+(?:significant\s+)?mood\s+elevation\b/gi, " monitor_mood high_energy "],
  [/\b(?:significant\s+)?mood\s+elevation\b/gi, " high_energy "],
  [/\b(?:have\s+since\s+)?resolved|\bno\s+longer\s+(?:present|active)\b/gi, " resolved "],
  [/\b(?:after|following)\s+medication\s+adjustment\b/gi, " post_medication_adjustment "],
  [/\b(?:approximately\s+)?three\s+months\s+ago\b/gi, " three_months_ago "]
];

const synthesisFramingWords = new Set(
  "addres appropriate appropriately appear bas care clinically connect connection consider contact continu continuity cop coping concern demonstrate develop distress document due encourage engagement focus follow function health help identify indicat link management need nonclinical practical profession provid realistic reinforce reinforcement relevant remain review select strength supportive support these while work".split(" ")
);

function normalized(value: string) {
  let result = value.normalize("NFKC").toLowerCase();
  for (const [pattern, replacement] of semanticPhrases) result = result.replace(pattern, replacement);
  return result.replace(/[^\p{L}\p{N}_$]+/gu, " ").replace(/\s+/g, " ").trim();
}

function stem(token: string) {
  if (token.includes("_") || token.startsWith("$")) return token;
  return token
    .replace(/(?:ingly|edly|ation|ations|ment|ments|ness|ically)$/u, "")
    .replace(/(?:ing|ed|es|s)$/u, "");
}

function tokenSet(value: string) {
  return new Set(
    normalized(value)
      .split(" ")
      .filter((token) => !stopWords.has(token))
      .map(stem)
      .filter((token) => token.length > 2 && !stopWords.has(token))
  );
}

function synthesisTokenSet(value: string) {
  return new Set([...tokenSet(value)].filter((token) => !synthesisFramingWords.has(token)));
}

function intersectionSize(left: Set<string>, right: Set<string>) {
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared;
}

function exactSupport(sentence: string, source: string) {
  const left = normalized(sentence);
  const right = normalized(source);
  return left.length >= 8 && right.length >= 8 && (left === right || right.includes(left));
}

const denied = /\b(?:no|not|never|den(?:y|ies|ied)|without|absent|negative\s+for|does\s+not|did\s+not)\b/i;
const currentState = /\b(?:currently|now|today|presently|is\s+experiencing|presents?\s+with|continues?\s+to\s+experience)\b/i;
const historicalState = /\b(?:history\s+of|historical|previously|prior|formerly|\d+\s+(?:days?|weeks?|months?|years?)\s+ago|one\s+(?:day|week|month|year)\s+ago|two\s+(?:days?|weeks?|months?|years?)\s+ago|three\s+(?:days?|weeks?|months?|years?)\s+ago|resolved)\b/i;
const resolvedState = /\b(?:resolved|since\s+resolved|no\s+longer\s+(?:present|active))\b/i;
const thirdParty = /\b(?:mother|father|parent|guardian|spouse|husband|wife|partner|sister|brother|caregiver|teacher|friend|neighbor|landlord|prescriber)\b/gi;
const performed = /\b(?:performed|completed|conducted|administered|implemented|provided|used)\b/i;
const prospective = /\b(?:plan|planned|continue|will|may|should|recommend|goal|objective|monitor|follow[- ]?up|if\s+.*return)\b/i;
const synthesisLanguage = /\b(?:suggests?|reflects?|indicates?|consistent\s+with|supports?|importance|rationale|while|appears?\s+to)\b/i;
const causation = /\b(?:caused|causes|resulted\s+in|led\s+to|because\s+of)\b/i;
const outcomeDueTo = /\b(?:resolved?|resolution|improv\w*|worsen\w*|episode|symptoms?)\b[^.!?;]{0,80}\bdue\s+to\b/i;
const futureOutcomeGoal = /\b(?:client|member|patient|participant)\s+will\s+(?:achieve|decrease|improve|increase|maintain)\b/i;
const improvement = /\b(?:significantly\s+improved|markedly\s+improved|treatment\s+response|responded\s+well|effective\s+in\s+reducing)\b/i;

function quantities(value: string) {
  return new Set(
    Array.from(
      value.toLowerCase().matchAll(/\$\s?\d[\d,]*(?:\.\d+)?|\b\d+(?:\.\d+)?\s*(?:minutes?|hours?|days?|weeks?|months?|years?|times?|loads?|dollars?)?\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|several|twice)\s+(?:minutes?|hours?|days?|weeks?|months?|years?|times?|loads?|nights?)\b/g),
      (match) => match[0].replace(/\s+/g, " ").trim()
    )
  );
}

function relationships(value: string) {
  return new Set(Array.from(value.toLowerCase().matchAll(thirdParty), (match) => match[0]));
}

function sourceEligible(sentence: string, source: InternalNoteOriginSource) {
  if (source.sourceType === "selected_intervention" && performed.test(sentence) && !prospective.test(sentence)) return false;
  if (source.sourceType === "selected_goal" && /\b(?:achieved|completed|met|accomplished)\b/i.test(sentence)) return false;
  if (source.sourceType === "care_thread" && /\b(?:reported|stated)\s+(?:today|during\s+today)/i.test(sentence)) return false;
  if (source.sourceType === "clinical_library") {
    if (!prospective.test(sentence) && !/\b(?:rationale|approach|strategy|intervention)\b/i.test(sentence)) return false;
    if (/\b(?:client|member|patient|participant)\s+(?:reported|stated|experienced|endorsed|denied|was|is|has)\b/i.test(sentence)) return false;
  }
  if (source.sourceType === "selected_diagnosis") {
    const sourceTokens = tokenSet(source.matchingText);
    const sentenceTokens = tokenSet(sentence);
    return intersectionSize(sourceTokens, sentenceTokens) > 0;
  }
  return true;
}

function contextCompatible(sentence: string, source: InternalNoteOriginSource) {
  if (!sourceEligible(sentence, source)) return false;
  const sourceTokens = tokenSet(source.matchingText);
  const scopedSentence = reviewSegments(sentence).reduce(
    (best, segment) =>
      intersectionSize(tokenSet(segment), sourceTokens) > intersectionSize(tokenSet(best), sourceTokens)
        ? segment
        : best,
    ""
  ) || sentence;
  const sentenceDenial = denied.test(scopedSentence);
  const sourceDenial = denied.test(source.matchingText);
  const protectedConcept = /\b(?:suicidal|homicidal|hallucination|psychosis|delusion|intent|plan|risk|safety)\b/i;
  if ((protectedConcept.test(scopedSentence) || protectedConcept.test(source.matchingText)) && sentenceDenial !== sourceDenial) return false;
  if (
    sentenceDenial !== sourceDenial &&
    intersectionSize(tokenSet(scopedSentence), sourceTokens) > 0
  ) return false;
  if (currentState.test(scopedSentence) && (historicalState.test(source.matchingText) || resolvedState.test(source.matchingText))) return false;
  const sentenceRelationships = relationships(scopedSentence);
  const sourceRelationships = relationships(source.matchingText);
  for (const relationship of sentenceRelationships) if (!sourceRelationships.has(relationship)) return false;
  return true;
}

function reviewSegments(value: string) {
  return value
    .split(/;\s+|\s+(?:but|however|although|while)\s+|\s+and\s+(?=(?:(?:the\s+)?(?:client|member|patient|participant)\s+)?(?:was|is|has|had|reported|stated|experienced|endorsed|denied)\b)/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function splitNoteOriginSentences(value: string) {
  const clean = value.replace(/\r\n?/g, "\n").trim();
  if (!clean) return [];
  return clean
    .split(/(?<=[.!?])\s+|\n+|;\s+(?=\S)/u)
    .map((unit) => unit.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function stableUnitId(sectionKey: string, text: string, occurrence: number) {
  let hash = 2166136261;
  for (const character of `${sectionKey}\0${normalized(text)}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${sectionKey.toUpperCase()}-${(hash >>> 0).toString(36).toUpperCase().padStart(7, "0")}-${occurrence}`;
}

export function noteOriginReviewUnits(sections: Array<{ key: string; heading: string; content: string }>) {
  return sections.flatMap((section) => {
    const occurrences = new Map<string, number>();
    return splitNoteOriginSentences(section.content).map((text) => {
      const key = normalized(text);
      const occurrence = (occurrences.get(key) || 0) + 1;
      occurrences.set(key, occurrence);
      return { ...section, text, id: stableUnitId(section.key, text, occurrence) };
    });
  });
}

function structuralIssues(
  sentence: string,
  supportingSources: InternalNoteOriginSource[],
  sectionKey: string,
  sectionLabel: string
) {
  const issues: string[] = [];
  const authority = supportingSources.map((source) => source.matchingText).join(" ");
  const planClassification = classifyPlanProposition(sentence, sectionKey, sectionLabel);
  const authorityQuantities = quantities(authority);
  for (const quantity of quantities(sentence)) if (!authorityQuantities.has(quantity)) issues.push(`unsupported_quantity:${quantity}`);
  if ((causation.test(sentence) || outcomeDueTo.test(sentence)) && !(causation.test(authority) || outcomeDueTo.test(authority))) issues.push("unsupported_causation");
  if (
    planClassification.kind === "consequential_professional_commitment" &&
    planClassification.professionalActor &&
    !hasExplicitConsequentialAuthorization(sentence, supportingSources)
  ) issues.push("unsupported_consequential_professional_commitment");
  if (clientActionReassignedToProfessional(sentence, supportingSources)) {
    issues.push("client_action_reassigned_to_professional");
  }
  if (plannedSourceCannotProveCompletion(sentence, supportingSources)) {
    issues.push("planned_action_used_as_completed_evidence");
  }
  if (
    /\blong[-_ ]?term\s+goal\b/i.test(`${sectionKey} ${sectionLabel}`) &&
    futureOutcomeGoal.test(sentence) &&
    !supportingSources.some(
      (source) => source.sourceType === "selected_goal" || futureOutcomeGoal.test(source.matchingText)
    )
  ) issues.push("unsupported_future_outcome_goal");
  if (improvement.test(sentence) && !improvement.test(authority)) issues.push("unsupported_treatment_improvement");
  if (currentState.test(sentence) && supportingSources.some((source) => historicalState.test(source.matchingText) || resolvedState.test(source.matchingText))) {
    issues.push("historical_or_resolved_fact_made_current");
  }
  return Array.from(new Set(issues));
}

function readableIssue(issue: string) {
  if (issue.startsWith("unsupported_quantity:")) return `The quantity “${issue.split(":").slice(1).join(":")}” was not found in current-generation source information.`;
  const labels: Record<string, string> = {
    unsupported_causation: "The statement changes an association or sequence into unsupported causation.",
    unsupported_treatment_improvement: "Treatment participation does not establish the stated clinical improvement.",
    unsupported_consequential_professional_commitment: "The statement creates a specific consequential professional commitment that was not entered or selected for this documentation event.",
    client_action_reassigned_to_professional: "A client-agreed future action cannot be changed into a separate professional commitment.",
    planned_action_used_as_completed_evidence: "A planned action does not establish that the action was later completed.",
    unsupported_future_outcome_goal: "The statement adds a long-term outcome goal that was not entered or selected for this documentation event.",
    historical_or_resolved_fact_made_current: "Historical or resolved information was changed into a current clinical state.",
    unsupported_diagnosis: "The statement introduces a diagnosis that was not selected or documented.",
    unsupported_relationship: "The statement introduces an unsupported relationship or third-party source.",
    third_party_attribution_lost: "The statement changes or removes a material third-party attribution.",
    denial_changed_to_positive: "The statement reverses documented denial or polarity.",
    unsupported_quotation: "The statement contains quoted language that is not present in the source record."
  };
  if (issue.startsWith("unsupported_safety_fact:") || issue.startsWith("changed_safety_fact:")) return "The statement conflicts with the authoritative safety and polarity record.";
  return labels[issue] || "An existing fail-closed clinical validator requires review of this statement.";
}

type NoteOriginClassification = Omit<
  NoteOriginSentence,
  | "id"
  | "sectionKey"
  | "sectionLabel"
  | "text"
  | "unitType"
  | "eligibility"
  | "changed"
>;

function statusFor(options: {
  sentence: string;
  sectionKey: string;
  sectionLabel: string;
  sources: InternalNoteOriginSource[];
  linkedSourceRefs: string[];
  changed: boolean;
  validatorIssues: string[];
}): NoteOriginClassification {
  const sentenceTokens = tokenSet(options.sentence);
  const synthesisContext = /\b(?:assessment|plan|objective|goal|intervention|recommendation)\b/i.test(`${options.sectionKey} ${options.sectionLabel}`);
  const coverageTokens = synthesisContext ? synthesisTokenSet(options.sentence) : sentenceTokens;
  const validLinked = new Set(options.linkedSourceRefs);
  const candidates = options.sources
    .filter((source) => contextCompatible(options.sentence, source))
    .map((source) => {
      const sourceTokens = tokenSet(source.matchingText);
      const shared = intersectionSize(sentenceTokens, sourceTokens);
      return {
        source,
        shared,
        score: sentenceTokens.size ? shared / sentenceTokens.size : 0,
        exact: exactSupport(options.sentence, source.matchingText),
        linked: validLinked.has(source.id)
      };
    })
    .filter((candidate) => candidate.exact || candidate.shared > 0)
    .filter((candidate) => !candidate.linked || candidate.score >= 0.2 || candidate.exact)
    .sort((left, right) => Number(right.exact) - Number(left.exact) || right.score - left.score);

  const eligibleCandidates = candidates
    .filter(
      (candidate) =>
        candidate.exact ||
        candidate.score >= 0.08 ||
        candidate.linked ||
        [...tokenSet(candidate.source.matchingText)].some(
          (token) =>
            (token.includes("_") || token === "resolved") &&
            sentenceTokens.has(token)
        )
    )
    .slice(0, 12);
  const selected: typeof eligibleCandidates = [];
  const selectedCoverage = new Set<string>();
  for (const candidate of eligibleCandidates) {
    const candidateTokens = tokenSet(candidate.source.matchingText);
    const additions = [...candidateTokens].filter(
      (token) => sentenceTokens.has(token) && !selectedCoverage.has(token)
    );
    const addsContext = additions.some(
      (token) => token.includes("_") || token === "resolved" || token.startsWith("$")
    );
    if (!selected.length || candidate.exact || candidate.linked || additions.length >= 2 || addsContext) {
      selected.push(candidate);
      additions.forEach((token) => selectedCoverage.add(token));
      if (candidate.exact) break;
    }
  }
  if (
    resolvedState.test(options.sentence) &&
    !selected.some((candidate) => resolvedState.test(candidate.source.matchingText))
  ) {
    const resolutionContext = candidates.find((candidate) =>
      resolvedState.test(candidate.source.matchingText)
    );
    if (resolutionContext) selected.push(resolutionContext);
  }
  const coveredTokens = new Set<string>();
  for (const candidate of selected) {
    for (const token of tokenSet(candidate.source.matchingText)) if (sentenceTokens.has(token)) coveredTokens.add(token);
  }
  const coveredMaterialTokens = new Set([...coverageTokens].filter((token) => coveredTokens.has(token)));
  const coverage = coverageTokens.size ? coveredMaterialTokens.size / coverageTokens.size : 0;
  const segments = reviewSegments(options.sentence);
  const supportedPortions = segments.filter((segment) => {
    const segmentTokens = synthesisContext ? synthesisTokenSet(segment) : tokenSet(segment);
    if (!segmentTokens.size) return true;
    const segmentCovered = new Set([...segmentTokens].filter((token) => coveredTokens.has(token)));
    return segmentCovered.size / segmentTokens.size >= 0.65;
  });
  const unsupportedPortions = segments.filter((segment) => !supportedPortions.includes(segment));
  const sourceRefs = selected.map((candidate) => candidate.source.id);
  const issues = Array.from(new Set([
    ...options.validatorIssues,
    ...structuralIssues(
      options.sentence,
      selected.map((candidate) => candidate.source),
      options.sectionKey,
      options.sectionLabel
    )
  ]));

  if (issues.length) {
    return {
      status: "review_needed",
      sourceRefs,
      reason: readableIssue(issues[0]),
      supportedPortions,
      unsupportedPortions: unsupportedPortions.length ? unsupportedPortions : [options.sentence],
      validatorIssues: issues
    };
  }

  const exact = selected.filter((candidate) => candidate.exact);
  if (exact.length) {
    return {
      status: "fact_backed",
      sourceRefs: exact.map((candidate) => candidate.source.id),
      reason: "Supported directly by information supplied for this documentation event.",
      supportedPortions: [options.sentence],
      unsupportedPortions: [],
      validatorIssues: []
    };
  }

  const planClassification = classifyPlanProposition(
    options.sentence,
    options.sectionKey,
    options.sectionLabel
  );
  const coverageThreshold = planClassification.kind === "routine_professional_plan" || planClassification.kind === "professional_recommendation" ? 0 : 0.7;
  if (coverage >= coverageThreshold && sourceRefs.length) {
    const synthesis =
      planClassification.kind === "routine_professional_plan" ||
      planClassification.kind === "professional_recommendation" ||
      sourceRefs.length > 1 ||
      synthesisLanguage.test(options.sentence) ||
      /\b(?:assessment|plan|treatment|objectives?|goals?|interventions?|recommendations?)\b/i.test(`${options.sectionKey} ${options.sectionLabel}`);
    return {
      status: synthesis ? "professional_rewrite" : "fact_backed",
      sourceRefs,
      reason: synthesis
        ? "Professionally organized or interpreted from supported current-generation information without adding a material factual claim."
        : "Semantically restates information supplied for this documentation event.",
      supportedPortions: [options.sentence],
      unsupportedPortions: [],
      validatorIssues: []
    };
  }

  return {
    status: "review_needed",
    sourceRefs,
    reason: unsupportedPortions.length
      ? "Part of this statement could not be sufficiently supported by eligible current-generation information."
      : "LeanMaster could not identify enough supporting current-generation information for this statement.",
    supportedPortions,
    unsupportedPortions: unsupportedPortions.length ? unsupportedPortions : [options.sentence],
    validatorIssues: []
  };
}

type ProvenanceClaimBinding = {
  kind: StructuredClaimKind;
  section: string;
  sourceRefs: string[];
};

function provenanceClaimBindings(provenance: StructuredGeneratedNote) {
  const claims = new Map<string, ProvenanceClaimBinding>();
  provenance.sourceFactClaims.forEach((claim) => claims.set(claim.id, {
    kind: "source_fact_claim", section: claim.section, sourceRefs: [claim.sourceFactId]
  }));
  provenance.qualifiedAssessmentInferences.forEach((claim) => claims.set(claim.id, {
    kind: "qualified_assessment_inference", section: claim.section, sourceRefs: claim.supportingSourceFactIds
  }));
  provenance.performedInterventionClaims.forEach((claim) => claims.set(claim.id, {
    kind: "performed_intervention_claim", section: claim.section, sourceRefs: [claim.sourceFactId]
  }));
  provenance.clientCommitmentClaims.forEach((claim) => claims.set(claim.id, {
    kind: "client_commitment_claim", section: claim.section, sourceRefs: [claim.sourceFactId]
  }));
  provenance.libraryGuidedRecommendations.forEach((claim) => claims.set(claim.id, {
    kind: "library_guided_recommendation",
    section: claim.section,
    sourceRefs: [...claim.supportingSourceFactIds, claim.libraryGuidanceId]
  }));
  provenance.clinicianNextSteps.forEach((claim) => claims.set(claim.id, {
    kind: "clinician_next_step", section: claim.section, sourceRefs: claim.supportingSourceFactIds
  }));
  provenance.coordinationRecommendations.forEach((claim) => claims.set(claim.id, {
    kind: "coordination_recommendation", section: claim.section, sourceRefs: claim.supportingSourceFactIds
  }));
  return claims;
}

function sectionIdentity(value: string) {
  return normalized(value).replace(/\b(?:i|ii|iii|iv|v)\b/g, " ").replace(/\s+/g, " ").trim();
}

function propositionsForUnit(options: {
  unit: { text: string; key: string; heading: string };
  provenance: StructuredGeneratedNote;
}) {
  const text = normalized(options.unit.text);
  const identities = [sectionIdentity(options.unit.key), sectionIdentity(options.unit.heading)].filter(Boolean);
  return options.provenance.propositions.filter((proposition) => {
    const propositionSection = sectionIdentity(proposition.section);
    const sameSection = identities.some((identity) =>
      propositionSection === identity || propositionSection.includes(identity) || identity.includes(propositionSection)
    );
    const propositionText = normalized(proposition.text);
    return sameSection && propositionText.length >= 8 && text.includes(propositionText);
  });
}

function statusFromMappedPropositions(options: {
  sentence: string;
  sectionKey: string;
  sectionLabel: string;
  propositions: StructuredGeneratedProposition[];
  claims: Map<string, ProvenanceClaimBinding>;
  sources: InternalNoteOriginSource[];
  validateUnit?: (unit: { text: string; sectionKey: string; sectionLabel: string }) => string[];
}): NoteOriginClassification | null {
  if (!options.propositions.length) return null;
  const sourcesById = new Map(options.sources.map((source) => [source.id, source]));
  const propositionResults = options.propositions.map((proposition) => {
    const bindings = proposition.claimIds.map((claimId) => options.claims.get(claimId)).filter(Boolean) as ProvenanceClaimBinding[];
    const sourceRefs = Array.from(new Set(bindings.flatMap((binding) => binding.sourceRefs))).filter((id) => sourcesById.has(id));
    const supportingSources = sourceRefs.map((id) => sourcesById.get(id)).filter(Boolean) as InternalNoteOriginSource[];
    const issues = Array.from(new Set([
      ...(options.validateUnit?.({ text: proposition.text, sectionKey: options.sectionKey, sectionLabel: options.sectionLabel }) || []),
      ...structuralIssues(proposition.text, supportingSources, options.sectionKey, options.sectionLabel),
      ...(!bindings.length || !sourceRefs.length ? ["missing_structured_proposition_source"] : [])
    ]));
    return { proposition, bindings, sourceRefs, supportingSources, issues };
  });
  const issues = Array.from(new Set(propositionResults.flatMap((result) => result.issues)));
  const sourceRefs = Array.from(new Set(propositionResults.flatMap((result) => result.sourceRefs)));
  if (issues.length) {
    return {
      status: "review_needed",
      sourceRefs,
      reason: issues[0] === "missing_structured_proposition_source"
        ? "The preserved generation-time proposition map did not contain a valid current-generation source."
        : readableIssue(issues[0]),
      supportedPortions: propositionResults.filter((result) => !result.issues.length).map((result) => result.proposition.text),
      unsupportedPortions: propositionResults.filter((result) => result.issues.length).map((result) => result.proposition.text),
      validatorIssues: issues
    };
  }
  const directKinds = new Set<StructuredClaimKind>([
    "source_fact_claim", "performed_intervention_claim", "client_commitment_claim"
  ]);
  const directExact = propositionResults.every((result) =>
    result.bindings.every((binding) => directKinds.has(binding.kind)) &&
    result.supportingSources.some((source) => exactSupport(result.proposition.text, source.matchingText))
  );
  return {
    status: directExact ? "fact_backed" : "professional_rewrite",
    sourceRefs,
    reason: directExact
      ? "Supported directly by the preserved generation-time proposition map."
      : "Professionally organized or interpreted from the preserved generation-time proposition map without adding a material factual claim.",
    supportedPortions: [options.sentence],
    unsupportedPortions: [],
    validatorIssues: []
  };
}

export function evaluateNoteOriginSections(options: {
  sections: Array<{ key: string; heading: string; content: string }>;
  baseSections: Array<{ key: string; heading: string; content: string }>;
  sources: InternalNoteOriginSource[];
  linkedSourceRefs?: Record<string, string[]>;
  provenance?: StructuredGeneratedNote;
  reviewUnitManifest?: NoteOriginReviewUnitManifest;
  validateUnit?: (unit: { text: string; sectionKey: string; sectionLabel: string }) => string[];
}) {
  const baseTexts = new Set(noteOriginReviewUnits(options.baseSections).map((unit) => `${unit.key}\0${normalized(unit.text)}`));
  const claims = options.provenance ? provenanceClaimBindings(options.provenance) : null;
  const manifestById = new Map(
    (options.reviewUnitManifest?.units || []).map((unit) => [unit.id, unit])
  );
  const synthesisSection = (sectionKey: string, sectionLabel: string) =>
    /\b(?:assessment|plan|objective|goal|intervention|recommendation)\b/i.test(
      `${sectionKey} ${sectionLabel}`
    );
  return noteOriginReviewUnits(options.sections).flatMap((unit): NoteOriginSentence[] => {
    const changed = !baseTexts.has(`${unit.key}\0${normalized(unit.text)}`);
    const manifestCandidate = !changed ? manifestById.get(unit.id) : undefined;
    const manifestEntry =
      manifestCandidate &&
      manifestCandidate.sectionKey === unit.key &&
      normalized(manifestCandidate.text) === normalized(unit.text)
        ? manifestCandidate
        : undefined;
    if (manifestEntry?.eligibility === "excluded_scaffolding") return [];

    const mappedPropositions = !changed && options.provenance
      ? propositionsForUnit({ unit, provenance: options.provenance })
      : [];
    const mapped = !changed && options.provenance && claims
      ? statusFromMappedPropositions({
          sentence: unit.text,
          sectionKey: unit.key,
          sectionLabel: unit.heading,
          propositions: mappedPropositions,
          claims,
          sources: options.sources,
          validateUnit: options.validateUnit
        })
      : null;
    const exactDiagnosisSource = options.sources.find(
      (source) =>
        source.sourceType === "selected_diagnosis" &&
        normalized(source.matchingText) === normalized(unit.text)
    );
    const mappedKinds = mappedPropositions.flatMap((proposition) =>
      proposition.claimIds
        .map((claimId) => claims?.get(claimId)?.kind)
        .filter(Boolean) as StructuredClaimKind[]
    );
    const mappedUnitType: NoteOriginReviewUnitType = mappedKinds.includes(
      "library_guided_recommendation"
    )
      ? "clinical_library_guidance"
      : synthesisSection(unit.key, unit.heading) ||
          mappedKinds.some((kind) =>
            [
              "qualified_assessment_inference",
              "clinician_next_step",
              "coordination_recommendation"
            ].includes(kind)
          )
        ? "professional_synthesis"
        : "clinical_fact";

    const unitType: NoteOriginReviewUnitType =
      manifestEntry?.unitType ||
      (exactDiagnosisSource
        ? "professional_selected_diagnosis"
        : mappedPropositions.length
          ? mappedUnitType
          : synthesisSection(unit.key, unit.heading)
            ? "professional_synthesis"
            : "clinical_fact");
    const eligibility: NoteOriginReviewEligibility =
      manifestEntry?.eligibility ||
      (exactDiagnosisSource
        ? "provenance_metadata"
        : unitType === "professional_synthesis" || unitType === "clinical_library_guidance"
          ? "synthesis_review"
          : "clinical_review");

    let result: NoteOriginClassification;
    if (eligibility === "provenance_metadata") {
      const sourceRefs = Array.from(
        new Set(manifestEntry?.sourceRefs || (exactDiagnosisSource ? [exactDiagnosisSource.id] : []))
      );
      const authorized = sourceRefs.length > 0 && sourceRefs.every((sourceRef) => {
        const source = options.sources.find((candidate) => candidate.id === sourceRef);
        return unitType === "professional_selected_diagnosis"
          ? source?.sourceType === "selected_diagnosis"
          : source?.sourceType === "clinical_library";
      });
      result = authorized
        ? {
            status: "source_metadata",
            sourceRefs,
            reason:
              unitType === "professional_selected_diagnosis"
                ? "This identifier comes from the professional-selected diagnosis for the current documentation event."
                : "This is authorized current-generation Clinical Library citation or reference metadata, not an independent client-specific clinical claim.",
            supportedPortions: [unit.text],
            unsupportedPortions: [],
            validatorIssues: []
          }
        : {
            status: "review_needed",
            sourceRefs: [],
            reason: "The provenance metadata did not retain a valid authorized current-generation source record.",
            supportedPortions: [],
            unsupportedPortions: [unit.text],
            validatorIssues: ["missing_authorized_metadata_source"]
          };
    } else if (
      manifestEntry?.unitType === "clinical_library_guidance" &&
      manifestEntry.sourceRefs.length
    ) {
      const supportingSources = manifestEntry.sourceRefs
        .map((sourceRef) => options.sources.find((source) => source.id === sourceRef))
        .filter(Boolean) as InternalNoteOriginSource[];
      const issues = Array.from(new Set([
        ...(options.validateUnit?.({ text: unit.text, sectionKey: unit.key, sectionLabel: unit.heading }) || []),
        ...structuralIssues(unit.text, supportingSources, unit.key, unit.heading),
        ...(supportingSources.length === manifestEntry.sourceRefs.length &&
        supportingSources.every((source) => source.sourceType === "clinical_library")
          ? []
          : ["missing_authorized_library_source"])
      ]));
      result = issues.length
        ? {
            status: "review_needed",
            sourceRefs: manifestEntry.sourceRefs,
            reason: readableIssue(issues[0]),
            supportedPortions: [],
            unsupportedPortions: [unit.text],
            validatorIssues: issues
          }
        : {
            status: "professional_rewrite",
            sourceRefs: manifestEntry.sourceRefs,
            reason: "Authorized current-generation LeanMaster Clinical Library guidance supports this prospective professional synthesis.",
            supportedPortions: [unit.text],
            unsupportedPortions: [],
            validatorIssues: []
          };
    } else {
      result = mapped || statusFor({
        sentence: unit.text,
        sectionKey: unit.key,
        sectionLabel: unit.heading,
        sources: options.sources,
        linkedSourceRefs: options.linkedSourceRefs?.[unit.id] || [],
        changed,
        validatorIssues: options.validateUnit?.({ text: unit.text, sectionKey: unit.key, sectionLabel: unit.heading }) || []
      });
    }
    return [{
      id: unit.id,
      sectionKey: unit.key,
      sectionLabel: unit.heading,
      text: unit.text,
      unitType,
      eligibility,
      changed,
      ...result
    }];
  });
}

export function validateNoteOriginSentenceStatuses(sentences: NoteOriginSentence[], sources: InternalNoteOriginSource[]) {
  const validIds = new Set(sources.map((source) => source.id));
  return sentences.map((sentence) => {
    const validRefs = sentence.sourceRefs.filter((sourceRef) => validIds.has(sourceRef));
    if (
      (sentence.status === "fact_backed" ||
        sentence.status === "professional_rewrite" ||
        sentence.status === "source_metadata") &&
      !validRefs.length
    ) {
      return {
        ...sentence,
        status: "review_needed" as NoteOriginStatus,
        sourceRefs: [],
        reason: "LeanMaster could not verify a supporting current-generation source.",
        supportedPortions: [],
        unsupportedPortions: [sentence.text]
      };
    }
    return { ...sentence, sourceRefs: validRefs };
  });
}

// Expose unchanged production primitives for the stricter intake policy adapter.
export { statusFor, structuralIssues, contextCompatible, reviewSegments, tokenSet, synthesisTokenSet, sourceEligible };
