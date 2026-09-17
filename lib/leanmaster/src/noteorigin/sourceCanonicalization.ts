// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
export const NOTEORIGIN_SOURCE_INDEXING =
  "noteorigin-canonical-source.v1" as const;

export function canonicalizeNoteOriginSourceText(value: string) {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

type CanonicalCodeUnit = {
  value: string;
  originalStart: number;
  originalEnd: number;
};

function graphemeSegments(value: string) {
  const Segmenter = Intl.Segmenter;
  if (!Segmenter) {
    let offset = 0;
    return Array.from(value, (segment) => {
      const indexed = { segment, index: offset };
      offset += segment.length;
      return indexed;
    });
  }
  return Array.from(
    new Segmenter(undefined, { granularity: "grapheme" }).segment(value),
    ({ segment, index }) => ({ segment, index })
  );
}

/**
 * Projects the canonical generation-source representation back onto the
 * original UTF-16 source value without searching for excerpt text.
 */
export function projectNoteOriginCanonicalSource(value: string) {
  const units: CanonicalCodeUnit[] = [];
  let pendingWhitespace: { originalStart: number; originalEnd: number } | null =
    null;

  const append = (
    text: string,
    originalStart: number,
    originalEnd: number
  ) => {
    for (let index = 0; index < text.length; index += 1) {
      units.push({ value: text[index], originalStart, originalEnd });
    }
  };

  for (const part of graphemeSegments(value)) {
    const normalized = part.segment.normalize("NFKC");
    const originalStart = part.index;
    const originalEnd = part.index + part.segment.length;
    for (const character of normalized) {
      if (/^\s+$/u.test(character)) {
        pendingWhitespace = {
          originalStart: pendingWhitespace
            ? pendingWhitespace.originalStart
            : originalStart,
          originalEnd
        };
        continue;
      }
      if (pendingWhitespace && units.length) {
        append(
          " ",
          pendingWhitespace.originalStart,
          pendingWhitespace.originalEnd
        );
      }
      pendingWhitespace = null;
      append(character, originalStart, originalEnd);
    }
  }

  const text = units.map((unit) => unit.value).join("");
  if (text !== canonicalizeNoteOriginSourceText(value)) return null;
  return { text, units };
}
