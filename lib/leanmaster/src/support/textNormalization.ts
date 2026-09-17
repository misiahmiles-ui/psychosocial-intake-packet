// Ported from misiahmiles-ui/leanmaster-note-engine@ef76ca0735ed841e82fa98eed48420724709468b
// Original: src/support/textNormalization.ts. Only module import paths are adapted.
export type SupportSourceInput = {
  field: string;
  text: string;
};

export type NormalizedSupportSegment = {
  sourceField: string;
  sourceLocation: string;
  startOffset: number;
  endOffset: number;
  originalText: string;
  normalizedText: string;
};

const CHARACTER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[‘’‚‛]/g, "'"],
  [/[“”„‟]/g, '"'],
  [/[‐‑‒–—―]/g, "-"],
  [/\u00a0/g, " "],
  [/\u2026/g, "..."]
];

const CONTRACTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bcan't\b/g, "cannot"],
  [/\bcouldn't\b/g, "could not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwasn't\b/g, "was not"],
  [/\bweren't\b/g, "were not"],
  [/\bwon't\b/g, "will not"],
  [/\bwouldn't\b/g, "would not"],
  [/\bhasn't\b/g, "has not"],
  [/\bhaven't\b/g, "have not"],
  [/\bhadn't\b/g, "had not"]
];

export function normalizeSupportText(value: string) {
  let normalized = value.normalize("NFKC");
  for (const [pattern, replacement] of CHARACTER_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/(?<=\p{L})-(?=\p{L})/gu, " ");
  for (const [pattern, replacement] of CONTRACTION_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/\s+/g, " ").trim();
}

export function segmentSupportSources(
  sources: SupportSourceInput[]
): NormalizedSupportSegment[] {
  const segments: NormalizedSupportSegment[] = [];

  for (const source of sources) {
    // Raw clinician entries commonly use one unpunctuated clinical fragment
    // per line. Treat every newline as a source boundary while preserving the
    // existing punctuation-based sentence boundaries within each line.
    const sentencePattern = /[^.!?\r\n]+(?:[.!?]+|(?=[\r\n])|$)/g;
    let match: RegExpExecArray | null;
    let sentenceIndex = 0;

    while ((match = sentencePattern.exec(source.text)) !== null) {
      const leadingWhitespace = match[0].match(/^\s*/)?.[0].length || 0;
      const trailingWhitespace = match[0].match(/\s*$/)?.[0].length || 0;
      const originalText = match[0]
        .slice(leadingWhitespace, match[0].length - trailingWhitespace)
        .trim();
      if (!originalText) {
        continue;
      }

      const startOffset = match.index + leadingWhitespace;
      const endOffset = startOffset + originalText.length;
      sentenceIndex += 1;
      segments.push({
        sourceField: source.field,
        sourceLocation: `${source.field}:sentence-${sentenceIndex}`,
        startOffset,
        endOffset,
        originalText,
        normalizedText: normalizeSupportText(originalText)
      });
    }
  }

  return segments;
}
