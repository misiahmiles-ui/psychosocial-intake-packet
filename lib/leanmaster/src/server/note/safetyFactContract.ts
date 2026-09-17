// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import { normalizeSupportText } from "@/lib/leanmaster/src/support/textNormalization";

export const safetyFactCategories = [
  "SUICIDAL_IDEATION",
  "SUICIDAL_IDEATION_HISTORY",
  "SUICIDE_PLAN",
  "SUICIDE_INTENT",
  "SUICIDE_PREPARATORY_BEHAVIOR",
  "HOMICIDAL_IDEATION",
  "SELF_HARM",
  "PSYCHOSIS",
  "HALLUCINATIONS",
  "DELUSIONS",
  "COMMAND_HALLUCINATIONS",
  "ABUSE_OR_NEGLECT",
  "ACUTE_MEDICAL_EMERGENCY",
  "FALL_RISK",
  "OVERDOSE",
  "WITHDRAWAL"
] as const;

export type SafetyFactCategory = (typeof safetyFactCategories)[number];

export const safetyFactStates = [
  "PRESENT",
  "DENIED",
  "NOT_ASSESSED",
  "UNKNOWN",
  "HISTORICAL",
  "AMBIGUOUS",
  "NOT_DOCUMENTED"
] as const;

export type SafetyFactState = (typeof safetyFactStates)[number];

export const safetyFactAttributions = [
  "DIRECT_OR_CLINICIAN",
  "THIRD_PARTY",
  "MIXED",
  "NONE"
] as const;
export type SafetyFactAttribution = (typeof safetyFactAttributions)[number];

export const safetyFactThoughtTypes = [
  "PASSIVE",
  "ACTIVE",
  "UNSPECIFIED",
  "NOT_DOCUMENTED"
] as const;
export type SafetyFactThoughtType = (typeof safetyFactThoughtTypes)[number];

export const safetyFactTemporalScopes = [
  "CURRENT",
  "HISTORICAL",
  "UNSPECIFIED",
  "NONE"
] as const;
export type SafetyFactTemporalScope =
  (typeof safetyFactTemporalScopes)[number];

export type SafetyFact = {
  category: SafetyFactCategory;
  state: SafetyFactState;
  attribution: SafetyFactAttribution;
  temporalScope: SafetyFactTemporalScope;
  thoughtType: SafetyFactThoughtType;
  timing: readonly string[];
  evidence: readonly string[];
};

export type SafetyFactContract = {
  schemaVersion: "safety-facts.v2";
  facts: Record<SafetyFactCategory, SafetyFact>;
};

// These categories describe atomic ideation facts, not general risk-level
// assessments. Bare "suicide" or "homicide" wording must not create ideation;
// an explicit ideation/thought/intent/plan assertion or accepted shorthand is
// required. This keeps qualified risk language from reversing a source denial.
const CATEGORY_PATTERNS: Record<SafetyFactCategory, RegExp> = {
  SUICIDAL_IDEATION:
    /\b(?:suicidality|(?:suicidal\s+(?:(?:and|or)\s+homicidal\s+)?|suicide\s+)(?:ideation|thoughts?|intent|plan)|(?:is|was|being|appears?|appeared|became|remains?|endorses?|endorsed|reports?|reported)\s+(?:homicidal\s+(?:and|or)\s+)?suicidal|\bsi\b|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self)|thoughts?\s+of\s+harm(?:ing)?\s+(?:himself|herself|themself|themselves|self))\b/i,
  SUICIDAL_IDEATION_HISTORY:
    /\b(?:suicidality|(?:suicidal\s+(?:(?:and|or)\s+homicidal\s+)?|suicide\s+)(?:ideation|thoughts?|intent|plan)|(?:is|was|being|appears?|appeared|became|remains?|endorses?|endorsed|reports?|reported)\s+(?:homicidal\s+(?:and|or)\s+)?suicidal|\bsi\b|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self)|thoughts?\s+of\s+harm(?:ing)?\s+(?:himself|herself|themself|themselves|self))\b/i,
  SUICIDE_PLAN:
    /\b(?:suicid(?:e|al)\s+plan|plan\s+(?:to|for)\s+(?:die|suicide|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self)))\b/i,
  SUICIDE_INTENT:
    /\b(?:suicid(?:e|al)\s+intent|intent\s+(?:to|for)\s+(?:die|suicide|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self)))\b/i,
  SUICIDE_PREPARATORY_BEHAVIOR:
    /\b(?:suicid(?:e|al)\s+preparatory\s+(?:behavior|behaviour|acts?)|preparatory\s+(?:behavior|behaviour|acts?)\s+(?:for|toward)\s+suicide)\b/i,
  HOMICIDAL_IDEATION:
    /\b(?:homicidality|(?:homicidal\s+(?:(?:and|or)\s+suicidal\s+)?|homicide\s+)(?:ideation|thoughts?|intent|plan)|(?:is|was|being|appears?|appeared|became|remains?|endorses?|endorsed|reports?|reported)\s+(?:suicidal\s+(?:and|or)\s+)?homicidal|\bhi\b|kill(?:ing)?\s+(?:someone|others?|another person)|thoughts?\s+of\s+harm(?:ing)?\s+(?:(?:himself|herself|themself|themselves|self)\s+or\s+)?(?:someone|others?|another person))\b/i,
  SELF_HARM:
    /\b(?:self[- ]harm(?:ing)?|self[- ]injur(?:y|ious)|cutting\s+(?:himself|herself|themself|themselves|self)|non[- ]suicidal self[- ]injury|\bnssi\b)\b/i,
  PSYCHOSIS:
    /\b(?:psychosis|psychotic\s+(?:symptoms?|episode|features?|experiences?))\b/i,
  HALLUCINATIONS:
    /\b(?:hallucinat(?:ion|ions|ing|ed)|hearing\s+voices?|seeing\s+things)\b/i,
  DELUSIONS:
    /\b(?:delusion(?:s|al)?|fixed\s+false\s+beliefs?)\b/i,
  COMMAND_HALLUCINATIONS:
    /(?:^|[\s(])(?:command\s+(?:auditory\s+)?hallucinations?|voices?\s+(?:telling|commanding|ordering)\s+(?:the\s+)?(?:client|member|patient|participant|him|her|them))\b/i,
  ABUSE_OR_NEGLECT:
    /\b(?:(?:physical|sexual|emotional|elder|child|domestic)\s+abuse|abused|neglect(?:ed|ful)?|maltreatment|domestic\s+violence)\b/i,
  ACUTE_MEDICAL_EMERGENCY:
    /\b(?:medical\s+emergency|acute\s+medical\s+(?:risk|concern|crisis)|chest\s+pain|difficulty\s+breathing|unable\s+to\s+breathe|loss\s+of\s+consciousness|unconscious|seizure|stroke\s+symptoms?)\b/i,
  FALL_RISK:
    /\b(?:fall\s+risk|risk\s+of\s+falls?|recent\s+falls?|fell|unsteady\s+gait|frequent\s+falls?)\b/i,
  OVERDOSE:
    /\b(?:overdose(?:d)?|opioid\s+poisoning|naloxone\s+(?:administered|used))\b/i,
  WITHDRAWAL:
    /\b(?:withdrawal\s+(?:symptoms?|risk|syndrome)|delirium\s+tremens|\bdts\b)\b/i
};

const DENIED =
  /\b(?:den(?:y|ies|ied)|denials?(?:\s+of)?|no|never|not\s+(?:experiencing|reporting|endorsing|present|evident|apparent|observed)|without|negative\s+for|does\s+not\s+(?:have|report|endorse)|did\s+not\s+(?:have|report|endorse)|reports?\s+no|endorses?\s+no|absent|absence\s+of|free\s+(?:of|from))\b/i;
const NOT_ASSESSED =
  /\b(?:not\s+(?:assessed|asked|discussed|evaluated|screened)|assessment\s+not\s+completed|was\s+not\s+explored)\b/i;
const NOT_DOCUMENTED =
  /\b(?:not\s+(?:documented|addressed|reported)|no\s+(?:information|documentation)\s+(?:about|regarding))\b/i;
const UNKNOWN =
  /\b(?:unknown|unclear|unable\s+to\s+(?:determine|assess)|insufficient\s+(?:information|evidence)|cannot\s+(?:determine|confirm))\b/i;
const HISTORICAL =
  /\b(?:history\s+of|historical(?:ly)?|previous(?:ly)?|in\s+the\s+past|prior|formerly|resolved|remote|earlier|ever|lifetime|last\s+(?:week|month|year)|(?:(?:approximately|about|around|roughly)\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:days?|weeks?|months?|years?)\s+ago)\b/i;
const CURRENT =
  /\b(?:current(?:ly)?|now|today|at\s+(?:this|the)\s+time|presently)\b/i;
const THIRD_PARTY =
  /\b(?:(?:mother|father|parent|guardian|family|spouse|partner|friend|teacher|caregiver|staff|neighbor)\s+(?:reports?|reported|states?|stated|said|is\s+concerned|was\s+concerned)|according\s+to|per\s+(?:the\s+)?(?:mother|father|parent|guardian|family|teacher|caregiver|staff))\b/i;
const PROSPECTIVE =
  /\b(?:will|plans?\s+to|continue\s+to|monitor(?:ing)?\s+for|screen(?:ing)?\s+for|watch\s+for|follow[- ]?up\s+for|seek\s+help\s+if)\b/i;
const PASSIVE_SUICIDAL_THOUGHT =
  /\b(?:passive(?:\s+suicidal)?\s+(?:ideation|thoughts?)|(?:thoughts?|wishes?)\s+(?:that\s+)?(?:it\s+would\s+be\s+easier\s+(?:not\s+to|if\s+[^.!?;]{0,30}\s+(?:were\s+not|was\s+not))|of\s+not\s+waking\s+up|of\s+being\s+better\s+off\s+dead|of\s+death\s+without\s+(?:a\s+)?plan))\b/i;
const ACTIVE_SUICIDAL_THOUGHT =
  /\b(?:active(?:\s+suicidal)?\s+(?:ideation|thoughts?)|suicidal\s+(?:ideation|thoughts?)\s+with\s+(?:a\s+)?(?:plan|intent))\b/i;
const SUICIDE_PLAN_REFERENCE =
  /\b(?:suicid(?:e|al)\s+plan|plan\s+(?:to|for)\s+(?:die|suicide|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self))|(?:suicidal\s+ideation|suicidal\s+thoughts?|\bsi\b)[^.!?;]{0,80}\bplan)\b/i;
const SUICIDE_INTENT_REFERENCE =
  /\b(?:suicid(?:e|al)\s+intent|intent\s+(?:to|for)\s+(?:die|suicide|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self))|(?:suicidal\s+ideation|suicidal\s+thoughts?|\bsi\b)[^.!?;]{0,80}\bintent)\b/i;
const SUICIDE_PREPARATORY_REFERENCE =
  /\b(?:suicid(?:e|al)\s+preparatory\s+(?:behavior|behaviour|acts?)|preparatory\s+(?:behavior|behaviour|acts?)(?:\s+(?:for|toward)\s+suicide)?)\b/i;
const SUICIDE_CONTEXT =
  /\b(?:suicid(?:e|al|ality)|\bsi\b|kill(?:ing)?\s+(?:himself|herself|themself|themselves|self)|passive\s+(?:ideation|thoughts?))\b/i;
const TIMING =
  /\b(?:(?:approximately|about|around|roughly)\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:days?|weeks?|months?|years?)\s+ago\b|\b(?:last\s+(?:week|month|year)|earlier\s+(?:today|this\s+week|this\s+month|this\s+year)|previously|in\s+the\s+past|historically)\b/gi;

function clauses(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(
      /(?<=[.!?;])\s+|\n+|\s+(?:but|however|while|although)\s+|,\s*(?=(?:(?:the\s+)?(?:member|client|patient|participant)\s+)?(?:(?:now|currently)\s+)?(?:reports?|reported|endorses?|endorsed|denies?|denied|has|had|is|was|experiences?|experienced)\b)|\s+and\s+(?=(?:(?:the\s+)?(?:member|client|patient|participant)\s+)?(?:(?:now|currently)\s+)?(?:reports?|reported|endorses?|endorsed|denies?|denied|has|had|is|was|experiences?|experienced)\b)/i
    )
    .map((clause) => clause.trim())
    .filter(Boolean);
}

export function stateForClause(clause: string): SafetyFactState {
  if (NOT_ASSESSED.test(clause)) return "NOT_ASSESSED";
  if (NOT_DOCUMENTED.test(clause)) return "NOT_DOCUMENTED";
  if (UNKNOWN.test(clause)) return "UNKNOWN";
  if (DENIED.test(clause)) return "DENIED";
  if (HISTORICAL.test(clause)) return "HISTORICAL";
  return "PRESENT";
}

function historicalStateForClause(clause: string): SafetyFactState {
  const state = stateForClause(clause);
  return state === "HISTORICAL" ? "PRESENT" : state;
}

function stateForCategoryClause(
  category: SafetyFactCategory,
  clause: string
): SafetyFactState {
  if (NOT_ASSESSED.test(clause)) return "NOT_ASSESSED";
  if (NOT_DOCUMENTED.test(clause)) return "NOT_DOCUMENTED";
  if (UNKNOWN.test(clause)) return "UNKNOWN";
  if (
    (category === "SUICIDAL_IDEATION" ||
      category === "SUICIDAL_IDEATION_HISTORY") &&
    /\b(?:denies?|denied|does\s+not\s+(?:report|endorse|have)|did\s+not\s+(?:report|endorse|have)|not\s+(?:reporting|endorsing|experiencing)|reports?\s+no|endorses?\s+no|no\s+(?:current\s+)?|absence\s+of|without)\b[^.!?;]{0,80}\b(?:suicidal\s+(?:ideation|thoughts?)|suicidality|\bsi\b|thoughts?\s+of\s+harm(?:ing)?\s+(?:himself|herself|themself|themselves|self))\b/i.test(
      clause
    )
  ) {
    return category === "SUICIDAL_IDEATION_HISTORY" && HISTORICAL.test(clause)
      ? historicalStateForClause(clause)
      : stateForClause(clause);
  }
  if (
    (category === "SUICIDAL_IDEATION" ||
      category === "SUICIDAL_IDEATION_HISTORY") &&
    /\b(?:reports?|reported|endorses?|endorsed|experiences?|experienced|has|had)\s+(?:(?:current|active|historical|past|prior|passive)\s+)*(?:suicidal\s+)?(?:ideation|thoughts?)\b/i.test(
      clause
    )
  ) {
    return category === "SUICIDAL_IDEATION_HISTORY"
      ? "PRESENT"
      : HISTORICAL.test(clause) && !CURRENT.test(clause)
        ? "HISTORICAL"
        : "PRESENT";
  }
  return category === "SUICIDAL_IDEATION_HISTORY"
    ? historicalStateForClause(clause)
    : stateForClause(clause);
}

export function temporalScopeForClause(clause: string): SafetyFactTemporalScope {
  if (CURRENT.test(clause)) return "CURRENT";
  if (HISTORICAL.test(clause)) return "HISTORICAL";
  return "UNSPECIFIED";
}

function timingForClauses(evidence: readonly string[]) {
  return Array.from(
    new Set(
      evidence.flatMap((clause) =>
        Array.from(clause.matchAll(TIMING), (match) =>
          normalizeSupportText(match[0])
        )
      )
    )
  );
}

function suicideIdeationMentioned(clause: string) {
  return (
    CATEGORY_PATTERNS.SUICIDAL_IDEATION.test(clause) ||
    PASSIVE_SUICIDAL_THOUGHT.test(clause) ||
    ACTIVE_SUICIDAL_THOUGHT.test(clause)
  );
}

function categoryMentioned(category: SafetyFactCategory, clause: string) {
  if (
    category === "SUICIDAL_IDEATION" ||
    category === "SUICIDAL_IDEATION_HISTORY"
  ) {
    return suicideIdeationMentioned(clause);
  }
  if (category === "SUICIDE_PLAN") {
    return (
      SUICIDE_PLAN_REFERENCE.test(clause) ||
      (SUICIDE_CONTEXT.test(clause) && /\bplans?\b/i.test(clause))
    );
  }
  if (category === "SUICIDE_INTENT") {
    return (
      SUICIDE_INTENT_REFERENCE.test(clause) ||
      (SUICIDE_CONTEXT.test(clause) && /\bintent\b/i.test(clause))
    );
  }
  if (category === "SUICIDE_PREPARATORY_BEHAVIOR") {
    return (
      SUICIDE_PREPARATORY_REFERENCE.test(clause) ||
      (SUICIDE_CONTEXT.test(clause) &&
        /\bpreparatory\s+(?:behavior|behaviour|acts?)\b/i.test(clause))
    );
  }
  return CATEGORY_PATTERNS[category].test(clause);
}

function isAssertiveEvidence(category: SafetyFactCategory, clause: string) {
  if (!categoryMentioned(category, clause)) return false;
  if (
    PROSPECTIVE.test(clause) &&
    !DENIED.test(clause) &&
    !NOT_ASSESSED.test(clause) &&
    !UNKNOWN.test(clause) &&
    !HISTORICAL.test(clause) &&
    !THIRD_PARTY.test(clause) &&
    !/\b(?:reported|endorsed|present|current|active|observed)\b/i.test(clause)
  ) {
    return false;
  }
  if (
    category === "HALLUCINATIONS" &&
    CATEGORY_PATTERNS.COMMAND_HALLUCINATIONS.test(clause) &&
    !/\b(?:other|non[- ]command|visual)\s+hallucinations?\b/i.test(clause)
  ) {
    return false;
  }
  return true;
}

function evidenceForCategory(
  category: SafetyFactCategory,
  sourceClauses: readonly string[]
) {
  const candidates = sourceClauses.filter((clause) =>
    isAssertiveEvidence(category, clause)
  );
  if (category === "SUICIDAL_IDEATION_HISTORY") {
    return candidates.filter(
      (clause) => temporalScopeForClause(clause) === "HISTORICAL"
    );
  }
  if (category === "SUICIDAL_IDEATION") {
    return candidates.filter(
      (clause) => temporalScopeForClause(clause) !== "HISTORICAL"
    );
  }
  if (
    category === "HOMICIDAL_IDEATION" ||
    category === "SUICIDE_PLAN" ||
    category === "SUICIDE_INTENT" ||
    category === "SUICIDE_PREPARATORY_BEHAVIOR"
  ) {
    const current = candidates.filter(
      (clause) => temporalScopeForClause(clause) !== "HISTORICAL"
    );
    return current.length ? current : candidates;
  }
  return candidates;
}

function collapseAttributions(evidence: readonly string[]): SafetyFactAttribution {
  if (!evidence.length) return "NONE";
  const values = new Set(
    evidence.map((clause) =>
      THIRD_PARTY.test(clause) ? "THIRD_PARTY" : "DIRECT_OR_CLINICIAN"
    )
  );
  return values.size === 1
    ? ([...values][0] as SafetyFactAttribution)
    : "MIXED";
}

function collapseStates(states: readonly SafetyFactState[]): SafetyFactState {
  const documentedStates = states.filter((state) => state !== "NOT_DOCUMENTED");
  const unique = new Set(documentedStates);
  if (!unique.size) return "NOT_DOCUMENTED";
  if (unique.size === 1) return documentedStates[0];
  if (
    unique.has("PRESENT") &&
    !unique.has("DENIED") &&
    !unique.has("NOT_ASSESSED") &&
    !unique.has("UNKNOWN") &&
    !unique.has("AMBIGUOUS")
  ) {
    return "PRESENT";
  }
  return "AMBIGUOUS";
}

function collapseTemporalScope(
  category: SafetyFactCategory,
  evidence: readonly string[]
): SafetyFactTemporalScope {
  if (!evidence.length) return "NONE";
  if (category === "SUICIDAL_IDEATION_HISTORY") return "HISTORICAL";
  const scopes = new Set(evidence.map(temporalScopeForClause));
  if (scopes.has("CURRENT")) return "CURRENT";
  if (scopes.size === 1) return [...scopes][0];
  return "UNSPECIFIED";
}

function collapseThoughtType(
  category: SafetyFactCategory,
  evidence: readonly string[],
  state: SafetyFactState
): SafetyFactThoughtType {
  if (
    !["SUICIDAL_IDEATION", "SUICIDAL_IDEATION_HISTORY"].includes(category) ||
    !["PRESENT", "HISTORICAL"].includes(state)
  ) {
    return "NOT_DOCUMENTED";
  }
  const passive = evidence.some((clause) => PASSIVE_SUICIDAL_THOUGHT.test(clause));
  const active = evidence.some((clause) => ACTIVE_SUICIDAL_THOUGHT.test(clause));
  if (passive && !active) return "PASSIVE";
  if (active && !passive) return "ACTIVE";
  return "UNSPECIFIED";
}

export function extractSafetyFactContract(text: string): SafetyFactContract {
  const sourceClauses = clauses(text);
  const facts = Object.fromEntries(
    safetyFactCategories.map((category) => {
      const evidence = evidenceForCategory(category, sourceClauses);
      const state = collapseStates(
        evidence.map((clause) => stateForCategoryClause(category, clause))
      );
      return [
        category,
        {
          category,
          state,
          attribution: collapseAttributions(evidence),
          temporalScope: collapseTemporalScope(category, evidence),
          thoughtType: collapseThoughtType(category, evidence, state),
          timing:
            category === "SUICIDAL_IDEATION_HISTORY"
              ? timingForClauses(evidence)
              : [],
          evidence: evidence.map((value) => normalizeSupportText(value))
        }
      ];
    })
  ) as unknown as Record<SafetyFactCategory, SafetyFact>;

  return { schemaVersion: "safety-facts.v2", facts };
}

export function compareSafetyFactContracts(
  source: SafetyFactContract,
  generated: SafetyFactContract
) {
  const issues: string[] = [];
  for (const category of safetyFactCategories) {
    const expected = source.facts[category].state;
    const actual = generated.facts[category].state;
    if (expected === "NOT_DOCUMENTED" && actual !== "NOT_DOCUMENTED") {
      issues.push(`unsupported_safety_fact:${category}:${actual}`);
    } else if (expected !== "NOT_DOCUMENTED" && actual === "NOT_DOCUMENTED") {
      issues.push(`omitted_safety_fact:${category}:${expected}`);
    } else if (expected !== actual) {
      issues.push(`changed_safety_fact:${category}:${expected}:${actual}`);
    }
    const expectedAttribution = source.facts[category].attribution;
    const actualAttribution = generated.facts[category].attribution;
    if (
      expected !== "NOT_DOCUMENTED" &&
      actual !== "NOT_DOCUMENTED" &&
      expectedAttribution !== actualAttribution
    ) {
      issues.push(
        `changed_safety_attribution:${category}:${expectedAttribution}:${actualAttribution}`
      );
    }
    if (
      expected !== "NOT_DOCUMENTED" &&
      actual !== "NOT_DOCUMENTED" &&
      expected === actual &&
      source.facts[category].thoughtType !== generated.facts[category].thoughtType
    ) {
      issues.push(
        `changed_safety_thought_type:${category}:${source.facts[category].thoughtType}:${generated.facts[category].thoughtType}`
      );
    }
    if (
      category === "SUICIDAL_IDEATION_HISTORY" &&
      expected !== "NOT_DOCUMENTED" &&
      actual !== "NOT_DOCUMENTED" &&
      expected === actual &&
      source.facts[category].timing.join("|") !==
        generated.facts[category].timing.join("|")
    ) {
      issues.push(`changed_safety_timing:${category}`);
    }
  }
  return issues;
}

export function safetyFactPromptSummary(contract: SafetyFactContract) {
  return safetyFactCategories
    .map(
      (category) =>
        `${category}: ${contract.facts[category].state}; scope=${contract.facts[category].temporalScope}; thoughtType=${contract.facts[category].thoughtType}; timing=${contract.facts[category].timing.join(", ") || "not documented"}; attribution=${contract.facts[category].attribution}`
    )
    .join("\n");
}

export function validateSafetyFactContract(contract: SafetyFactContract) {
  return (
    contract.schemaVersion === "safety-facts.v2" &&
    safetyFactCategories.every((category) =>
      safetyFactStates.includes(contract.facts[category]?.state) &&
      safetyFactAttributions.includes(contract.facts[category]?.attribution) &&
      safetyFactTemporalScopes.includes(contract.facts[category]?.temporalScope) &&
      safetyFactThoughtTypes.includes(contract.facts[category]?.thoughtType) &&
      Array.isArray(contract.facts[category]?.timing)
    )
  );
}
